export declare class EncryptionService {
    private readonly algorithm;
    private readonly key;
    constructor();
    encrypt(data: number[]): {
        encryptedData: string;
        iv: string;
    };
    decrypt(encryptedData: string, iv: string): number[];
}
