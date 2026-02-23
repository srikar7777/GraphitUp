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
exports.ScanController = void 0;
const common_1 = require("@nestjs/common");
const scan_service_js_1 = require("./scan.service.js");
const create_scan_dto_js_1 = require("./dto/create-scan.dto.js");
const rate_limit_guard_js_1 = require("../validation/rate-limit.guard.js");
let ScanController = class ScanController {
    scanService;
    constructor(scanService) {
        this.scanService = scanService;
    }
    async createScan(createScanDto) {
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
    async listScans(limit) {
        const parsedLimit = limit ? Math.min(parseInt(limit, 10), 50) : 20;
        const scans = await this.scanService.listScans(parsedLimit);
        return {
            success: true,
            data: scans,
            count: scans.length,
        };
    }
    async getScan(id) {
        const scan = await this.scanService.getScan(id);
        return {
            success: true,
            data: scan,
        };
    }
};
exports.ScanController = ScanController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(rate_limit_guard_js_1.RateLimitGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_scan_dto_js_1.CreateScanDto]),
    __metadata("design:returntype", Promise)
], ScanController.prototype, "createScan", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ScanController.prototype, "listScans", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ScanController.prototype, "getScan", null);
exports.ScanController = ScanController = __decorate([
    (0, common_1.Controller)('scans'),
    __metadata("design:paramtypes", [scan_service_js_1.ScanService])
], ScanController);
//# sourceMappingURL=scan.controller.js.map