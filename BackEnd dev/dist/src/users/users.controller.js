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
var UsersController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const microservices_1 = require("@nestjs/microservices");
const face_recognition_service_1 = require("./face-recognition.service");
const fs = require("fs");
const path = require("path");
const platform_express_1 = require("@nestjs/platform-express");
const mqtt_service_1 = require("../mqtt/mqtt.service");
const user_dto_1 = require("./dto/user.dto");
let UsersController = UsersController_1 = class UsersController {
    constructor(usersService, faceRecognitionService, mqttService) {
        this.usersService = usersService;
        this.faceRecognitionService = faceRecognitionService;
        this.mqttService = mqttService;
        this.logger = new common_1.Logger(UsersController_1.name);
        this.tempDirectory = path.join(process.cwd(), 'temporary');
        if (!fs.existsSync(this.tempDirectory)) {
            fs.mkdirSync(this.tempDirectory, { recursive: true });
        }
    }
    async createNewUser(createUserDto) {
        await this.usersService.initiateUserCreation();
        await this.usersService.create(createUserDto);
    }
    findAll() {
        return this.usersService.findAll();
    }
    findOne(id) {
        return this.usersService.findOne(id);
    }
    remove(id) {
        return this.usersService.remove(id);
    }
    async addFace(file, id) {
        try {
            const tempPath = path.join(process.cwd(), 'temporary', `temp-${Date.now()}.jpg`);
            fs.writeFileSync(tempPath, file.buffer);
            const addedUser = await this.faceRecognitionService.addFaceDescriptor(id, tempPath);
            fs.unlinkSync(tempPath);
            return {
                success: true,
                message: 'Face descriptor added successfully',
                data: addedUser
            };
        }
        catch (error) {
            console.error('Full error:', error);
            this.logger.error(`Error adding face: ${error.message}`);
            throw new common_1.HttpException({
                status: common_1.HttpStatus.BAD_REQUEST,
                error: error.message,
                stack: error.stack
            }, common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async recognizeFaceFromCamera(file) {
        let tempPath = null;
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
        }
        catch (error) {
            return { success: false, message: error.message };
        }
        finally {
            if (tempPath)
                await fs.promises.unlink(tempPath).catch(() => { });
        }
    }
    async handleFingerAttendance(data, context) {
        const userID = await this.usersService.findUserByFingerID(Number(data));
        return this.processAttendance(userID.toString());
    }
    async handleFaceAttendance(data, context) {
        return this.processAttendance(data);
    }
    async handleUserLogin(user, latestUserLog) {
        const currentDate = new Date();
        const timeIn = currentDate.toTimeString().split(' ')[0];
        this.logger.log(`${user.name} logged in at ${timeIn}`);
        await this.usersService.saveUserLog(user._id.toString(), {
            date: currentDate,
            time_in: timeIn,
            time_out: null
        });
    }
    async handleUserLogout(user, latestUserLog) {
        const timeOut = new Date().toTimeString().split(' ')[0];
        this.logger.log(`${user.name} logged out at ${timeOut}`);
        await this.usersService.updateUserLog(user._id.toString(), latestUserLog.date, latestUserLog.time_in, { time_out: timeOut });
    }
    async processAttendance(data) {
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
            }
            else {
                await this.handleUserLogin(user, latestUserLog);
            }
        }
        catch (error) {
            this.logger.error(`Error processing attendance: ${error.message}`);
            throw error;
        }
    }
    async handleImageFile(file) {
        const tempPath = path.join(this.tempDirectory, `temp-${Date.now()}.jpg`);
        await fs.promises.writeFile(tempPath, file.buffer);
        return tempPath;
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Post)('create-user'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_dto_1.CreateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "createNewUser", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/add-face'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "addFace", null);
__decorate([
    (0, common_1.Post)('recognize'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "recognizeFaceFromCamera", null);
__decorate([
    (0, microservices_1.MessagePattern)('finger_attendance'),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, microservices_1.MqttContext]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "handleFingerAttendance", null);
__decorate([
    (0, microservices_1.MessagePattern)('face_attendance'),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, microservices_1.MqttContext]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "handleFaceAttendance", null);
exports.UsersController = UsersController = UsersController_1 = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        face_recognition_service_1.FaceRecognitionService,
        mqtt_service_1.MqttService])
], UsersController);
//# sourceMappingURL=users.controller.js.map