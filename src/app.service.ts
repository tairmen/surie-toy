import { ConfirmAttendanceDto } from './dto/confirm-attendance.dto';
import { text } from './wedding.service';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Attendee } from './attendee.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Attendee)
    private attendeeRepository: Repository<Attendee>,
  ) { }

  async create(user: ConfirmAttendanceDto): Promise<Attendee> {
    if (!user || typeof user !== 'object') throw new BadRequestException('Заполните анкету.');
    const details = user.details;
    if (details && (!['both', 'nikah', 'wedding'].includes(details.events) || !Number.isInteger(details.guests) || details.guests < 1 || details.guests > 10 || typeof details.attending !== 'boolean')) throw new BadRequestException('Проверьте выбранные события и количество гостей.');
    const clean: Partial<Attendee> = {
      name: text(user.name, 80, true), surname: text(user.surname, 80), guess: text(user.guess, 1200),
      details: details ? { events: details.events, guests: details.guests, attending: details.attending, dietary: text(details.dietary, 300), song: text(details.song, 200) } : null,
    };
    try {
      const result = await this.attendeeRepository.save(clean);
      return result;
    } catch {
      throw new BadRequestException('Create in db error')
    }
  }

  findAll(): Promise<Attendee[]> {
    return this.attendeeRepository.find();
  }

  async remove(id: number): Promise<void> {
    const result = await this.attendeeRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException();
    }
  }

}
