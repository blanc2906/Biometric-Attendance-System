import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { UserLog } from './entities/user_log.entity';
import { Repository } from 'typeorm';
import { CreateUserLogDto } from './dto/create-user_log.dto';
import { UpdateUserLogDto } from './dto/update-user_log.entity';
import { MqttService } from 'src/mqtt/mqtt.service';
import { FaceDescriptor } from './entities/face-descriptor.entity';
export declare class UsersService {
    private readonly usersRepository;
    private readonly userLogRepository;
    private readonly faceDescriptorRepository;
    private readonly mqttService;
    private readonly userCache;
    private readonly cacheTimeout;
    constructor(usersRepository: Repository<User>, userLogRepository: Repository<UserLog>, faceDescriptorRepository: Repository<FaceDescriptor>, mqttService: MqttService);
    private findUserOrThrow;
    initiateUserCreation(): Promise<void>;
    create(createUserDto: CreateUserDto): Promise<User>;
    findAll(): Promise<User[]>;
    findOne(id: number): Promise<User>;
    findUserByFingerID(finger_id: number): Promise<number>;
    remove(id: number): Promise<void>;
    saveUserLog(userId: number, createUserLogDto: CreateUserLogDto): Promise<UserLog>;
    updateUserLog(userId: number, date: Date, time_in: string, updateUserLogDto: UpdateUserLogDto): Promise<UserLog>;
    getLatestUserLog(userId: number): Promise<UserLog | null>;
    populateData(): Promise<any[]>;
    private cacheUser;
}
