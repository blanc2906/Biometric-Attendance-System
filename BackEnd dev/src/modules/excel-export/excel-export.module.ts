import { Module } from '@nestjs/common';
import { ExcelExportService } from './excel-export.service';
import { ExcelExportController } from './excel-export.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/database/schemas/user.schema';
import { UserLog, UserLogSchema } from 'src/database/schemas/user-log.schema';
import { UsersModule } from 'src/modules/users/users.module';
import { UsersService } from 'src/modules/users/users.service';
import { MqttModule } from 'src/modules/mqtt/mqtt.module';
import { MqttService } from 'src/modules/mqtt/mqtt.service';
import { FaceDescriptor, FaceDescriptorSchema } from 'src/database/schemas/face-descriptor.schema';

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