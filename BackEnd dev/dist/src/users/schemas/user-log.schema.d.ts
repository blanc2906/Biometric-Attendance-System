import { Document, Types } from 'mongoose';
import { User } from './user.schema';
export type UserLogDocument = UserLog & Document;
export declare class UserLog {
    _id: Types.ObjectId;
    user: User;
    date: Date;
    time_in: string;
    time_out: string;
}
export declare const UserLogSchema: import("mongoose").Schema<UserLog, import("mongoose").Model<UserLog, any, any, any, Document<unknown, any, UserLog> & UserLog & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, UserLog, Document<unknown, {}, import("mongoose").FlatRecord<UserLog>> & import("mongoose").FlatRecord<UserLog> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
