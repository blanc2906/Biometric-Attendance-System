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
const mongoose_1 = require("@nestjs/mongoose");
const user_schema_1 = require("../users/schemas/user.schema");
const user_log_schema_1 = require("../users/schemas/user-log.schema");
const users_module_1 = require("../users/users.module");
const users_service_1 = require("../users/users.service");
const mqtt_module_1 = require("../mqtt/mqtt.module");
const mqtt_service_1 = require("../mqtt/mqtt.service");
const face_descriptor_schema_1 = require("../users/schemas/face-descriptor.schema");
let ExcelExportModule = class ExcelExportModule {
};
exports.ExcelExportModule = ExcelExportModule;
exports.ExcelExportModule = ExcelExportModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: user_log_schema_1.UserLog.name, schema: user_log_schema_1.UserLogSchema },
                { name: face_descriptor_schema_1.FaceDescriptor.name, schema: face_descriptor_schema_1.FaceDescriptorSchema }
            ]),
            users_module_1.UsersModule,
            mqtt_module_1.MqttModule
        ],
        providers: [excel_export_service_1.ExcelExportService, users_service_1.UsersService, mqtt_service_1.MqttService],
        controllers: [excel_export_controller_1.ExcelExportController]
    })
], ExcelExportModule);
//# sourceMappingURL=excel-export.module.js.map