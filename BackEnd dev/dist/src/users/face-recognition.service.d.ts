import { OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import { FaceDescriptor, FaceDescriptorDocument } from './schemas/face-descriptor.schema';
import { UserDocument } from './schemas/user.schema';
import { Document } from 'mongoose';
export declare class FaceRecognitionService implements OnModuleInit {
    private faceDescriptorModel;
    private userModel;
    private modelPath;
    private canvas;
    constructor(faceDescriptorModel: Model<FaceDescriptorDocument>, userModel: Model<UserDocument>);
    onModuleInit(): Promise<void>;
    private processImage;
    addFaceDescriptor(userId: string, imagePath: string): Promise<Document<unknown, {}, FaceDescriptorDocument> & FaceDescriptor & Document<unknown, any, any> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    recognizeFace(imagePath: string): Promise<UserDocument | null>;
}
