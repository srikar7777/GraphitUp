"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RateLimitGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitGuard = void 0;
const common_1 = require("@nestjs/common");
let RateLimitGuard = RateLimitGuard_1 = class RateLimitGuard {
    logger = new common_1.Logger(RateLimitGuard_1.name);
    store = new Map();
    limit = 100;
    windowMs = 60 * 60 * 1000;
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const clientIp = this.getClientIp(request);
        const now = Date.now();
        let entry = this.store.get(clientIp);
        if (entry && now > entry.resetAt) {
            this.store.delete(clientIp);
            entry = undefined;
        }
        if (!entry) {
            this.store.set(clientIp, {
                count: 1,
                resetAt: now + this.windowMs,
            });
            return true;
        }
        if (entry.count >= this.limit) {
            const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
            this.logger.warn(`Rate limit exceeded for IP: ${clientIp}`);
            throw new common_1.HttpException({
                statusCode: common_1.HttpStatus.TOO_MANY_REQUESTS,
                message: 'Rate limit exceeded. Maximum 100 scans per hour.',
                retryAfter,
            }, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        entry.count++;
        return true;
    }
    getClientIp(request) {
        const forwarded = request.headers['x-forwarded-for'];
        if (typeof forwarded === 'string') {
            return forwarded.split(',')[0].trim();
        }
        return request.ip || request.socket.remoteAddress || 'unknown';
    }
};
exports.RateLimitGuard = RateLimitGuard;
exports.RateLimitGuard = RateLimitGuard = RateLimitGuard_1 = __decorate([
    (0, common_1.Injectable)()
], RateLimitGuard);
//# sourceMappingURL=rate-limit.guard.js.map