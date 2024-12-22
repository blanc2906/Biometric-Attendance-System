// src/shared/helpers/encrypt.helper.ts
import * as crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EncryptHelper {
    private readonly algorithm = 'aes-256-cbc';
    private readonly key: Buffer;

    constructor(private configService: ConfigService) {
        const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY') || 'bai-tap-lon';
        this.key = crypto.scryptSync(encryptionKey, 'salt', 32);
    }

    encrypt(data: number[]): { encryptedData: string; iv: string } {
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