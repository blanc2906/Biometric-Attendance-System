import { Document, Types } from 'mongoose';
import { User } from './user.schema';
export type FaceDescriptorDocument = FaceDescriptor & Document;
export declare class FaceDescriptor {
    _id: Types.ObjectId;
    descriptor: number[];
    user: User;
}
export declare const FaceDescriptorSchema: import("mongoose").Schema<FaceDescriptor, import("mongoose").Model<FaceDescriptor, any, any, any, Document<unknown, any, FaceDescriptor> & FaceDescriptor & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, FaceDescriptor, Document<unknown, {}, import("mongoose").FlatRecord<FaceDescriptor>> & import("mongoose").FlatRecord<FaceDescriptor> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
