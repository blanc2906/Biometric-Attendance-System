import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './schemas/user.schema';
import { UserLog, UserLogSchema } from './schemas/user-log.schema';
import { FaceDescriptor, FaceDescriptorSchema } from './schemas/face-descriptor.schema';
import { MqttModule } from 'src/mqtt/mqtt.module';
import { FaceRecognitionService } from './face-recognition.service';
import { EncryptionService } from './encryption.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserLog.name, schema: UserLogSchema },
      { name: FaceDescriptor.name, schema: FaceDescriptorSchema },
    ]),
    MqttModule
  ],
  controllers: [UsersController],
  providers: [UsersService, FaceRecognitionService, EncryptionService],
  exports: [UsersService]
})
export class UsersModule {}