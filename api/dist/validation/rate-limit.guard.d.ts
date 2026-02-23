import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class RateLimitGuard implements CanActivate {
    private readonly logger;
    private readonly store;
    private readonly limit;
    private readonly windowMs;
    canActivate(context: ExecutionContext): boolean;
    private getClientIp;
}
