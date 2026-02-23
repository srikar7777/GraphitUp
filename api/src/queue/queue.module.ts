import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScanProcessor } from './scan.processor.js';
import { ScanModule } from '../scan/scan.module.js';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'scan-queue',
        }),
        ScanModule,
    ],
    providers: [ScanProcessor],
})
export class QueueModule { }
