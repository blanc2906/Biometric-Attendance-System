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
import { MqttService } from 'src/mqtt/mqtt.service';

@Controller('users')
export class UsersController {
  private readonly userLoginStatus = new Map<number, boolean>();
  private readonly logger = new Logger(UsersController.name);
  private readonly tempDirectory = path.join(process.cwd(), 'temporary');

  constructor(
    private readonly usersService: UsersService,
    private readonly faceRecognitionService: FaceRecognitionService,
    private readonly mqttService : MqttService
  ) {
    if (!fs.existsSync(this.tempDirectory)) {
      fs.mkdirSync(this.tempDirectory, { recursive: true });
    }
  }

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

  @Post(':id/add-face')
  @UseInterceptors(FileInterceptor('image'))
  async addFace(
    @UploadedFile() file : Express.Multer.File,
    @Param('id') id: string
  ){
    try{
      const tempPath = path.join(process.cwd(), 'temporary', `temp-${Date.now()}.jpg`);
      fs.writeFileSync(tempPath, file.buffer);

      const addedUser = await this.faceRecognitionService.addFaceDescriptor(+id,tempPath);
      fs.unlinkSync(tempPath);

      return {
        success: true,
        message: 'Face descriptor added successfully',
        data: addedUser
      };
    }
    catch(error){
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
    let tempPath: string | null = null;
    try {
      tempPath = await this.handleImageFile(file);
      const recognizedUser = await this.faceRecognitionService.recognizeFace(tempPath);
      await this.mqttService.publish('face_attendance',recognizedUser.id.toString());

      return recognizedUser 
        ? { success: true, user: { id: recognizedUser.id, name: recognizedUser.name } }
        : { success: false, message: 'No matching face found' };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      if (tempPath) await fs.promises.unlink(tempPath).catch(() => {});
    }
  }


  @MessagePattern('finger_attendance')
  async handleFingerAttendance(@Payload() data: string, @Ctx() context: MqttContext) {
    const userID = await this.usersService.findUserByFingerID(Number(data));
    return this.processAttendance(userID.toString());
  }

  @MessagePattern('face_attendance')
  async handleFaceAttendance(@Payload() data: string, @Ctx() context: MqttContext) {
    return this.processAttendance(data);
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

  private async processAttendance(data: string): Promise<void> {
    try {
      const userId = Number(data);
      if (isNaN(userId)) {
        throw new Error('Invalid user ID');
      }

      const user = await this.usersService.findOne(userId);
      const latestUserLog = await this.usersService.getLatestUserLog(userId);
      const isLoggedIn = this.userLoginStatus.get(userId) ?? false;

      await (isLoggedIn && latestUserLog?.time_out === null
        ? this.handleUserLogout(user, latestUserLog)
        : this.handleUserLogin(user, latestUserLog));
    } catch (error) {
      this.logger.error(`Error processing attendance: ${error.message}`);
    }
  }

  private async handleImageFile(file: Express.Multer.File): Promise<string> {
    const tempPath = path.join(this.tempDirectory, `temp-${Date.now()}.jpg`);
    await fs.promises.writeFile(tempPath, file.buffer);
    return tempPath;
  }
}
