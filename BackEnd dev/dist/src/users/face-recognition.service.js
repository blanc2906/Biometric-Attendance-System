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
const encryption_service_1 = require("./encryption.service");
let FaceRecognitionService = class FaceRecognitionService {
    constructor(faceDescriptorModel, userModel, encryptionService) {
        this.faceDescriptorModel = faceDescriptorModel;
        this.userModel = userModel;
        this.encryptionService = encryptionService;
        this.modelPath = path.join(process.cwd(), 'models');
        this.DETECTION_THRESHOLD = 0.5;
        this.RECOGNITION_THRESHOLD = 0.45;
        this.MIN_FACE_SIZE = 150;
        this.MAX_DESCRIPTORS_PER_USER = 5;
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
                faceapi.nets.faceRecognitionNet.loadFromDisk(this.modelPath),
                faceapi.nets.tinyFaceDetector.loadFromDisk(this.modelPath)
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
            if (image.width < this.MIN_FACE_SIZE || image.height < this.MIN_FACE_SIZE) {
                throw new Error('Image resolution too low for accurate face detection');
            }
            const canvas = (0, canvas_1.createCanvas)(image.width, image.height);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);
            return canvas;
        }
        catch (error) {
            throw new Error(`Failed to process image: ${error.message}`);
        }
    }
    async detectFaceWithMultipleDetectors(tensor) {
        const detectionSSD = await faceapi
            .detectSingleFace(tensor, new faceapi.SsdMobilenetv1Options({ minConfidence: this.DETECTION_THRESHOLD }))
            .withFaceLandmarks()
            .withFaceDescriptor();
        const detectionTiny = await faceapi
            .detectSingleFace(tensor, new faceapi.TinyFaceDetectorOptions({
            inputSize: 416,
            scoreThreshold: this.DETECTION_THRESHOLD
        }))
            .withFaceLandmarks()
            .withFaceDescriptor();
        if (!detectionSSD && !detectionTiny) {
            throw new Error('No face detected in the image');
        }
        if (detectionSSD && detectionTiny) {
            return detectionSSD.detection.score > detectionTiny.detection.score ? detectionSSD : detectionTiny;
        }
        return detectionSSD || detectionTiny;
    }
    async addFaceDescriptor(userId, imagePath) {
        const user = await this.userModel.findById(userId).populate('faceDescriptor');
        if (!user) {
            throw new Error(`User with ID ${userId} not found`);
        }
        let tensor = null;
        try {
            tensor = await this.processImage(imagePath);
            const detection = await this.detectFaceWithMultipleDetectors(tensor);
            if (!detection) {
                throw new Error('No face detected in the image with sufficient confidence');
            }
            const landmarks = detection.landmarks;
            const eyeDistance = this.calculateEyeDistance(landmarks);
            if (eyeDistance < this.MIN_FACE_SIZE / 4) {
                throw new Error('Face too small or poorly aligned');
            }
            const existingFaceDescriptors = await this.faceDescriptorModel.find().populate('user');
            if (existingFaceDescriptors.length > 0) {
                const labeledDescriptors = existingFaceDescriptors.map(fd => {
                    const decryptedDescriptor = this.encryptionService.decrypt(fd.descriptor, fd.iv);
                    return new faceapi.LabeledFaceDescriptors(fd.user._id.toString(), [new Float32Array(decryptedDescriptor)]);
                });
                const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, this.RECOGNITION_THRESHOLD);
                const match = faceMatcher.findBestMatch(detection.descriptor);
                if (match.distance < this.RECOGNITION_THRESHOLD) {
                    throw new Error(`This face is already registered for user ID: ${match.label}`);
                }
            }
            const userDescriptors = await this.faceDescriptorModel.find({ user: userId });
            if (userDescriptors.length >= this.MAX_DESCRIPTORS_PER_USER) {
                await this.faceDescriptorModel.findByIdAndDelete(userDescriptors[0]._id);
            }
            const { encryptedData, iv } = this.encryptionService.encrypt(Array.from(detection.descriptor));
            const faceDescriptor = new this.faceDescriptorModel({
                descriptor: encryptedData,
                iv: iv,
                user: user._id,
                quality: this.calculateFaceQuality(detection)
            });
            const savedDescriptor = await faceDescriptor.save();
            if (!user.faceDescriptor) {
                user.faceDescriptor = savedDescriptor._id;
                await user.save();
            }
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
            const detection = await this.detectFaceWithMultipleDetectors(tensor);
            if (!detection) {
                throw new Error('No face detected in the image with sufficient confidence');
            }
            const faceDescriptors = await this.faceDescriptorModel.find().populate('user');
            if (faceDescriptors.length === 0) {
                return null;
            }
            const userDescriptors = new Map();
            faceDescriptors.forEach(fd => {
                const userId = fd.user._id.toString();
                const decryptedDescriptor = this.encryptionService.decrypt(fd.descriptor, fd.iv);
                if (!userDescriptors.has(userId)) {
                    userDescriptors.set(userId, []);
                }
                userDescriptors.get(userId).push(new Float32Array(decryptedDescriptor));
            });
            const labeledDescriptors = Array.from(userDescriptors.entries()).map(([userId, descriptors]) => new faceapi.LabeledFaceDescriptors(userId, descriptors));
            const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, this.RECOGNITION_THRESHOLD);
            const match = faceMatcher.findBestMatch(detection.descriptor);
            if (match.distance < this.RECOGNITION_THRESHOLD) {
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
    calculateEyeDistance(landmarks) {
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();
        const leftCenter = {
            x: leftEye.reduce((sum, pt) => sum + pt.x, 0) / leftEye.length,
            y: leftEye.reduce((sum, pt) => sum + pt.y, 0) / leftEye.length
        };
        const rightCenter = {
            x: rightEye.reduce((sum, pt) => sum + pt.x, 0) / rightEye.length,
            y: rightEye.reduce((sum, pt) => sum + pt.y, 0) / rightEye.length
        };
        return Math.sqrt(Math.pow(rightCenter.x - leftCenter.x, 2) +
            Math.pow(rightCenter.y - leftCenter.y, 2));
    }
    calculateFaceQuality(detection) {
        const confidence = detection.detection.score;
        const landmarks = detection.landmarks;
        const eyeDistance = this.calculateEyeDistance(landmarks);
        return (confidence * 0.6) + (eyeDistance / this.MIN_FACE_SIZE * 0.4);
    }
};
exports.FaceRecognitionService = FaceRecognitionService;
exports.FaceRecognitionService = FaceRecognitionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(face_descriptor_schema_1.FaceDescriptor.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        encryption_service_1.EncryptionService])
], FaceRecognitionService);
//# sourceMappingURL=face-recognition.service.js.map