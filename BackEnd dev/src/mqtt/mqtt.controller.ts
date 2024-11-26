import { Controller, Logger, Post, Body, Inject } from '@nestjs/common';
import { ClientMqtt} from '@nestjs/microservices';

@Controller('mqtt')
export class MqttController {
  private readonly logger = new Logger(MqttController.name);

  constructor(
    @Inject('MQTT_CLIENT') private readonly client: ClientMqtt,
  ) {}
}
