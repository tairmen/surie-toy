import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config'; // To read from .env file
import { DatabaseModule } from './database.module';
import { Attendee } from './attendee.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendee]),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'), // Adjust to your folder
    }),
    ConfigModule.forRoot({ isGlobal: true }), // Load environment variables globally
    DatabaseModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
