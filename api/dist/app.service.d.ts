import { DataSource } from 'typeorm';
export declare class AppService {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    getInfo(): {
        name: string;
        version: string;
        description: string;
        docs: string;
    };
    getHealth(): Promise<Record<string, any>>;
}
