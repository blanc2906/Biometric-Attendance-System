import { Controller, Get, Post, Body, Patch, Param, Delete, Logger, NotFoundException, HttpException, HttpStatus, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UsersService } from './users.service';
import { Ctx, MessagePattern, MqttContext, Payload } from '@nestjs/microservices';
import { FaceRecognitionService } from './face-recognition.service';
import * as fs from 'fs';
import * as path from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { MqttService } from 'src/mqtt/mqtt.service';
import { UserDocument } from './schemas/user.schema';
import { UserLogDocument } from './schemas/user-log.schema';
import { Types } from 'mongoose';
import { CreateUserDto } from './dto/user.dto';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);
  private readonly tempDirectory = path.join(process.cwd(), 'temporary');

  constructor(
    private readonly usersService: UsersService,
    private readonly faceRecognitionService: FaceRecognitionService,
    private readonly mqttService: MqttService
  ) {
    if (!fs.existsSync(this.tempDirectory)) {
      fs.mkdirSync(this.tempDirectory, { recursive: true });
    }
  }
  @Post('create-user')
  async createNewUser(@Body() createUserDto : CreateUserDto){
    await this.usersService.initiateUserCreation()
    await this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
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

      const addedUser = await this.faceRecognitionService.addFaceDescriptor(id,tempPath);
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
  @UseInterceptors(FileInterceptor('image'))
  async recognizeFaceFromCamera(@UploadedFile() file: Express.Multer.File) {
    let tempPath: string | null = null;
    try {
      tempPath = await this.handleImageFile(file);
      const recognizedUser = await this.faceRecognitionService.recognizeFace(tempPath);
      
      if (!recognizedUser) {
        return { success: false, message: 'No matching face found' };
      }

      await this.mqttService.publish('face_attendance', recognizedUser.id.toString());

      return { 
        success: true, 
        user: { 
          id: recognizedUser.id, 
          name: recognizedUser.name 
        } 
      };
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

  private async handleUserLogin(user: UserDocument, latestUserLog: UserLogDocument | null): Promise<void> {
    const currentDate = new Date();
    const timeIn = currentDate.toTimeString().split(' ')[0];
    
    this.logger.log(`${user.name} logged in at ${timeIn}`);
    
    await this.usersService.saveUserLog(user._id.toString(), {
      date: currentDate,
      time_in: timeIn,
      time_out: null
    });
  }
  
  private async handleUserLogout(user: UserDocument, latestUserLog: UserLogDocument): Promise<void> {
    const timeOut = new Date().toTimeString().split(' ')[0];
    this.logger.log(`${user.name} logged out at ${timeOut}`);
    
    await this.usersService.updateUserLog(
      user._id.toString(),
      latestUserLog.date,
      latestUserLog.time_in,
      { time_out: timeOut }
    );
  }

  private async processAttendance(data: string): Promise<void> {
    try {
      const user = await this.usersService.findOne(data);
      const latestUserLog = await this.usersService.getLatestUserLog(data);
      
      const currentTime = new Date();
      
      if (!latestUserLog) {
        await this.handleUserLogin(user, null);
        return;
      }
      const logDate = new Date(latestUserLog.date);
      if (logDate.toDateString() !== currentTime.toDateString()) {
        await this.handleUserLogin(user, latestUserLog);
        return;
      }
  

      if (!latestUserLog.time_out) {
        await this.handleUserLogout(user, latestUserLog);
      } else {
        await this.handleUserLogin(user, latestUserLog);
      }
      
    } catch (error) {
      this.logger.error(`Error processing attendance: ${error.message}`);
      throw error;
    }
  }

  private async handleImageFile(file: Express.Multer.File): Promise<string> {
    const tempPath = path.join(this.tempDirectory, `temp-${Date.now()}.jpg`);
    await fs.promises.writeFile(tempPath, file.buffer);
    return tempPath;
  }
}
