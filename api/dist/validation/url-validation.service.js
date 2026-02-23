"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var UrlValidationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UrlValidationService = void 0;
const common_1 = require("@nestjs/common");
const dns = __importStar(require("dns"));
const net = __importStar(require("net"));
const url_1 = require("url");
const BLOCKED_IP_RANGES = [
    { start: '127.0.0.0', end: '127.255.255.255' },
    { start: '10.0.0.0', end: '10.255.255.255' },
    { start: '172.16.0.0', end: '172.31.255.255' },
    { start: '192.168.0.0', end: '192.168.255.255' },
    { start: '169.254.0.0', end: '169.254.255.255' },
    { start: '224.0.0.0', end: '239.255.255.255' },
    { start: '0.0.0.0', end: '0.255.255.255' },
];
const BLOCKED_HOSTNAMES = [
    'localhost',
    'localhost.localdomain',
    '0.0.0.0',
    '::1',
    '::',
    'metadata.google.internal',
    '169.254.169.254',
];
let UrlValidationService = UrlValidationService_1 = class UrlValidationService {
    logger = new common_1.Logger(UrlValidationService_1.name);
    async validateUrl(urlString) {
        if (urlString.length > 2048) {
            throw new common_1.BadRequestException('URL must not exceed 2048 characters');
        }
        let parsedUrl;
        try {
            parsedUrl = new url_1.URL(urlString);
        }
        catch {
            throw new common_1.BadRequestException('Invalid URL format');
        }
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            throw new common_1.BadRequestException('Only HTTP and HTTPS protocols are allowed');
        }
        if (parsedUrl.username || parsedUrl.password) {
            throw new common_1.BadRequestException('URLs with credentials are not allowed');
        }
        const hostname = parsedUrl.hostname.toLowerCase();
        if (BLOCKED_HOSTNAMES.includes(hostname)) {
            throw new common_1.BadRequestException('This hostname is not allowed');
        }
        if (net.isIP(hostname)) {
            if (this.isPrivateIp(hostname)) {
                throw new common_1.BadRequestException('Private IP addresses are not allowed');
            }
        }
        try {
            const resolvedIps = await this.resolveHostname(hostname);
            for (const ip of resolvedIps) {
                if (this.isPrivateIp(ip)) {
                    this.logger.warn(`SSRF attempt blocked: ${hostname} resolves to private IP ${ip}`);
                    throw new common_1.BadRequestException('This URL resolves to a private/reserved IP address');
                }
            }
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException)
                throw error;
            throw new common_1.BadRequestException(`Unable to resolve hostname: ${hostname}`);
        }
        const sanitizedUrl = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname}${parsedUrl.search}`;
        return { valid: true, sanitizedUrl };
    }
    isPrivateIp(ip) {
        if (ip === '::1' || ip === '::')
            return true;
        if (net.isIPv4(ip)) {
            const ipNum = this.ipToNumber(ip);
            for (const range of BLOCKED_IP_RANGES) {
                const startNum = this.ipToNumber(range.start);
                const endNum = this.ipToNumber(range.end);
                if (ipNum >= startNum && ipNum <= endNum) {
                    return true;
                }
            }
        }
        if (net.isIPv6(ip)) {
            const lower = ip.toLowerCase();
            if (lower.startsWith('fc') ||
                lower.startsWith('fd') ||
                lower.startsWith('fe80')) {
                return true;
            }
        }
        return false;
    }
    ipToNumber(ip) {
        const parts = ip.split('.').map(Number);
        return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
    }
    resolveHostname(hostname) {
        return new Promise((resolve, reject) => {
            dns.resolve4(hostname, (err, addresses) => {
                if (err) {
                    dns.resolve6(hostname, (err6, addresses6) => {
                        if (err6) {
                            reject(new Error(`DNS resolution failed for ${hostname}`));
                        }
                        else {
                            resolve(addresses6);
                        }
                    });
                }
                else {
                    resolve(addresses);
                }
            });
        });
    }
};
exports.UrlValidationService = UrlValidationService;
exports.UrlValidationService = UrlValidationService = UrlValidationService_1 = __decorate([
    (0, common_1.Injectable)()
], UrlValidationService);
//# sourceMappingURL=url-validation.service.js.map