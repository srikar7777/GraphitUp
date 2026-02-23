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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScanService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bull_1 = require("@nestjs/bull");
const scan_entity_js_1 = require("./entities/scan.entity.js");
let ScanService = class ScanService {
    scanRepository;
    scanQueue;
    constructor(scanRepository, scanQueue) {
        this.scanRepository = scanRepository;
        this.scanQueue = scanQueue;
    }
    async createScan(createScanDto) {
        const scan = this.scanRepository.create({
            url: createScanDto.url,
            status: scan_entity_js_1.ScanStatus.PENDING,
        });
        const savedScan = await this.scanRepository.save(scan);
        await this.scanQueue.add('analyze', {
            scanId: savedScan.id,
            url: savedScan.url,
        }, {
            jobId: `scan-${savedScan.id}`,
            attempts: 3,
            timeout: 120000,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
            removeOnComplete: true,
            removeOnFail: false,
        });
        return savedScan;
    }
    async getScan(id) {
        const scan = await this.scanRepository.findOne({ where: { id } });
        if (!scan) {
            throw new common_1.NotFoundException(`Scan with ID "${id}" not found`);
        }
        return scan;
    }
    async listScans(limit = 20) {
        return this.scanRepository.find({
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }
    async updateScanStatus(id, status, updates = {}) {
        const scan = await this.getScan(id);
        scan.status = status;
        Object.assign(scan, updates);
        return this.scanRepository.save(scan);
    }
};
exports.ScanService = ScanService;
exports.ScanService = ScanService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(scan_entity_js_1.Scan)),
    __param(1, (0, bull_1.InjectQueue)('scan-queue')),
    __metadata("design:paramtypes", [typeorm_2.Repository, Object])
], ScanService);
//# sourceMappingURL=scan.service.js.map