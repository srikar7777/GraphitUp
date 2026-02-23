"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ScanProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScanProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const scan_gateway_js_1 = require("../websocket/scan.gateway.js");
const scan_service_js_1 = require("../scan/scan.service.js");
const scan_entity_js_1 = require("../scan/entities/scan.entity.js");
const SCAN_PHASES = [
    { name: 'dns', displayName: 'DNS Resolution', progressStart: 0, progressEnd: 20 },
    { name: 'tls', displayName: 'TLS Analysis', progressStart: 20, progressEnd: 40 },
    { name: 'http', displayName: 'HTTP Analysis', progressStart: 40, progressEnd: 60 },
    { name: 'crawl', displayName: 'Page Crawling', progressStart: 60, progressEnd: 80 },
    { name: 'inference', displayName: 'Architecture Inference', progressStart: 80, progressEnd: 100 },
];
let ScanProcessor = ScanProcessor_1 = class ScanProcessor {
    scanGateway;
    scanService;
    logger = new common_1.Logger(ScanProcessor_1.name);
    constructor(scanGateway, scanService) {
        this.scanGateway = scanGateway;
        this.scanService = scanService;
    }
    async handleScan(job) {
        const { scanId, url } = job.data;
        this.logger.log(`Starting scan ${scanId} for ${url}`);
        try {
            await this.scanService.updateScanStatus(scanId, scan_entity_js_1.ScanStatus.SCANNING, {
                currentPhase: 'Initializing',
                progress: 0,
            });
            const results = {};
            for (const phase of SCAN_PHASES) {
                this.logger.log(`Scan ${scanId}: Starting phase ${phase.name}`);
                this.scanGateway.emitProgress({
                    scanId,
                    phase: phase.displayName,
                    progress: phase.progressStart,
                    message: `Starting ${phase.displayName}...`,
                });
                await this.scanService.updateScanStatus(scanId, scan_entity_js_1.ScanStatus.SCANNING, {
                    currentPhase: phase.displayName,
                    progress: phase.progressStart,
                });
                const phaseResult = await this.runPhase(phase.name, url, scanId, phase, results);
                results[phase.name] = phaseResult;
                this.scanGateway.emitProgress({
                    scanId,
                    phase: phase.displayName,
                    progress: phase.progressEnd,
                    message: `${phase.displayName} complete`,
                    data: phaseResult,
                });
                await job.progress(phase.progressEnd);
            }
            await this.scanService.updateScanStatus(scanId, scan_entity_js_1.ScanStatus.COMPLETED, {
                currentPhase: null,
                progress: 100,
                result: results,
                completedAt: new Date(),
            });
            this.scanGateway.emitComplete({ scanId, result: results });
            this.logger.log(`Scan ${scanId} completed successfully`);
            return results;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Scan ${scanId} failed: ${errorMessage}`);
            await this.scanService.updateScanStatus(scanId, scan_entity_js_1.ScanStatus.FAILED, {
                errorMessage,
                progress: 0,
            });
            this.scanGateway.emitError({ scanId, error: errorMessage });
            throw error;
        }
    }
    async runPhase(phaseName, url, scanId, phaseConfig, allResults) {
        const WORKER_URL = process.env.WORKER_URL || 'http://localhost:8000';
        this.scanGateway.emitProgress({
            scanId,
            phase: phaseConfig.displayName,
            progress: phaseConfig.progressStart + 5,
            message: `Sending request to worker...`,
        });
        const payload = phaseName === 'inference'
            ? { ...allResults }
            : { url, scanId };
        try {
            const response = await fetch(`${WORKER_URL}/analyze/${phaseName}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                throw new Error(`Worker returned HTTP ${response.status}`);
            }
            const result = await response.json();
            if (!result.success) {
                throw new Error(`Worker failed: ${result.error}`);
            }
            return {
                timestamp: new Date().toISOString(),
                data: result.data,
            };
        }
        catch (error) {
            this.logger.error(`Phase ${phaseName} failed:`, error);
            throw error;
        }
    }
};
exports.ScanProcessor = ScanProcessor;
__decorate([
    (0, bull_1.Process)('analyze'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ScanProcessor.prototype, "handleScan", null);
exports.ScanProcessor = ScanProcessor = ScanProcessor_1 = __decorate([
    (0, bull_1.Processor)('scan-queue'),
    __metadata("design:paramtypes", [scan_gateway_js_1.ScanGateway,
        scan_service_js_1.ScanService])
], ScanProcessor);
//# sourceMappingURL=scan.processor.js.map