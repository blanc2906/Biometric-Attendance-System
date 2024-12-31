import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from '../../database/schemas/user.schema';
import { FaceDescriptor, FaceDescriptorSchema } from '../../database/schemas/face-descriptor.schema';
import { MqttModule } from 'src/modules/mqtt/mqtt.module';
import { FaceRecognitionModule } from '../face-recognition/face-recognition.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: FaceDescriptor.name, schema: FaceDescriptorSchema },
    ]),
    MqttModule,
    FaceRecognitionModule
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule {}