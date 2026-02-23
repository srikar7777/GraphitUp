"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationModule = void 0;
const common_1 = require("@nestjs/common");
const url_validation_service_js_1 = require("./url-validation.service.js");
const rate_limit_guard_js_1 = require("./rate-limit.guard.js");
let ValidationModule = class ValidationModule {
};
exports.ValidationModule = ValidationModule;
exports.ValidationModule = ValidationModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [url_validation_service_js_1.UrlValidationService, rate_limit_guard_js_1.RateLimitGuard],
        exports: [url_validation_service_js_1.UrlValidationService, rate_limit_guard_js_1.RateLimitGuard],
    })
], ValidationModule);
//# sourceMappingURL=url-validation.module.js.map