import { UsersService } from './users.service';
import { MqttContext } from '@nestjs/microservices';
import { User } from './entities/user.entity';
import { FaceRecognitionService } from './face-recognition.service';
import { FaceRecognitionDto } from './dto/face-recognition.dto';
export declare class UsersController {
    private readonly usersService;
    private readonly faceRecognitionService;
    private readonly logger;
    private userLoginStatus;
    constructor(usersService: UsersService, faceRecognitionService: FaceRecognitionService);
    create(): Promise<{
        message: string;
    }>;
    findAll(): Promise<User[]>;
    findOne(id: string): Promise<User>;
    remove(id: string): Promise<void>;
    private handleUserLogin;
    private handleUserLogout;
    getNotifications(data: string, context: MqttContext): Promise<void>;
    createUser(data: string): Promise<void>;
    addFace(id: string, faceRecognitionDto: FaceRecognitionDto): Promise<{
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
}
