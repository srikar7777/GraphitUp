export declare enum ScanStatus {
    PENDING = "pending",
    SCANNING = "scanning",
    COMPLETED = "completed",
    FAILED = "failed"
}
export declare class Scan {
    id: string;
    url: string;
    status: ScanStatus;
    currentPhase: string | null;
    progress: number;
    result: Record<string, any> | null;
    errorMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date | null;
}
