import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FaceRecognitionService } from './face-recognition.service';
import { FaceDescriptor, FaceDescriptorSchema } from '../../database/schemas/face-descriptor.schema';
import { User, UserSchema } from '../../database/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FaceDescriptor.name, schema: FaceDescriptorSchema },
      { name: User.name, schema: UserSchema }
    ])
  ],
  providers: [FaceRecognitionService],
  exports: [FaceRecognitionService]
})
export class FaceRecognitionModule {}