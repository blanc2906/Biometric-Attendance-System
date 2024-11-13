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
const user_log_entity_1 = require("./entities/user_log.entity");
const face_recognition_service_1 = require("./face-recognition.service");
const face_recognition_dto_1 = require("./dto/face-recognition.dto");
const fs = require("fs");
const path = require("path");
const platform_express_1 = require("@nestjs/platform-express");
let UsersController = UsersController_1 = class UsersController {
    constructor(usersService, faceRecognitionService) {
        this.usersService = usersService;
        this.faceRecognitionService = faceRecognitionService;
        this.logger = new common_1.Logger(UsersController_1.name);
        this.userLoginStatus = new Map();
    }
    async create() {
        try {
            await this.usersService.initiateUserCreation();
            return { message: "Fingerprint enrollment initiated" };
        }
        catch (error) {
            this.logger.error(`Error initiating user creation: ${error.message}`);
            throw error;
        }
    }
    findAll() {
        return this.usersService.findAll();
    }
    findOne(id) {
        return this.usersService.findOne(+id);
    }
    remove(id) {
        return this.usersService.remove(+id);
    }
    async handleUserLogin(user, latestUserLog) {
        const userLog = new user_log_entity_1.UserLog();
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
    async handleUserLogout(user, latestUserLog) {
        const time_out = new Date().toTimeString().split(' ')[0];
        this.logger.log(`${user.name} logged out at ${time_out}`);
        await this.usersService.updateUserLog(user.id, latestUserLog.date, latestUserLog.time_in, { time_out });
        this.userLoginStatus.set(user.id, false);
    }
    async getNotifications(data, context) {
        try {
            const userId = await this.usersService.findUserByFingerID(Number(data));
            const user = await this.usersService.findOne(userId);
            const latestUserLog = await this.usersService.getLatestUserLog(userId);
            const isLoggedIn = this.userLoginStatus.get(userId) || false;
            if (isLoggedIn && latestUserLog && !latestUserLog.time_out) {
                await this.handleUserLogout(user, latestUserLog);
            }
            else {
                await this.handleUserLogin(user, latestUserLog);
            }
        }
        catch (error) {
            this.logger.error(`Error processing user: ${error.message}`);
        }
    }
    async createUser(data) {
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
        }
        catch (error) {
            this.logger.error(`Error creating user: ${error.message}`);
        }
    }
    async addFace(id, faceRecognitionDto) {
        try {
            console.log(`Processing face addition for user ${id}`);
            console.log('Image path:', faceRecognitionDto.imagePath);
            const result = await this.faceRecognitionService.addFaceDescriptor(+id, faceRecognitionDto.imagePath);
            console.log('Face addition result:', result);
            return {
                success: true,
                message: 'Face descriptor added successfully',
                data: result
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
        try {
            const tempPath = path.join(process.cwd(), 'temporary', `temp-${Date.now()}.jpg`);
            fs.writeFileSync(tempPath, file.buffer);
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
        }
        catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Post)('create_user'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "create", null);
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
    (0, microservices_1.MessagePattern)('user_log'),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, microservices_1.MqttContext]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getNotifications", null);
__decorate([
    (0, microservices_1.MessagePattern)('create_new_user'),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "createUser", null);
__decorate([
    (0, common_1.Post)(':id/face'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, face_recognition_dto_1.FaceRecognitionDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "addFace", null);
__decorate([
    (0, common_1.Post)('recognize'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('imageFile')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "recognizeFaceFromCamera", null);
exports.UsersController = UsersController = UsersController_1 = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        face_recognition_service_1.FaceRecognitionService])
], UsersController);
//# sourceMappingURL=users.controller.js.map