import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import * as dotenv from 'dotenv';
dotenv.config();
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  try {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.MQTT,
      options: {
        url: process.env.MQTT_URL,
        username: process.env.MQTT_USERNAME,
        password: process.env.MQTT_PASSWORD,
        rejectUnauthorized: false,
      },
    });
    await app.startAllMicroservices();
  } catch (error) {
    console.error('Error starting microservice:', error);
  }
  await app.listen(9000);
}
bootstrap();
