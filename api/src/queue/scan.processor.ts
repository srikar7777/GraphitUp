import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { ScanGateway } from '../websocket/scan.gateway.js';
import { ScanService } from '../scan/scan.service.js';
import { ScanStatus } from '../scan/entities/scan.entity.js';

interface ScanJobData {
    scanId: string;
    url: string;
}

interface PhaseConfig {
    name: string;
    displayName: string;
    progressStart: number;
    progressEnd: number;
}

const SCAN_PHASES: PhaseConfig[] = [
    { name: 'dns', displayName: 'DNS Resolution', progressStart: 0, progressEnd: 20 },
    { name: 'tls', displayName: 'TLS Analysis', progressStart: 20, progressEnd: 40 },
    { name: 'http', displayName: 'HTTP Analysis', progressStart: 40, progressEnd: 60 },
    { name: 'crawl', displayName: 'Page Crawling', progressStart: 60, progressEnd: 80 },
    { name: 'inference', displayName: 'Architecture Inference', progressStart: 80, progressEnd: 100 },
];

@Processor('scan-queue')
export class ScanProcessor {
    private readonly logger = new Logger(ScanProcessor.name);

    constructor(
        private readonly scanGateway: ScanGateway,
        private readonly scanService: ScanService,
    ) { }

    @Process('analyze')
    async handleScan(job: Job<ScanJobData>) {
        const { scanId, url } = job.data;
        this.logger.log(`Starting scan ${scanId} for ${url}`);

        try {
            // Mark scan as in progress
            await this.scanService.updateScanStatus(scanId, ScanStatus.SCANNING, {
                currentPhase: 'Initializing',
                progress: 0,
            });

            const results: Record<string, any> = {};

            for (const phase of SCAN_PHASES) {
                this.logger.log(`Scan ${scanId}: Starting phase ${phase.name}`);

                // Emit phase start
                this.scanGateway.emitProgress({
                    scanId,
                    phase: phase.displayName,
                    progress: phase.progressStart,
                    message: `Starting ${phase.displayName}...`,
                });

                // Update DB
                await this.scanService.updateScanStatus(scanId, ScanStatus.SCANNING, {
                    currentPhase: phase.displayName,
                    progress: phase.progressStart,
                });

                // Run the analysis phase
                const phaseResult = await this.runPhase(phase.name, url, scanId, phase, results);
                results[phase.name] = phaseResult;

                // Emit phase complete
                this.scanGateway.emitProgress({
                    scanId,
                    phase: phase.displayName,
                    progress: phase.progressEnd,
                    message: `${phase.displayName} complete`,
                    data: phaseResult,
                });

                // Update job progress for Bull
                await job.progress(phase.progressEnd);
            }

            // Mark scan as completed
            await this.scanService.updateScanStatus(scanId, ScanStatus.COMPLETED, {
                currentPhase: null,
                progress: 100,
                result: results,
                completedAt: new Date(),
            });

            // Emit final result
            this.scanGateway.emitComplete({ scanId, result: results });

            this.logger.log(`Scan ${scanId} completed successfully`);
            return results;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Scan ${scanId} failed: ${errorMessage}`);

            await this.scanService.updateScanStatus(scanId, ScanStatus.FAILED, {
                errorMessage,
                progress: 0,
            });

            this.scanGateway.emitError({ scanId, error: errorMessage });
            throw error;
        }
    }

    private async runPhase(
        phaseName: string,
        url: string,
        scanId: string,
        phaseConfig: PhaseConfig,
        allResults?: Record<string, any>,
    ): Promise<Record<string, any>> {
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

        } catch (error) {
            this.logger.error(`Phase ${phaseName} failed:`, error);
            throw error;
        }
    }
}
