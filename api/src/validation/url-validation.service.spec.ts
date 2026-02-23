import { Test, TestingModule } from '@nestjs/testing';
import { UrlValidationService } from './url-validation.service.js';

describe('UrlValidationService', () => {
    let service: UrlValidationService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [UrlValidationService],
        }).compile();

        service = module.get<UrlValidationService>(UrlValidationService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('validateUrl', () => {
        it('should allow valid external URLs', async () => {
            // Mock DNS resolution to return a clean public IP
            jest.spyOn(service as any, 'resolveHostname').mockResolvedValue(['8.8.8.8']);

            const result = await service.validateUrl('https://example.com/path?query=1');
            expect(result.valid).toBe(true);
            expect(result.sanitizedUrl).toBe('https://example.com/path?query=1');
        });

        it('should block private IPs directly in the URL', async () => {
            await expect(service.validateUrl('http://192.168.1.1')).rejects.toThrow('Private IP addresses are not allowed');
            await expect(service.validateUrl('http://10.0.0.5')).rejects.toThrow('Private IP addresses are not allowed');
            await expect(service.validateUrl('http://127.0.0.1')).rejects.toThrow('Private IP addresses are not allowed');
        });

        it('should block localhost hostnames', async () => {
            await expect(service.validateUrl('http://localhost:3000')).rejects.toThrow('This hostname is not allowed');
        });

        it('should block non-http/https protocols', async () => {
            await expect(service.validateUrl('ftp://example.com')).rejects.toThrow('Only HTTP and HTTPS protocols are allowed');
            await expect(service.validateUrl('file:///etc/passwd')).rejects.toThrow('Only HTTP and HTTPS protocols are allowed');
        });

        it('should block URLs with credentials', async () => {
            await expect(service.validateUrl('https://user:pass@example.com')).rejects.toThrow('URLs with credentials are not allowed');
        });

        it('should block SSRF attempts (hostname resolves to private IP)', async () => {
            // Mock DNS resolution to return a private IP
            jest.spyOn(service as any, 'resolveHostname').mockResolvedValue(['192.168.1.100']);

            await expect(service.validateUrl('https://my-internal-ssrf-domain.com')).rejects.toThrow('This URL resolves to a private/reserved IP address');
        });
    });
});
