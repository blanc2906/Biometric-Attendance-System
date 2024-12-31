import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  Logger,
  HttpException,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { FaceRecognitionService } from '../face-recognition/face-recognition.service';
import * as fs from 'fs';
import * as path from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateUserDto } from './dto/user.dto';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);
  private readonly tempDirectory = path.join(process.cwd(), 'temporary');

  constructor(
    private readonly usersService: UsersService,
    private readonly faceRecognitionService: FaceRecognitionService,
  ) {
    if (!fs.existsSync(this.tempDirectory)) {
      fs.mkdirSync(this.tempDirectory, { recursive: true });
    }
  }

  @Post('init-create-user')
  async initiateUserCreation() {
    await this.usersService.initiateUserCreation();
  }

  @Post()
  async createNewUser(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post(':id/add-face')
  @UseInterceptors(FileInterceptor('image'))
  async addFace(
    @UploadedFile() file: Express.Multer.File,
    @Param('id') id: string,
  ) {
    try {
      const tempPath = await this.handleImageFile(file);
      const fileName = tempPath.split('\\').pop();
      const imagePath = `http://localhost:3000/temporary/${fileName}`;
      
      const addedUser = await this.faceRecognitionService.addFaceDescriptor(id, imagePath);

      return {
        success: true,
        message: 'Face descriptor added successfully',
        data: addedUser,
        tempPath: imagePath,
      };
    } catch (error) {
      this.logger.error(`Error adding face: ${error.message}`);
      throw new HttpException(
        { status: HttpStatus.BAD_REQUEST, error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async handleImageFile(file: Express.Multer.File): Promise<string> {
    const tempPath = path.join(this.tempDirectory, `temp-${Date.now()}.jpg`);
    await fs.promises.writeFile(tempPath, file.buffer);
    return tempPath;
  }
}
