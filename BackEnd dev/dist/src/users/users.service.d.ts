import { CreateUserDto } from './dto/create-user.dto';
import { Model } from 'mongoose';
import { UserDocument } from './schemas/user.schema';
import { UserLogDocument } from './schemas/user-log.schema';
import { CreateUserLogDto } from './dto/create-user_log.dto';
import { UpdateUserLogDto } from './dto/update-user_log.dto';
import { MqttService } from 'src/mqtt/mqtt.service';
import { FaceDescriptorDocument } from './schemas/face-descriptor.schema';
export declare class UsersService {
    private readonly userModel;
    private readonly userLogModel;
    private readonly faceDescriptorModel;
    private readonly mqttService;
    private readonly userCache;
    private readonly cacheTimeout;
    constructor(userModel: Model<UserDocument>, userLogModel: Model<UserLogDocument>, faceDescriptorModel: Model<FaceDescriptorDocument>, mqttService: MqttService);
    private findUserOrThrow;
    create(createUserDto: CreateUserDto): Promise<UserDocument>;
    findAll(): Promise<UserDocument[]>;
    findOne(id: string): Promise<UserDocument>;
    findUserByFingerID(finger_id: number): Promise<string>;
    remove(id: string): Promise<void>;
    saveUserLog(userId: string, createUserLogDto: CreateUserLogDto): Promise<UserLogDocument>;
    updateUserLog(userId: string, date: Date, time_in: string, updateUserLogDto: UpdateUserLogDto): Promise<UserLogDocument>;
    getLatestUserLog(userId: string): Promise<UserLogDocument | null>;
    populateData(): Promise<any[]>;
    private cacheUser;
    initiateUserCreation(): Promise<void>;
}
