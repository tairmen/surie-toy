import { requireAdmin } from './admin-auth';
import { Body, Controller, Delete, Get, Headers, Param, ParseIntPipe, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
import { AppService } from './app.service';
import { Attendee } from './attendee.entity';
import { ConfirmAttendanceDto } from './dto/confirm-attendance.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHomePage(@Res() res: Response) {
    return res.sendFile(join(__dirname, '..', 'public', 'index.html'));
  }

  @Get('list')
  getAttendeesPage(@Res() res: Response) {
    return res.sendFile(join(__dirname, '..', 'public', 'attendees.html'));
  }

  @Post('api/confirm-attendance')
  confirmAttendance(@Body() confirm: ConfirmAttendanceDto) {
    return this.appService.create(confirm);
  }

  @Get('api/attendees')
  getList(@Headers('x-admin-key') key: string) {
    requireAdmin(key);
    return this.appService.findAll();
  }

  @Delete('api/attendees/:id')
  remove(@Param('id', ParseIntPipe) id: number, @Headers('x-admin-key') key: string) {
    requireAdmin(key);
    return this.appService.remove(+id);
  }
}
