import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    Query,
    ParseUUIDPipe,
    UseGuards,
} from '@nestjs/common';
import { ScanService } from './scan.service.js';
import { CreateScanDto } from './dto/create-scan.dto.js';
import { RateLimitGuard } from '../validation/rate-limit.guard.js';

@Controller('scans')
export class ScanController {
    constructor(private readonly scanService: ScanService) { }

    @Post()
    @UseGuards(RateLimitGuard)
    async createScan(@Body() createScanDto: CreateScanDto) {
        const scan = await this.scanService.createScan(createScanDto);
        return {
            success: true,
            data: {
                id: scan.id,
                url: scan.url,
                status: scan.status,
                createdAt: scan.createdAt,
            },
            message: 'Scan queued successfully. Subscribe to WebSocket for real-time updates.',
        };
    }

    @Get()
    async listScans(@Query('limit') limit?: string) {
        const parsedLimit = limit ? Math.min(parseInt(limit, 10), 50) : 20;
        const scans = await this.scanService.listScans(parsedLimit);
        return {
            success: true,
            data: scans,
            count: scans.length,
        };
    }

    @Get(':id')
    async getScan(@Param('id', ParseUUIDPipe) id: string) {
        const scan = await this.scanService.getScan(id);
        return {
            success: true,
            data: scan,
        };
    }
}
