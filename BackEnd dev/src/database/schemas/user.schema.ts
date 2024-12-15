import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { FaceDescriptor } from './face-descriptor.schema';
import mongoose from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  _id: Types.ObjectId;

  @Prop({required: true, unique: true})
  id_nvien: string;
  
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  finger_id: number;

  @Prop({ type: Types.ObjectId, ref: 'FaceDescriptor' })
  faceDescriptor: FaceDescriptor;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserLog' }] })
  userlog: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);
