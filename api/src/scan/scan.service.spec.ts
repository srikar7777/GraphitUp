import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bull';
import { ScanService } from './scan.service.js';
import { Scan, ScanStatus } from './entities/scan.entity.js';

describe('ScanService', () => {
    let service: ScanService;
    let mockScanRepository: any;
    let mockScanQueue: any;

    beforeEach(async () => {
        mockScanRepository = {
            create: jest.fn().mockImplementation((dto) => dto),
            save: jest.fn().mockImplementation((scan) => Promise.resolve({ id: 'uuid-1234', ...scan, createdAt: new Date() })),
            findOne: jest.fn(),
            find: jest.fn(),
        };

        mockScanQueue = {
            add: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ScanService,
                {
                    provide: getRepositoryToken(Scan),
                    useValue: mockScanRepository,
                },
                {
                    provide: getQueueToken('scan-queue'),
                    useValue: mockScanQueue,
                },
            ],
        }).compile();

        service = module.get<ScanService>(ScanService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createScan', () => {
        it('should create a scan and add it to the queue', async () => {
            const dto = { url: 'https://example.com' };
            const result = await service.createScan(dto);

            expect(mockScanRepository.create).toHaveBeenCalledWith({
                url: 'https://example.com',
                status: ScanStatus.PENDING,
            });
            expect(mockScanRepository.save).toHaveBeenCalled();
            expect(mockScanQueue.add).toHaveBeenCalledWith(
                'analyze',
                { scanId: 'uuid-1234', url: 'https://example.com' },
                expect.any(Object),
            );
            expect(result.id).toBe('uuid-1234');
            expect(result.url).toBe('https://example.com');
            expect(result.status).toBe(ScanStatus.PENDING);
        });
    });

    describe('getScan', () => {
        it('should return a scan if it exists', async () => {
            const mockScan = { id: 'uuid-1234', url: 'https://example.com', status: ScanStatus.COMPLETED };
            mockScanRepository.findOne.mockResolvedValue(mockScan);

            const result = await service.getScan('uuid-1234');
            expect(result).toEqual(mockScan);
        });

        it('should throw NotFoundException if scan does not exist', async () => {
            mockScanRepository.findOne.mockResolvedValue(null);

            await expect(service.getScan('not-found')).rejects.toThrow('Scan with ID "not-found" not found');
        });
    });
});
