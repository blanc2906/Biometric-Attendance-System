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
exports.FaceRecognitionService = void 0;
const common_1 = require("@nestjs/common");
const tf = require("@tensorflow/tfjs-node");
const faceapi = require("@vladmandic/face-api");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const face_descriptor_schema_1 = require("./schemas/face-descriptor.schema");
const user_schema_1 = require("./schemas/user.schema");
const path = require("path");
const canvas_1 = require("canvas");
let FaceRecognitionService = class FaceRecognitionService {
    constructor(faceDescriptorModel, userModel) {
        this.faceDescriptorModel = faceDescriptorModel;
        this.userModel = userModel;
        this.modelPath = path.join(process.cwd(), 'models');
        this.canvas = (0, canvas_1.createCanvas)(1024, 1024);
        global.HTMLCanvasElement = canvas_1.Canvas;
        global.HTMLImageElement = canvas_1.Image;
        faceapi.env.monkeyPatch({ Canvas: canvas_1.Canvas, Image: canvas_1.Image });
    }
    async onModuleInit() {
        try {
            await tf.ready();
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromDisk(this.modelPath),
                faceapi.nets.faceLandmark68Net.loadFromDisk(this.modelPath),
                faceapi.nets.faceRecognitionNet.loadFromDisk(this.modelPath)
            ]);
        }
        catch (error) {
            console.error('Error initializing face recognition:', error);
            throw new Error(`Failed to initialize face recognition: ${error.message}`);
        }
    }
    async processImage(imagePath) {
        try {
            const image = await (0, canvas_1.loadImage)(imagePath);
            const canvas = (0, canvas_1.createCanvas)(image.width, image.height);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);
            return canvas;
        }
        catch (error) {
            throw new Error(`Failed to process image: ${error.message}`);
        }
    }
    async addFaceDescriptor(userId, imagePath) {
        const user = await this.userModel.findById(userId).populate('faceDescriptor');
        if (!user) {
            throw new Error(`User with ID ${userId} not found`);
        }
        let tensor = null;
        try {
            tensor = await this.processImage(imagePath);
            const detection = await faceapi
                .detectSingleFace(tensor)
                .withFaceLandmarks()
                .withFaceDescriptor();
            if (!detection) {
                throw new Error('No face detected in the image');
            }
            const existingFaceDescriptors = await this.faceDescriptorModel.find().populate('user');
            if (existingFaceDescriptors.length > 0) {
                const labeledDescriptors = existingFaceDescriptors.map(fd => new faceapi.LabeledFaceDescriptors(fd.user._id.toString(), [new Float32Array(fd.descriptor)]));
                const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
                const match = faceMatcher.findBestMatch(detection.descriptor);
                if (match.distance < 0.6) {
                    throw new Error(`This face is already registered for user ID: ${match.label}`);
                }
            }
            if (user.faceDescriptor) {
                await this.faceDescriptorModel.findByIdAndDelete(user.faceDescriptor);
            }
            const faceDescriptor = new this.faceDescriptorModel({
                descriptor: Array.from(detection.descriptor),
                user: user._id
            });
            const savedDescriptor = await faceDescriptor.save();
            user.faceDescriptor = savedDescriptor._id;
            await user.save();
            return savedDescriptor;
        }
        catch (error) {
            console.error('Error in face detection process:', error);
            throw new Error(`Face detection failed: ${error.message}`);
        }
    }
    async recognizeFace(imagePath) {
        let tensor = null;
        try {
            tensor = await this.processImage(imagePath);
            const detection = await faceapi
                .detectSingleFace(tensor)
                .withFaceLandmarks()
                .withFaceDescriptor();
            if (!detection) {
                throw new Error('No face detected in the image');
            }
            const faceDescriptors = await this.faceDescriptorModel.find().populate('user');
            if (faceDescriptors.length === 0) {
                return null;
            }
            const labeledDescriptors = faceDescriptors.map(fd => new faceapi.LabeledFaceDescriptors(fd.user._id.toString(), [new Float32Array(fd.descriptor)]));
            const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
            const match = faceMatcher.findBestMatch(detection.descriptor);
            if (match.distance < 0.6) {
                const userId = match.label;
                const detectedUser = await this.userModel.findById(userId);
                return detectedUser;
            }
            return null;
        }
        catch (error) {
            console.error('Error in face recognition:', error);
            throw new Error(`Face recognition failed: ${error.message}`);
        }
    }
};
exports.FaceRecognitionService = FaceRecognitionService;
exports.FaceRecognitionService = FaceRecognitionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(face_descriptor_schema_1.FaceDescriptor.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], FaceRecognitionService);
//# sourceMappingURL=face-recognition.service.js.map