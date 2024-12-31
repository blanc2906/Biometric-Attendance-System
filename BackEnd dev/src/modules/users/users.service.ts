import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../database/schemas/user.schema';
import { MqttService } from 'src/modules/mqtt/mqtt.service';
import { FaceDescriptor, FaceDescriptorDocument } from '../../database/schemas/face-descriptor.schema';
import { DELETE_USER, ENROLL_FINGERPRINT } from 'src/shared/constants/mqtt.constant';

@Injectable()
export class UsersService {
  private readonly userCache = new Map<string, UserDocument>();
  private readonly cacheTimeout = 5 * 60 * 1000; 

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(FaceDescriptor.name)
    private readonly faceDescriptorModel: Model<FaceDescriptorDocument>,
    private readonly mqttService: MqttService,
  ) {}

  private async findUserOrThrow(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    try {
      if (isNaN(createUserDto.finger_id)) {
        throw new Error('Invalid finger_id');
      }
      
      const [existingUser, existedUser] = await Promise.all([
        this.userModel.findOne({ finger_id: createUserDto.finger_id }),
        this.userModel.findOne({ id_nvien: createUserDto.id_nvien })
      ]);
      
      if (existingUser) {
        throw new Error(`User with finger_id ${createUserDto.finger_id} already exists`);
      }
      if (existedUser) {
        throw new Error(`User with id_nvien ${createUserDto.id_nvien} already exists`);
      }
      
      const user = new this.userModel(createUserDto);
      return await user.save();
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async findAll(): Promise<UserDocument[]> {
    return await this.userModel.find().exec();
  }

  async findOne(id: string): Promise<UserDocument> {
    const cachedUser = this.userCache.get(id);
    if (cachedUser) return cachedUser;

    const user = await this.findUserOrThrow(id);
    await this.cacheUser(user);
    return user;
  }

  async findUserByFingerID(finger_id: number): Promise<UserDocument> {
    const user = await this.userModel.findOne({ finger_id });
    if (!user) {
      throw new NotFoundException(`User with Finger ID ${finger_id} not found`);
    }
    return user;
  }

  async updateUserFingerPrint(id: string): Promise<void> {
    const user = await this.findUserOrThrow(id);
    await this.mqttService.publish("update_fingerprint", user.finger_id.toString());
  }

  async remove(id: string): Promise<void> {
    const user = await this.findUserOrThrow(id);
    
    await Promise.all([
      this.faceDescriptorModel.deleteOne({ user: user._id }),
      this.userModel.findByIdAndDelete(id),
      this.mqttService.publish(DELETE_USER, user.finger_id.toString())
    ]).catch(error => {
      console.error('Error during user removal:', error);
      throw error;
    });
  }

  private async cacheUser(user: UserDocument): Promise<void> {
    this.userCache.set(user._id.toString(), user);
    setTimeout(() => this.userCache.delete(user._id.toString()), this.cacheTimeout);
  }

  async initiateUserCreation(): Promise<void> {
    await this.mqttService.publish(ENROLL_FINGERPRINT, '');
  }
}
