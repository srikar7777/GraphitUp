import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { Scan, ScanStatus } from './entities/scan.entity.js';
import { CreateScanDto } from './dto/create-scan.dto.js';

@Injectable()
export class ScanService {
    constructor(
        @InjectRepository(Scan)
        private readonly scanRepository: Repository<Scan>,
        @InjectQueue('scan-queue')
        private readonly scanQueue: Queue,
    ) { }

    async createScan(createScanDto: CreateScanDto): Promise<Scan> {
        const scan = this.scanRepository.create({
            url: createScanDto.url,
            status: ScanStatus.PENDING,
        });

        const savedScan = await this.scanRepository.save(scan);

        // Add job to the queue
        await this.scanQueue.add(
            'analyze',
            {
                scanId: savedScan.id,
                url: savedScan.url,
            },
            {
                jobId: `scan-${savedScan.id}`,
                attempts: 3,
                timeout: 120000, // 120s
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
                removeOnComplete: true,
                removeOnFail: false,
            },
        );

        return savedScan;
    }

    async getScan(id: string): Promise<Scan> {
        const scan = await this.scanRepository.findOne({ where: { id } });
        if (!scan) {
            throw new NotFoundException(`Scan with ID "${id}" not found`);
        }
        return scan;
    }

    async listScans(limit = 20): Promise<Scan[]> {
        return this.scanRepository.find({
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }

    async updateScanStatus(
        id: string,
        status: ScanStatus,
        updates: Partial<Pick<Scan, 'currentPhase' | 'progress' | 'result' | 'errorMessage' | 'completedAt'>> = {},
    ): Promise<Scan> {
        const scan = await this.getScan(id);
        scan.status = status;
        Object.assign(scan, updates);
        return this.scanRepository.save(scan);
    }
}
