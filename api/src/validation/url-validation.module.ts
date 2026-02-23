import { Module, Global } from '@nestjs/common';
import { UrlValidationService } from './url-validation.service.js';
import { RateLimitGuard } from './rate-limit.guard.js';

@Global()
@Module({
    providers: [UrlValidationService, RateLimitGuard],
    exports: [UrlValidationService, RateLimitGuard],
})
export class ValidationModule { }
