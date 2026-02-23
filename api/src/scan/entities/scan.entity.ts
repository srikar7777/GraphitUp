import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ScanStatus {
  PENDING = 'pending',
  SCANNING = 'scanning',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('scans')
export class Scan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 2048 })
  url: string;

  @Column({
    type: 'enum',
    enum: ScanStatus,
    default: ScanStatus.PENDING,
  })
  status: ScanStatus;

  @Column({ type: 'varchar', nullable: true })
  currentPhase: string | null;

  @Column({ type: 'int', default: 0 })
  progress: number;

  @Column({ type: 'jsonb', nullable: true })
  result: Record<string, any> | null;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;
}
