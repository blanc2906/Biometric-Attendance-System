import { Module } from '@nestjs/common';
import { ExcelExportService } from './excel-export.service';
import { ExcelExportController } from './excel-export.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { UserLog } from 'src/users/entities/user_log.entity';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';
import { MqttModule } from 'src/mqtt/mqtt.module';
import { MqttService } from 'src/mqtt/mqtt.service';
import { FaceDescriptor } from 'src/users/entities/face-descriptor.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserLog, FaceDescriptor]),
    UsersModule,
    MqttModule
  ],
  providers: [ExcelExportService, UsersService, MqttService],
  controllers: [ExcelExportController]
})
export class ExcelExportModule {}
