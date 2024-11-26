import { Document, Types } from 'mongoose';
import { FaceDescriptor } from './face-descriptor.schema';
import mongoose from 'mongoose';
export type UserDocument = User & Document;
export declare class User {
    _id: Types.ObjectId;
    name: string;
    finger_id: number;
    faceDescriptor: FaceDescriptor;
    userlog: Types.ObjectId[];
}
export declare const UserSchema: mongoose.Schema<User, mongoose.Model<User, any, any, any, Document<unknown, any, User> & User & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, User, Document<unknown, {}, mongoose.FlatRecord<User>> & mongoose.FlatRecord<User> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
