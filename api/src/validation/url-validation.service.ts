import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as dns from 'dns';
import * as net from 'net';
import { URL } from 'url';

// Private/reserved IP ranges that should be blocked (SSRF prevention)
const BLOCKED_IP_RANGES = [
    // Loopback
    { start: '127.0.0.0', end: '127.255.255.255' },
    // Private networks
    { start: '10.0.0.0', end: '10.255.255.255' },
    { start: '172.16.0.0', end: '172.31.255.255' },
    { start: '192.168.0.0', end: '192.168.255.255' },
    // Link-local
    { start: '169.254.0.0', end: '169.254.255.255' },
    // Multicast
    { start: '224.0.0.0', end: '239.255.255.255' },
    // Reserved
    { start: '0.0.0.0', end: '0.255.255.255' },
];

const BLOCKED_HOSTNAMES = [
    'localhost',
    'localhost.localdomain',
    '0.0.0.0',
    '::1',
    '::',
    'metadata.google.internal',
    '169.254.169.254', // Cloud metadata endpoints
];

@Injectable()
export class UrlValidationService {
    private readonly logger = new Logger(UrlValidationService.name);

    async validateUrl(urlString: string): Promise<{ valid: boolean; sanitizedUrl: string }> {
        // Length check
        if (urlString.length > 2048) {
            throw new BadRequestException('URL must not exceed 2048 characters');
        }

        // Parse URL
        let parsedUrl: URL;
        try {
            parsedUrl = new URL(urlString);
        } catch {
            throw new BadRequestException('Invalid URL format');
        }

        // Protocol check
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            throw new BadRequestException('Only HTTP and HTTPS protocols are allowed');
        }

        // Block userinfo in URL (e.g., http://user:pass@evil.com)
        if (parsedUrl.username || parsedUrl.password) {
            throw new BadRequestException('URLs with credentials are not allowed');
        }

        // Hostname checks
        const hostname = parsedUrl.hostname.toLowerCase();

        // Block known dangerous hostnames
        if (BLOCKED_HOSTNAMES.includes(hostname)) {
            throw new BadRequestException('This hostname is not allowed');
        }

        // Block IPs in URL directly
        if (net.isIP(hostname)) {
            if (this.isPrivateIp(hostname)) {
                throw new BadRequestException('Private IP addresses are not allowed');
            }
        }

        // DNS resolution check — resolve the hostname and verify the IP is not private
        try {
            const resolvedIps = await this.resolveHostname(hostname);
            for (const ip of resolvedIps) {
                if (this.isPrivateIp(ip)) {
                    this.logger.warn(
                        `SSRF attempt blocked: ${hostname} resolves to private IP ${ip}`,
                    );
                    throw new BadRequestException(
                        'This URL resolves to a private/reserved IP address',
                    );
                }
            }
        } catch (error) {
            if (error instanceof BadRequestException) throw error;
            throw new BadRequestException(
                `Unable to resolve hostname: ${hostname}`,
            );
        }

        // Return sanitized URL (strip fragments, normalize)
        const sanitizedUrl = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname}${parsedUrl.search}`;

        return { valid: true, sanitizedUrl };
    }

    private isPrivateIp(ip: string): boolean {
        // IPv6 loopback
        if (ip === '::1' || ip === '::') return true;

        // Check IPv4
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

        // IPv6 private ranges
        if (net.isIPv6(ip)) {
            const lower = ip.toLowerCase();
            if (
                lower.startsWith('fc') ||
                lower.startsWith('fd') ||
                lower.startsWith('fe80')
            ) {
                return true;
            }
        }

        return false;
    }

    private ipToNumber(ip: string): number {
        const parts = ip.split('.').map(Number);
        return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
    }

    private resolveHostname(hostname: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            dns.resolve4(hostname, (err, addresses) => {
                if (err) {
                    // Try IPv6 as fallback
                    dns.resolve6(hostname, (err6, addresses6) => {
                        if (err6) {
                            reject(new Error(`DNS resolution failed for ${hostname}`));
                        } else {
                            resolve(addresses6);
                        }
                    });
                } else {
                    resolve(addresses);
                }
            });
        });
    }
}
