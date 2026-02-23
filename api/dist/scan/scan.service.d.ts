import { Repository } from 'typeorm';
import type { Queue } from 'bull';
import { Scan, ScanStatus } from './entities/scan.entity.js';
import { CreateScanDto } from './dto/create-scan.dto.js';
export declare class ScanService {
    private readonly scanRepository;
    private readonly scanQueue;
    constructor(scanRepository: Repository<Scan>, scanQueue: Queue);
    createScan(createScanDto: CreateScanDto): Promise<Scan>;
    getScan(id: string): Promise<Scan>;
    listScans(limit?: number): Promise<Scan[]>;
    updateScanStatus(id: string, status: ScanStatus, updates?: Partial<Pick<Scan, 'currentPhase' | 'progress' | 'result' | 'errorMessage' | 'completedAt'>>): Promise<Scan>;
}
