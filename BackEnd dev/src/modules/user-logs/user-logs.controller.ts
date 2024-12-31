import { 
  Controller, 
  Logger, 
  Post, 
  UseInterceptors, 
  UploadedFile, 
  HttpException, 
  HttpStatus,
  UseFilters,
  Get
} from '@nestjs/common';
import { Ctx, MessagePattern, MqttContext, Payload } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import { MqttService } from '../mqtt/mqtt.service';
import { UsersService } from '../users/users.service';
import { UserLogsService } from './user-logs.service';
import { FaceRecognitionService } from '../face-recognition/face-recognition.service';
import { FACE_ATTENDANCE, FINGER_ATTENDANCE, ATTENDANCE_NOTI } from 'src/shared/constants/mqtt.constant';
import { UserDocument } from '../../database/schemas/user.schema';
import { UserLogDocument } from '../../database/schemas/user-log.schema';
import { FileHandlingHelper } from '../../shared/helpers/file-handling.helper';

@Controller('user-logs')
export class UserLogsController {
  private readonly logger = new Logger(UserLogsController.name);
  private readonly THRESHOLD_MINUTES = 5;

  constructor(
    private readonly userLogsService: UserLogsService,
    private readonly usersService: UsersService,
    private readonly mqttService: MqttService,
    private readonly faceRecognitionService: FaceRecognitionService,
    private readonly fileHandlingHelper: FileHandlingHelper,
  ) {}

  @Get()
  async getAllLogs() {
    try {
      const logs = await this.userLogsService.getAllUserLogs();
      return { success: true, data: logs };
    } catch (error) {
      this.handleError('Error fetching logs', error);
    }
  }

  @MessagePattern(FINGER_ATTENDANCE)
  async handleFingerAttendance(
    @Payload() data: string,
    @Ctx() context: MqttContext,
  ) {
    try {
      const user = await this.usersService.findUserByFingerID(Number(data));
      await this.mqttService.publish(ATTENDANCE_NOTI, user.name);
      return this.processAttendance(user._id.toString());
    } catch (error) {
      this.handleError('Error processing finger attendance', error);
    }
  }

  @MessagePattern(FACE_ATTENDANCE)
  async handleFaceAttendance(
    @Payload() data: string,
    @Ctx() context: MqttContext,
  ) {
    try {
      return this.processAttendance(data);
    } catch (error) {
      this.handleError('Error processing face attendance', error);
    }
  }

  @Post('recognize')
  @UseInterceptors(FileInterceptor('image'))
  async recognize(@UploadedFile() file: Express.Multer.File) {
    try {
      const imagePath = await this.fileHandlingHelper.saveTemporaryFile(file);
      const recognizedUser = await this.faceRecognitionService.recognizeFace(imagePath);

      if (!recognizedUser) {
        return { success: false, message: 'Face not recognized' };
      }

      await Promise.all([
        this.mqttService.publish(ATTENDANCE_NOTI, recognizedUser.name),
        this.processAttendance(recognizedUser._id.toString())
      ]);

      return {
        success: true,
        message: 'Face recognized successfully',
        data: recognizedUser,
      };
    } catch (error) {
      this.handleError('Error recognizing face', error);
    }
  }

  private async processAttendance(userId: string): Promise<void> {
    try {
      const [user, latestUserLog] = await Promise.all([
        this.usersService.findOne(userId),
        this.userLogsService.getLatestUserLog(userId)
      ]);

      const currentTime = new Date();

      if (!latestUserLog || this.isNewDay(latestUserLog.date, currentTime)) {
        await this.handleUserLogin(user, latestUserLog);
        return;
      }

      if (!latestUserLog.time_out) {
        await this.handleUserLogout(user, latestUserLog);
      } else {
        await this.handleUserLogin(user, latestUserLog);
      }
    } catch (error) {
      this.handleError('Error processing attendance', error);
    }
  }

  private isNewDay(logDate: Date, currentTime: Date): boolean {
    return logDate.toDateString() !== currentTime.toDateString();
  }

  private isWithinTimeThreshold(previousTime: string, currentTime: Date): boolean {
    const prevDateTime = new Date();
    const [hours, minutes, seconds] = previousTime.split(':');
    prevDateTime.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds));

    const diffInMinutes = Math.abs(currentTime.getTime() - prevDateTime.getTime()) / (1000 * 60);
    return diffInMinutes <= this.THRESHOLD_MINUTES;
  }

  private async handleUserLogin(
    user: UserDocument,
    latestUserLog: UserLogDocument | null,
  ): Promise<void> {
    const currentDate = new Date();
    const timeIn = currentDate.toTimeString().split(' ')[0];

    if (latestUserLog?.time_out && 
        this.isWithinTimeThreshold(latestUserLog.time_out, currentDate)) {
      return;
    }

    this.logger.log(`${user.name} logged in at ${timeIn}`);
    await this.userLogsService.saveUserLog(user._id.toString(), {
      date: currentDate,
      time_in: timeIn,
      time_out: null,
    });
  }

  private async handleUserLogout(
    user: UserDocument,
    latestUserLog: UserLogDocument,
  ): Promise<void> {
    const currentTime = new Date();
    const timeOut = currentTime.toTimeString().split(' ')[0];

    if (this.isWithinTimeThreshold(latestUserLog.time_in, currentTime)) {
      return;
    }

    this.logger.log(`${user.name} logged out at ${timeOut}`);
    await this.userLogsService.updateUserLog(
      user._id.toString(),
      latestUserLog.date,
      latestUserLog.time_in,
      { time_out: timeOut },
    );
  }

  private handleError(message: string, error: any): never {
    this.logger.error(`${message}: ${error.message}`);
    throw new HttpException(
      { status: HttpStatus.BAD_REQUEST, error: error.message },
      HttpStatus.BAD_REQUEST,
    );
  }
} 