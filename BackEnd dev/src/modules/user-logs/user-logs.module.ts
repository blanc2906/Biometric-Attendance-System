import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserLogsService } from './user-logs.service';
import { UserLogsController } from './user-logs.controller';
import { UserLog, UserLogSchema } from '../../database/schemas/user-log.schema';
import { User, UserSchema } from '../../database/schemas/user.schema';
import { UsersModule } from '../users/users.module';
import { FaceRecognitionModule } from '../face-recognition/face-recognition.module';
import { MqttModule } from '../mqtt/mqtt.module';
import { FileHandlingHelper } from '../../shared/helpers/file-handling.helper';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserLog.name, schema: UserLogSchema },
      { name: User.name, schema: UserSchema },
    ]),
    UsersModule,
    FaceRecognitionModule,
    MqttModule
  ],
  controllers: [UserLogsController],
  providers: [UserLogsService, FileHandlingHelper],
  exports: [UserLogsService]
})
export class UserLogsModule {} 