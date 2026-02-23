export declare class UrlValidationService {
    private readonly logger;
    validateUrl(urlString: string): Promise<{
        valid: boolean;
        sanitizedUrl: string;
    }>;
    private isPrivateIp;
    private ipToNumber;
    private resolveHostname;
}
