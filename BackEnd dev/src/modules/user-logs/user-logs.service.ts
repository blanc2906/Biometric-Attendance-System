import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserLog, UserLogDocument } from '../../database/schemas/user-log.schema';
import { CreateUserLogDto, UpdateUserLogDto, UserLogResponseDto } from './dto/user-log.dto';

@Injectable()
export class UserLogsService {
  private readonly logger = new Logger(UserLogsService.name);
  private readonly logCache = new Map<string, UserLogDocument>();
  private readonly CACHE_TTL = 5 * 60 * 1000; 

  constructor(
    @InjectModel(UserLog.name)
    private readonly userLogModel: Model<UserLogDocument>,
  ) {}

  async getAllUserLogs(): Promise<UserLogResponseDto[]> {
    try {
      const logs = await this.userLogModel.find()
        .populate('user', 'name id_nvien')
        .sort({ date: -1, time_in: -1 })
        .lean()
        .exec();

      return logs.map(log => ({
        id: log._id.toString(),
        user_name: log.user?.name,
        user_id: log.user?.id_nvien,
        date: log.date,
        time_in: log.time_in,
        time_out: log.time_out || '',
      }));
    } catch (error) {
      this.logger.error(`Error fetching all logs: ${error.message}`);
      throw error;
    }
  }

  async saveUserLog(userId: string, createUserLogDto: CreateUserLogDto): Promise<UserLogDocument> {
    try {
      const userLog = new this.userLogModel({
        user: new Types.ObjectId(userId),
        ...createUserLogDto
      });
      const savedLog = await userLog.save();
      this.cacheLog(savedLog);
      return savedLog;
    } catch (error) {
      this.logger.error(`Error saving user log: ${error.message}`);
      throw error;
    }
  }

  async updateUserLog(
    userId: string, 
    date: Date, 
    time_in: string, 
    updateUserLogDto: UpdateUserLogDto
  ): Promise<UserLogDocument> {
    try {
      const userObjectId = new Types.ObjectId(userId);
      const { startOfDay, endOfDay } = this.getDayBoundaries(date);

      const userLog = await this.userLogModel.findOne({
        user: userObjectId,
        date: { $gte: startOfDay, $lte: endOfDay },
        time_out: null
      }).sort({ time_in: -1 });

      if (!userLog) {
        throw new NotFoundException(`Active user log not found for date ${date}`);
      }

      Object.assign(userLog, updateUserLogDto);
      const updatedLog = await userLog.save();
      this.cacheLog(updatedLog);
      return updatedLog;
    } catch (error) {
      this.logger.error(`Error updating user log: ${error.message}`);
      throw error;
    }
  }

  async getLatestUserLog(userId: string): Promise<UserLogDocument | null> {
    const cacheKey = `latest_${userId}`;
    const cachedLog = this.logCache.get(cacheKey);
    if (cachedLog) return cachedLog;

    try {
      const userObjectId = new Types.ObjectId(userId);
      const latestLog = await this.userLogModel.findOne({ user: userObjectId })
        .sort({ date: -1, time_in: -1 })
        .exec();

      if (latestLog) {
        this.cacheLog(latestLog, cacheKey);
      }
      return latestLog;
    } catch (error) {
      this.logger.error(`Error fetching latest log: ${error.message}`);
      throw error;
    }
  }

  async populateData(): Promise<UserLogResponseDto[]> {
    try {
      return await this.userLogModel.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $project: {
            id: '$user.id_nvien',
            name: '$user.name',
            date: '$date',
            time_in: '$time_in',
            time_out: { $ifNull: ['$time_out', ''] }
          }
        },
        { $sort: { date: -1, time_in: -1 } }
      ]).exec();
    } catch (error) {
      this.logger.error(`Error populating data: ${error.message}`);
      throw error;
    }
  }

  private getDayBoundaries(date: Date): { startOfDay: Date; endOfDay: Date } {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return { startOfDay, endOfDay };
  }

  private cacheLog(log: UserLogDocument, customKey?: string): void {
    const key = customKey || log._id.toString();
    this.logCache.set(key, log);
    setTimeout(() => this.logCache.delete(key), this.CACHE_TTL);
  }
} 