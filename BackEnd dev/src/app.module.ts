import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MqttModule } from './modules/mqtt/mqtt.module';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './modules/users/users.module';
import { ConfigModule } from '@nestjs/config';
import { ExcelExportModule } from './modules/excel-export/excel-export.module';
import { SharedModule } from './shared/shared.module';


@Module({
  imports: [ MqttModule, 
    DatabaseModule, 
    UsersModule,
    ConfigModule.forRoot({isGlobal: true}), 
    ExcelExportModule,
    SharedModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
