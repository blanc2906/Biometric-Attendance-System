"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const microservices_1 = require("@nestjs/microservices");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const config = new swagger_1.DocumentBuilder()
        .setTitle('My API')
        .setDescription('My API description')
        .setVersion('1.0')
        .addTag('api')
        .build();
    const documentFactory = () => swagger_1.SwaggerModule.createDocument(app, config);
    try {
        app.connectMicroservice({
            transport: microservices_1.Transport.MQTT,
            options: {
                url: configService.get('MQTT_URL'),
                username: configService.get('MQTT_USERNAME'),
                password: configService.get('MQTT_PASSWORD'),
                rejectUnauthorized: false,
            },
        });
        await app.startAllMicroservices();
    }
    catch (error) {
        console.error('Error starting microservice:', error);
    }
    swagger_1.SwaggerModule.setup('api', app, documentFactory);
    await app.listen(3000);
}
bootstrap();
//# sourceMappingURL=main.js.map