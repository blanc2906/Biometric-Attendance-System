import { Injectable, OnModuleInit } from '@nestjs/common';
import * as tf from '@tensorflow/tfjs-node';
import * as faceapi from '@vladmandic/face-api';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FaceDescriptor, FaceDescriptorDocument } from './schemas/face-descriptor.schema';
import { User, UserDocument } from './schemas/user.schema';
import * as path from 'path';
import { Canvas, createCanvas, Image, loadImage } from 'canvas';
import { Document } from 'mongoose';
import { EncryptionService } from './encryption.service';

@Injectable()
export class FaceRecognitionService implements OnModuleInit {
    private modelPath = path.join(process.cwd(), 'models');
    private canvas: Canvas;
    private readonly DETECTION_THRESHOLD = 0.5;
    private readonly RECOGNITION_THRESHOLD = 0.45;
    private readonly MIN_FACE_SIZE = 150;
    private readonly MAX_DESCRIPTORS_PER_USER = 5;

    constructor(
        @InjectModel(FaceDescriptor.name)
        private faceDescriptorModel: Model<FaceDescriptorDocument>,
        @InjectModel(User.name)
        private userModel: Model<UserDocument>,
        private encryptionService: EncryptionService
    ) {
        this.canvas = createCanvas(1024, 1024);
        (global as any).HTMLCanvasElement = Canvas;
        (global as any).HTMLImageElement = Image;
        faceapi.env.monkeyPatch({ Canvas: Canvas as any, Image: Image as any });
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
        } catch (error) {
            console.error('Error initializing face recognition:', error);
            throw new Error(`Failed to initialize face recognition: ${error.message}`);
        }
    }

    private async processImage(imagePath: string): Promise<Canvas> {
        try {
            const image = await loadImage(imagePath);
            
            if (image.width < this.MIN_FACE_SIZE || image.height < this.MIN_FACE_SIZE) {
                throw new Error('Image resolution too low for accurate face detection');
            }

            const canvas = createCanvas(image.width, image.height);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);
            return canvas;
        } catch (error) {
            throw new Error(`Failed to process image: ${error.message}`);
        }
    }

    private async detectFaceWithMultipleDetectors(tensor: Canvas): Promise<faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }>>> {
        // Try SSD MobileNet detector first
        const detectionSSD = await faceapi
            .detectSingleFace(tensor as unknown as HTMLCanvasElement, new faceapi.SsdMobilenetv1Options({ minConfidence: this.DETECTION_THRESHOLD }))
            .withFaceLandmarks()
            .withFaceDescriptor();

        // Try TinyFaceDetector with its specific options
        const detectionTiny = await faceapi
            .detectSingleFace(tensor as unknown as HTMLCanvasElement, new faceapi.TinyFaceDetectorOptions({
                inputSize: 416,  // Standard input size for TinyFaceDetector
                scoreThreshold: this.DETECTION_THRESHOLD
            }))
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detectionSSD && !detectionTiny) {
            throw new Error('No face detected in the image');
        }

        // Return the detection with higher confidence
        if (detectionSSD && detectionTiny) {
            return detectionSSD.detection.score > detectionTiny.detection.score ? detectionSSD : detectionTiny;
        }

        return detectionSSD || detectionTiny;
    }

    async addFaceDescriptor(userId: string, imagePath: string) {
        const user = await this.userModel.findById(userId).populate('faceDescriptor');
        
        if (!user) {
            throw new Error(`User with ID ${userId} not found`);
        }

        let tensor: Canvas | null = null;

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
                    const decryptedDescriptor = this.encryptionService.decrypt(
                        fd.descriptor,
                        fd.iv
                    );
                    return new faceapi.LabeledFaceDescriptors(
                        fd.user._id.toString(),
                        [new Float32Array(decryptedDescriptor)]
                    );
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

            const { encryptedData, iv } = this.encryptionService.encrypt(
                Array.from(detection.descriptor)
            );

            const faceDescriptor = new this.faceDescriptorModel({
                descriptor: encryptedData,
                iv: iv,
                user: user._id,
                quality: this.calculateFaceQuality(detection)
            });

            const savedDescriptor = await faceDescriptor.save();
            
            if (!user.faceDescriptor) {
                user.faceDescriptor = savedDescriptor._id as any;
                await user.save();
            }

            return savedDescriptor;
        } catch (error) {
            console.error('Error in face detection process:', error);
            throw new Error(`Face detection failed: ${error.message}`);
        }
    }

    async recognizeFace(imagePath: string): Promise<UserDocument | null> {
        let tensor: Canvas | null = null;

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

            const userDescriptors = new Map<string, Float32Array[]>();
            faceDescriptors.forEach(fd => {
                const userId = fd.user._id.toString();
                const decryptedDescriptor = this.encryptionService.decrypt(fd.descriptor, fd.iv);
                
                if (!userDescriptors.has(userId)) {
                    userDescriptors.set(userId, []);
                }
                userDescriptors.get(userId).push(new Float32Array(decryptedDescriptor));
            });

            const labeledDescriptors = Array.from(userDescriptors.entries()).map(([userId, descriptors]) => 
                new faceapi.LabeledFaceDescriptors(userId, descriptors)
            );

            const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, this.RECOGNITION_THRESHOLD);
            const match = faceMatcher.findBestMatch(detection.descriptor);

            if (match.distance < this.RECOGNITION_THRESHOLD) {
                const userId = match.label;
                const detectedUser = await this.userModel.findById(userId);
                return detectedUser;
            }
            return null;
        } catch (error) {
            console.error('Error in face recognition:', error);
            throw new Error(`Face recognition failed: ${error.message}`);
        }
    }

    private calculateEyeDistance(landmarks: faceapi.FaceLandmarks68): number {
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
        return Math.sqrt(
            Math.pow(rightCenter.x - leftCenter.x, 2) + 
            Math.pow(rightCenter.y - leftCenter.y, 2)
        );
    }

    private calculateFaceQuality(detection: faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }>>): number {
        const confidence = detection.detection.score;
        const landmarks = detection.landmarks;
        const eyeDistance = this.calculateEyeDistance(landmarks);
        
        return (confidence * 0.6) + (eyeDistance / this.MIN_FACE_SIZE * 0.4);
    }
}