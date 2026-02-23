import { ScanService } from './scan.service.js';
import { CreateScanDto } from './dto/create-scan.dto.js';
export declare class ScanController {
    private readonly scanService;
    constructor(scanService: ScanService);
    createScan(createScanDto: CreateScanDto): Promise<{
        success: boolean;
        data: {
            id: string;
            url: string;
            status: import("./entities/scan.entity.js").ScanStatus;
            createdAt: Date;
        };
        message: string;
    }>;
    listScans(limit?: string): Promise<{
        success: boolean;
        data: import("./entities/scan.entity.js").Scan[];
        count: number;
    }>;
    getScan(id: string): Promise<{
        success: boolean;
        data: import("./entities/scan.entity.js").Scan;
    }>;
}
