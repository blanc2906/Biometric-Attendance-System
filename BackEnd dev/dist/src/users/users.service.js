"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("./schemas/user.schema");
const user_log_schema_1 = require("./schemas/user-log.schema");
const mqtt_service_1 = require("../mqtt/mqtt.service");
const face_descriptor_schema_1 = require("./schemas/face-descriptor.schema");
let UsersService = class UsersService {
    constructor(userModel, userLogModel, faceDescriptorModel, mqttService) {
        this.userModel = userModel;
        this.userLogModel = userLogModel;
        this.faceDescriptorModel = faceDescriptorModel;
        this.mqttService = mqttService;
        this.userCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000;
    }
    async findUserOrThrow(id) {
        const user = await this.userModel.findById(id);
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }
    async create(createUserDto) {
        try {
            if (isNaN(createUserDto.finger_id)) {
                throw new Error('Invalid finger_id');
            }
            const existingUser = await this.userModel.findOne({
                finger_id: createUserDto.finger_id
            });
            if (existingUser) {
                throw new Error(`User with finger_id ${createUserDto.finger_id} already exists`);
            }
            const user = new this.userModel(createUserDto);
            return await user.save();
        }
        catch (error) {
            throw new Error(`Failed to create user: ${error.message}`);
        }
    }
    async findAll() {
        return await this.userModel.find().exec();
    }
    async findOne(id) {
        const cachedUser = this.userCache.get(id);
        if (cachedUser)
            return cachedUser;
        const user = await this.findUserOrThrow(id);
        await this.cacheUser(user);
        return user;
    }
    async findUserByFingerID(finger_id) {
        const user = await this.userModel.findOne({ finger_id });
        if (!user) {
            throw new common_1.NotFoundException(`User with Finger ID ${finger_id} not found`);
        }
        return user._id.toString();
    }
    async remove(id) {
        const user = await this.userModel.findById(id)
            .populate('userlog')
            .populate('faceDescriptor');
        if (!user) {
            throw new common_1.NotFoundException(`User with id ${id} not found`);
        }
        await this.faceDescriptorModel.deleteOne({ user: user._id });
        await this.userLogModel.deleteMany({ user: user._id });
        await this.userModel.findByIdAndDelete(id);
        try {
            await this.mqttService.publish('delete_user', user.finger_id.toString());
        }
        catch (error) {
            console.error('Failed to publish delete_user message:', error);
        }
    }
    async saveUserLog(userId, createUserLogDto) {
        const user = await this.findOne(userId);
        const userLog = new this.userLogModel({
            user: user._id,
            ...createUserLogDto
        });
        const savedLog = await userLog.save();
        user.userlog.push(savedLog._id);
        await user.save();
        return savedLog;
    }
    async updateUserLog(userId, date, time_in, updateUserLogDto) {
        const userObjectId = new mongoose_2.Types.ObjectId(userId);
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        const userLog = await this.userLogModel.findOne({
            user: userObjectId,
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            },
            time_out: null
        }).sort({ time_in: -1 });
        if (!userLog) {
            console.log('No matching log found for update');
            throw new common_1.NotFoundException(`User log not found`);
        }
        Object.assign(userLog, updateUserLogDto);
        const updatedLog = await userLog.save();
        return updatedLog;
    }
    async getLatestUserLog(userId) {
        const userObjectId = new mongoose_2.Types.ObjectId(userId);
        const latestLog = await this.userLogModel.findOne({
            user: userObjectId
        })
            .sort({ date: -1, time_in: -1 })
            .exec();
        return latestLog;
    }
    async populateData() {
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
                    id: '$user._id',
                    name: '$user.name',
                    date: '$date',
                    time_in: '$time_in',
                    time_out: { $ifNull: ['$time_out', ''] }
                }
            }
        ]).exec();
    }
    async cacheUser(user) {
        this.userCache.set(user._id.toString(), user);
        setTimeout(() => this.userCache.delete(user._id.toString()), this.cacheTimeout);
    }
    async initiateUserCreation() {
        await this.mqttService.publish('enroll_fingerprint', '');
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_log_schema_1.UserLog.name)),
    __param(2, (0, mongoose_1.InjectModel)(face_descriptor_schema_1.FaceDescriptor.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mqtt_service_1.MqttService])
], UsersService);
//# sourceMappingURL=users.service.js.map