import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Scan } from './entities/scan.entity.js';
import { ScanService } from './scan.service.js';
import { ScanController } from './scan.controller.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([Scan]),
        BullModule.registerQueue({
            name: 'scan-queue',
        }),
    ],
    controllers: [ScanController],
    providers: [ScanService],
    exports: [ScanService],
})
export class ScanModule { }
