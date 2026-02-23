import {
    Injectable,
    CanActivate,
    ExecutionContext,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request } from 'express';

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
    private readonly logger = new Logger(RateLimitGuard.name);
    private readonly store = new Map<string, RateLimitEntry>();

    // 100 requests per hour per IP
    private readonly limit = 100;
    private readonly windowMs = 60 * 60 * 1000; // 1 hour

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();
        const clientIp = this.getClientIp(request);
        const now = Date.now();

        let entry = this.store.get(clientIp);

        // Clean expired entry
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
            throw new HttpException(
                {
                    statusCode: HttpStatus.TOO_MANY_REQUESTS,
                    message: 'Rate limit exceeded. Maximum 100 scans per hour.',
                    retryAfter,
                },
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        entry.count++;
        return true;
    }

    private getClientIp(request: Request): string {
        const forwarded = request.headers['x-forwarded-for'];
        if (typeof forwarded === 'string') {
            return forwarded.split(',')[0].trim();
        }
        return request.ip || request.socket.remoteAddress || 'unknown';
    }
}
