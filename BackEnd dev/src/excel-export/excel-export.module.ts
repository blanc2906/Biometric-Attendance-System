import { Module } from '@nestjs/common';
import { ExcelExportService } from './excel-export.service';
import { ExcelExportController } from './excel-export.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/users/schemas/user.schema';
import { UserLog, UserLogSchema } from 'src/users/schemas/user-log.schema';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';
import { MqttModule } from 'src/mqtt/mqtt.module';
import { MqttService } from 'src/mqtt/mqtt.service';
import { FaceDescriptor, FaceDescriptorSchema } from 'src/users/schemas/face-descriptor.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserLog.name, schema: UserLogSchema },
      { name: FaceDescriptor.name, schema: FaceDescriptorSchema }
    ]),
    UsersModule,
    MqttModule
  ],
  providers: [ExcelExportService, UsersService, MqttService],
  controllers: [ExcelExportController]
})
export class ExcelExportModule {}