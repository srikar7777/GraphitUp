import type { Job } from 'bull';
import { ScanGateway } from '../websocket/scan.gateway.js';
import { ScanService } from '../scan/scan.service.js';
interface ScanJobData {
    scanId: string;
    url: string;
}
export declare class ScanProcessor {
    private readonly scanGateway;
    private readonly scanService;
    private readonly logger;
    constructor(scanGateway: ScanGateway, scanService: ScanService);
    handleScan(job: Job<ScanJobData>): Promise<Record<string, any>>;
    private runPhase;
}
export {};
