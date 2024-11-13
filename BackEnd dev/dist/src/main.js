"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const microservices_1 = require("@nestjs/microservices");
const dotenv = require("dotenv");
dotenv.config();
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    try {
        app.connectMicroservice({
            transport: microservices_1.Transport.MQTT,
            options: {
                url: process.env.MQTT_URL,
                username: process.env.MQTT_USERNAME,
                password: process.env.MQTT_PASSWORD,
                rejectUnauthorized: false,
            },
        });
        await app.startAllMicroservices();
    }
    catch (error) {
        console.error('Error starting microservice:', error);
    }
    await app.listen(9000);
}
bootstrap();
//# sourceMappingURL=main.js.map