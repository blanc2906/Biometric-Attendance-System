import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './user.schema';

export type UserLogDocument = UserLog & Document;

@Schema()
export class UserLog {

  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  time_in: string;

  @Prop()
  time_out: string;
}

export const UserLogSchema = SchemaFactory.createForClass(UserLog);