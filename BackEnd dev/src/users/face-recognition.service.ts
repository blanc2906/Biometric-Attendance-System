import { Injectable, OnModuleInit } from '@nestjs/common';
import * as tf from '@tensorflow/tfjs-node';
import * as faceapi from '@vladmandic/face-api';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FaceDescriptor } from './entities/face-descriptor.entity';
import { User } from './entities/user.entity';
import * as path from 'path';
import { Canvas, createCanvas, Image, loadImage } from 'canvas';

@Injectable()
export class FaceRecognitionService implements OnModuleInit {
    private modelPath = path.join(process.cwd(), 'models');
    private canvas: Canvas;

    constructor(
        @InjectRepository(FaceDescriptor)
        private faceDescriptorRepository: Repository<FaceDescriptor>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
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

    async addFaceDescriptor(userId: number, imagePath: string) {
        console.log(`Processing face descriptor for user ${userId} with image: ${imagePath}`);
        
        const user = await this.userRepository.findOne({ 
            where: { id: userId },
            relations: ['faceDescriptor'] 
        });
        
        if (!user) {
            throw new Error(`User with ID ${userId} not found`);
        }

        let tensor: Canvas | null = null;

        try {
            tensor = await this.processImage(imagePath);
            
            console.log('Starting face detection');
            const detection = await faceapi
                .detectSingleFace(tensor as unknown as HTMLCanvasElement)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                throw new Error('No face detected in the image');
            }

            if (user.faceDescriptor) {
                await this.faceDescriptorRepository.remove(user.faceDescriptor);
            }

            const faceDescriptor = this.faceDescriptorRepository.create({
                descriptor: Array.from(detection.descriptor),
                user: user
            });

            const savedDescriptor = await this.faceDescriptorRepository.save(faceDescriptor);
            
            user.faceDescriptor = savedDescriptor;
            await this.userRepository.save(user);

            return savedDescriptor;
        } catch (error) {
            console.error('Error in face detection process:', error);
            throw new Error(`Face detection failed: ${error.message}`);
        } finally {
        }
    }

    async recognizeFace(imagePath: string): Promise<User | null> {
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

            const faceDescriptors = await this.faceDescriptorRepository.find({
                relations: ['user']
            });

            if (faceDescriptors.length === 0) {
                return null;
            }

            const labeledDescriptors = faceDescriptors.map(fd => 
                new faceapi.LabeledFaceDescriptors(
                    fd.user.id.toString(),
                    [new Float32Array(fd.descriptor)]
                )
            );

            const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
            const match = faceMatcher.findBestMatch(detection.descriptor);

            if (match.distance < 0.6) {
                return await this.userRepository.findOne({
                    where: { id: parseInt(match.label) }
                });
            }

            return null;
        } catch (error) {
            console.error('Error in face recognition:', error);
            throw new Error(`Face recognition failed: ${error.message}`);
        } finally {
        }
    }
}