import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
    private readonly algorithm = 'aes-256-cbc';
    private readonly key: Buffer;

    constructor() {
        const keyString = process.env.ENCRYPTION_KEY || 'your-secret-key';
        this.key = crypto.scryptSync(keyString, 'salt', 32);
    }

    encrypt(data: number[]): { encryptedData: string, iv: string } {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
        
        const encrypted = Buffer.concat([
            cipher.update(JSON.stringify(data), 'utf8'),
            cipher.final()
        ]);

        return {
            encryptedData: encrypted.toString('base64'),
            iv: iv.toString('base64')
        };
    }

    decrypt(encryptedData: string, iv: string): number[] {
        if (!encryptedData || !iv) {
            throw new Error('Encrypted data and IV are required for decryption');
        }

        try {
            const decipher = crypto.createDecipheriv(
                this.algorithm, 
                this.key, 
                Buffer.from(iv, 'base64')
            );
            
            const decrypted = Buffer.concat([
                decipher.update(Buffer.from(encryptedData, 'base64')),
                decipher.final()
            ]);

            return JSON.parse(decrypted.toString('utf8'));
        } catch (error) {
            throw new Error(`Decryption failed: ${error.message}`);
        }
    }
} 