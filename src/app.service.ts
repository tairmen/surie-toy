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

  async create(user: Partial<Attendee>): Promise<Attendee> {
    try {
      const result = await this.attendeeRepository.save(user);
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
