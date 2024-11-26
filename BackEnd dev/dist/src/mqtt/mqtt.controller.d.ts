import { ClientMqtt } from '@nestjs/microservices';
export declare class MqttController {
    private readonly client;
    private readonly logger;
    constructor(client: ClientMqtt);
}
