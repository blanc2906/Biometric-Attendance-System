import { Module } from '@nestjs/common';
import { ExcelExportService } from './excel-export.service';
import { ExcelExportController } from './excel-export.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { UserLog } from 'src/users/entities/user_log.entity';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User,UserLog]),UsersModule],
  providers: [ExcelExportService, UsersService],
  controllers: [ExcelExportController]
})
export class ExcelExportModule {}