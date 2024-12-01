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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionService = void 0;
const common_1 = require("@nestjs/common");
const crypto = require("crypto");
let EncryptionService = class EncryptionService {
    constructor() {
        this.algorithm = 'aes-256-cbc';
        const keyString = process.env.ENCRYPTION_KEY || 'your-secret-key';
        this.key = crypto.scryptSync(keyString, 'salt', 32);
    }
    encrypt(data) {
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
    decrypt(encryptedData, iv) {
        if (!encryptedData || !iv) {
            throw new Error('Encrypted data and IV are required for decryption');
        }
        try {
            const decipher = crypto.createDecipheriv(this.algorithm, this.key, Buffer.from(iv, 'base64'));
            const decrypted = Buffer.concat([
                decipher.update(Buffer.from(encryptedData, 'base64')),
                decipher.final()
            ]);
            return JSON.parse(decrypted.toString('utf8'));
        }
        catch (error) {
            throw new Error(`Decryption failed: ${error.message}`);
        }
    }
};
exports.EncryptionService = EncryptionService;
exports.EncryptionService = EncryptionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EncryptionService);
//# sourceMappingURL=encryption.service.js.map