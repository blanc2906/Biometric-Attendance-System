import { UsersService } from './users.service';
import { MqttContext } from '@nestjs/microservices';
import { FaceRecognitionService } from './face-recognition.service';
import { MqttService } from 'src/mqtt/mqtt.service';
import { UserDocument } from './schemas/user.schema';
import { Types } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersController {
    private readonly usersService;
    private readonly faceRecognitionService;
    private readonly mqttService;
    private readonly logger;
    private readonly tempDirectory;
    constructor(usersService: UsersService, faceRecognitionService: FaceRecognitionService, mqttService: MqttService);
    create(): Promise<{
        message: string;
    }>;
    createNewUser(createUserDto: CreateUserDto): Promise<void>;
    findAll(): Promise<UserDocument[]>;
    findOne(id: string): Promise<UserDocument>;
    remove(id: string): Promise<void>;
    addFace(file: Express.Multer.File, id: string): Promise<{
        success: boolean;
        message: string;
        data: import("mongoose").Document<unknown, {}, import("./schemas/face-descriptor.schema").FaceDescriptorDocument> & import("./schemas/face-descriptor.schema").FaceDescriptor & import("mongoose").Document<unknown, any, any> & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    recognizeFaceFromCamera(file: Express.Multer.File): Promise<{
        success: boolean;
        user: {
            id: any;
            name: string;
        };
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        user?: undefined;
    }>;
    handleFingerAttendance(data: string, context: MqttContext): Promise<void>;
    handleFaceAttendance(data: string, context: MqttContext): Promise<void>;
    createUser(data: string): Promise<void>;
    private handleUserLogin;
    private handleUserLogout;
    private processAttendance;
    private handleImageFile;
}
