import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileHandlingHelper {
  private readonly logger = new Logger(FileHandlingHelper.name);
  private readonly tempDirectory = path.join(process.cwd(), 'temporary');

  constructor() {
    this.ensureTempDirectoryExists();
  }

  private ensureTempDirectoryExists(): void {
    if (!fs.existsSync(this.tempDirectory)) {
      fs.mkdirSync(this.tempDirectory, { recursive: true });
    }
  }

  async saveTemporaryFile(file: Express.Multer.File): Promise<string> {
    try {
      const tempPath = path.join(this.tempDirectory, `temp-${Date.now()}.jpg`);
      await fs.promises.writeFile(tempPath, file.buffer);
      
      const fileName = tempPath.split('\\').pop();
      return `http://localhost:3000/temporary/${fileName}`;
    } catch (error) {
      this.logger.error(`Error saving temporary file: ${error.message}`);
      throw error;
    }
  }
} 