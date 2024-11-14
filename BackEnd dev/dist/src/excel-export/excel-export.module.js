"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelExportModule = void 0;
const common_1 = require("@nestjs/common");
const excel_export_service_1 = require("./excel-export.service");
const excel_export_controller_1 = require("./excel-export.controller");
const typeorm_1 = require("@nestjs/typeorm");
const user_entity_1 = require("../users/entities/user.entity");
const user_log_entity_1 = require("../users/entities/user_log.entity");
const users_module_1 = require("../users/users.module");
const users_service_1 = require("../users/users.service");
const mqtt_module_1 = require("../mqtt/mqtt.module");
const mqtt_service_1 = require("../mqtt/mqtt.service");
const face_descriptor_entity_1 = require("../users/entities/face-descriptor.entity");
let ExcelExportModule = class ExcelExportModule {
};
exports.ExcelExportModule = ExcelExportModule;
exports.ExcelExportModule = ExcelExportModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, user_log_entity_1.UserLog, face_descriptor_entity_1.FaceDescriptor]),
            users_module_1.UsersModule,
            mqtt_module_1.MqttModule
        ],
        providers: [excel_export_service_1.ExcelExportService, users_service_1.UsersService, mqtt_service_1.MqttService],
        controllers: [excel_export_controller_1.ExcelExportController]
    })
], ExcelExportModule);
//# sourceMappingURL=excel-export.module.js.map