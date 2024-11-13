import { Controller, Get, Post, Body, Patch, Param, Delete, Logger, NotFoundException, HttpException, HttpStatus, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Ctx, MessagePattern, MqttContext, Payload } from '@nestjs/microservices';
import { User } from './entities/user.entity';
import { UserLog } from './entities/user_log.entity';
import { FaceRecognitionService } from './face-recognition.service';
import { FaceRecognitionDto } from './dto/face-recognition.dto';
import * as fs from 'fs';
import * as path from 'path';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  private userLoginStatus: Map<number, boolean> = new Map();

  constructor(
    private readonly usersService: UsersService,
    private readonly faceRecognitionService: FaceRecognitionService
  ) {}

  @Post('create_user')
  async create() {
    try {
      await this.usersService.initiateUserCreation();
      return { message: "Fingerprint enrollment initiated" };
    } catch (error) {
      this.logger.error(`Error initiating user creation: ${error.message}`);
      throw error;
    }
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  private async handleUserLogin(user: User, latestUserLog: UserLog | null): Promise<void> {
    const userLog = new UserLog();
    userLog.user = user;
    userLog.date = new Date();
    userLog.time_in = new Date().toTimeString().split(' ')[0];
    
    this.logger.log(`${user.name} logged in at ${userLog.time_in}`);
    
    await this.usersService.saveUserLog(user.id, {
      date: userLog.date,
      time_in: userLog.time_in,
      time_out: null,
    });
    
    this.userLoginStatus.set(user.id, true);
  }

  private async handleUserLogout(user: User, latestUserLog: UserLog): Promise<void> {
    const time_out = new Date().toTimeString().split(' ')[0];
    this.logger.log(`${user.name} logged out at ${time_out}`);
    
    await this.usersService.updateUserLog(
      user.id, 
      latestUserLog.date, 
      latestUserLog.time_in, 
      { time_out }
    );
    
    this.userLoginStatus.set(user.id, false);
  }

  @MessagePattern('user_log')
  async getNotifications(@Payload() data: string, @Ctx() context: MqttContext) {
    try {
      const userId = await this.usersService.findUserByFingerID(Number(data));
      const user = await this.usersService.findOne(userId);
      const latestUserLog = await this.usersService.getLatestUserLog(userId);
      const isLoggedIn = this.userLoginStatus.get(userId) || false;

      if (isLoggedIn && latestUserLog && !latestUserLog.time_out) {
        await this.handleUserLogout(user, latestUserLog);
      } else {
        await this.handleUserLogin(user, latestUserLog);
      }
    } catch (error) {
      this.logger.error(`Error processing user: ${error.message}`);
    }
  }

  @MessagePattern('create_new_user')
  async createUser(@Payload() data: string) {
    try {
      const finger_id = Number(data);
      
      if (isNaN(finger_id)) {
        this.logger.error(`Invalid finger_id received: ${data}`);
        return;
      }
      
      const newUser = await this.usersService.create({
        name: 'New User',
        finger_id
      });
      this.logger.log(`Created new user with ID ${newUser.id} for finger ID ${finger_id}`);
    } catch (error) {
      this.logger.error(`Error creating user: ${error.message}`);
    }
  }

  @Post(':id/face')
  async addFace(
    @Param('id') id: string,
    @Body() faceRecognitionDto: FaceRecognitionDto
  ) {
    try {
      console.log(`Processing face addition for user ${id}`);
      console.log('Image path:', faceRecognitionDto.imagePath);
      
      const result = await this.faceRecognitionService.addFaceDescriptor(
        +id,
        faceRecognitionDto.imagePath
      );
      
      console.log('Face addition result:', result);
      
      return {
        success: true,
        message: 'Face descriptor added successfully',
        data: result
      };
    } catch (error) {
      console.error('Full error:', error);
      this.logger.error(`Error adding face: ${error.message}`);
      throw new HttpException({
        status: HttpStatus.BAD_REQUEST,
        error: error.message,
        stack: error.stack
      }, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('recognize')
  @UseInterceptors(FileInterceptor('imageFile'))
  async recognizeFaceFromCamera(@UploadedFile() file: Express.Multer.File) {
    try {
  
      const tempPath = path.join(process.cwd(), 'temporary', `temp-${Date.now()}.jpg`);
      fs.writeFileSync(tempPath, file.buffer);
      //console.log('received file');

      const recognizedUser = await this.faceRecognitionService.recognizeFace(tempPath);

      fs.unlinkSync(tempPath);

      if (recognizedUser) {
        return {
          success: true,
          user: {
            id: recognizedUser.id,
            name: recognizedUser.name
          }
        };
      }

      return {
        success: false,
        message: 'No matching face found'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}
