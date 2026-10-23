import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn} from 'typeorm';


@Entity('attendees')
export class Attendee {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  name: string;

  @Column({nullable: true})
  surname: string;

  @Column({ type: 'jsonb', nullable: true })
  details: { events: string; guests: number; dietary: string; song: string; attending: boolean };

  @Column({ type: "text", nullable: true})
  guess: string
}