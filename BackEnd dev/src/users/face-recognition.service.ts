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
                faceapi.nets.faceRecognitionNet.loadFromDisk(this.modelPath)
            ]);
        } catch (error) {
            console.error('Error initializing face recognition:', error);
            throw new Error(`Failed to initialize face recognition: ${error.message}`);
        }
    }

    private async processImage(imagePath: string): Promise<Canvas> {
        try {
            const image = await loadImage(imagePath);
            const canvas = createCanvas(image.width, image.height);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);
            return canvas;
        } catch (error) {
            throw new Error(`Failed to process image: ${error.message}`);
        }
    }

    async addFaceDescriptor(userId: string, imagePath: string) {
        const user = await this.userModel.findById(userId).populate('faceDescriptor');
        
        if (!user) {
            throw new Error(`User with ID ${userId} not found`);
        }

        let tensor: Canvas | null = null;

        try {
            tensor = await this.processImage(imagePath);

            const detection = await faceapi
                .detectSingleFace(tensor as unknown as HTMLCanvasElement)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                throw new Error('No face detected in the image');
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

                const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
                const match = faceMatcher.findBestMatch(detection.descriptor);

                if (match.distance < 0.6) {
                    throw new Error(`This face is already registered for user ID: ${match.label}`);
                }
            }

            if (user.faceDescriptor) {
                await this.faceDescriptorModel.findByIdAndDelete(user.faceDescriptor);
            }

            const { encryptedData, iv } = this.encryptionService.encrypt(
                Array.from(detection.descriptor)
            );

            const faceDescriptor = new this.faceDescriptorModel({
                descriptor: encryptedData,
                iv: iv,
                user: user._id
            });

            const savedDescriptor = await faceDescriptor.save();
            
            user.faceDescriptor = savedDescriptor._id as any;
            await user.save();

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
            
            const detection = await faceapi
                .detectSingleFace(tensor as unknown as HTMLCanvasElement)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                throw new Error('No face detected in the image');
            }

            const faceDescriptors = await this.faceDescriptorModel.find().populate('user');

            if (faceDescriptors.length === 0) {
                return null;
            }

            const labeledDescriptors = faceDescriptors.map(fd => {
                const decryptedDescriptor = this.encryptionService.decrypt(
                    fd.descriptor,
                    fd.iv
                );
                return new faceapi.LabeledFaceDescriptors(
                    fd.user._id.toString(),
                    [new Float32Array(decryptedDescriptor)]
                );
            });

            const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
            const match = faceMatcher.findBestMatch(detection.descriptor);

            if (match.distance < 0.6) {
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
}