import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './user.schema';

export type FaceDescriptorDocument = FaceDescriptor & Document;

@Schema()
export class FaceDescriptor {
    _id: Types.ObjectId;

    @Prop({ type: String, required: true })
    descriptor: string;

    @Prop({ type: String, required: true })
    iv: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
    user: User;
}

export const FaceDescriptorSchema = SchemaFactory.createForClass(FaceDescriptor);