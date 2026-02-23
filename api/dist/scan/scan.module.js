"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScanModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const bull_1 = require("@nestjs/bull");
const scan_entity_js_1 = require("./entities/scan.entity.js");
const scan_service_js_1 = require("./scan.service.js");
const scan_controller_js_1 = require("./scan.controller.js");
let ScanModule = class ScanModule {
};
exports.ScanModule = ScanModule;
exports.ScanModule = ScanModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([scan_entity_js_1.Scan]),
            bull_1.BullModule.registerQueue({
                name: 'scan-queue',
            }),
        ],
        controllers: [scan_controller_js_1.ScanController],
        providers: [scan_service_js_1.ScanService],
        exports: [scan_service_js_1.ScanService],
    })
], ScanModule);
//# sourceMappingURL=scan.module.js.map