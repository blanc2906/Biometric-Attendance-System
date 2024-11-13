import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MqttModule } from './mqtt/mqtt.module';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { ExcelExportModule } from './excel-export/excel-export.module';


@Module({
  imports: [ MqttModule, DatabaseModule, UsersModule,ConfigModule.forRoot({isGlobal: true}), ExcelExportModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
