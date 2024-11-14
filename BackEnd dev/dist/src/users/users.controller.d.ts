import { UsersService } from './users.service';
import { MqttContext } from '@nestjs/microservices';
import { User } from './entities/user.entity';
import { FaceRecognitionService } from './face-recognition.service';
import { MqttService } from 'src/mqtt/mqtt.service';
export declare class UsersController {
    private readonly usersService;
    private readonly faceRecognitionService;
    private readonly mqttService;
    private readonly userLoginStatus;
    private readonly logger;
    private readonly tempDirectory;
    constructor(usersService: UsersService, faceRecognitionService: FaceRecognitionService, mqttService: MqttService);
    create(): Promise<{
        message: string;
    }>;
    findAll(): Promise<User[]>;
    findOne(id: string): Promise<User>;
    remove(id: string): Promise<void>;
    addFace(file: Express.Multer.File, id: string): Promise<{
        success: boolean;
        message: string;
        data: import("./entities/face-descriptor.entity").FaceDescriptor;
    }>;
    recognizeFaceFromCamera(file: Express.Multer.File): Promise<{
        success: boolean;
        user: {
            id: number;
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
