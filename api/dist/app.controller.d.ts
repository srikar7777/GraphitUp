import { AppService } from './app.service.js';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getInfo(): {
        name: string;
        version: string;
        description: string;
        docs: string;
    };
    getHealth(): Promise<Record<string, any>>;
}
