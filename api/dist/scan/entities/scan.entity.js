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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scan = exports.ScanStatus = void 0;
const typeorm_1 = require("typeorm");
var ScanStatus;
(function (ScanStatus) {
    ScanStatus["PENDING"] = "pending";
    ScanStatus["SCANNING"] = "scanning";
    ScanStatus["COMPLETED"] = "completed";
    ScanStatus["FAILED"] = "failed";
})(ScanStatus || (exports.ScanStatus = ScanStatus = {}));
let Scan = class Scan {
    id;
    url;
    status;
    currentPhase;
    progress;
    result;
    errorMessage;
    createdAt;
    updatedAt;
    completedAt;
};
exports.Scan = Scan;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Scan.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 2048 }),
    __metadata("design:type", String)
], Scan.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ScanStatus,
        default: ScanStatus.PENDING,
    }),
    __metadata("design:type", String)
], Scan.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Scan.prototype, "currentPhase", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Scan.prototype, "progress", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Scan.prototype, "result", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Scan.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Scan.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Scan.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Scan.prototype, "completedAt", void 0);
exports.Scan = Scan = __decorate([
    (0, typeorm_1.Entity)('scans')
], Scan);
//# sourceMappingURL=scan.entity.js.map