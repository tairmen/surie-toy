import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('wedding_guest_entries')
export class GuestEntry {
  @PrimaryGeneratedColumn() id: number;
  @CreateDateColumn() createdAt: Date;
  @Column() kind: string;
  @Column() author: string;
  @Column({ type: 'text', default: '' }) message: string;
  @Column({ default: false }) approved: boolean;
  @Column({ nullable: true }) filename: string;
  @Column({ nullable: true }) mime: string;
}
