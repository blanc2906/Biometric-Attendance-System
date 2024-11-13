import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { MqttModule } from 'src/mqtt/mqtt.module';
import { UserLog } from './entities/user_log.entity';
import { FaceDescriptor } from './entities/face-descriptor.entity';
import { FaceRecognitionService } from './face-recognition.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserLog, FaceDescriptor]),
    MqttModule
  ],
  controllers: [UsersController],
  providers: [UsersService,FaceRecognitionService],
  exports: [UsersService]
})
export class UsersModule {}
