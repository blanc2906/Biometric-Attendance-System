"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelExportService = void 0;
const common_1 = require("@nestjs/common");
const exceljs_1 = require("exceljs");
const path_1 = require("path");
const users_service_1 = require("../users/users.service");
let ExcelExportService = class ExcelExportService {
    constructor(userService) {
        this.userService = userService;
    }
    async downloadExcel() {
        const data = await this.userService.populateData();
        if (!data || data.length === 0) {
            throw new common_1.NotFoundException("No data available");
        }
        const workbook = new exceljs_1.Workbook();
        const sheet = workbook.addWorksheet('Attendance Report');
        const headers = ['ID', 'Name', 'Date', 'Time In', 'Time Out'];
        sheet.addRow(headers);
        data.forEach(record => {
            sheet.addRow([
                record.id,
                record.name,
                new Date(record.date).toLocaleDateString(),
                record.time_in,
                record.time_out || ''
            ]);
        });
        this.styleSheet(sheet);
        const downloadPath = (0, path_1.join)(process.env.USERPROFILE || '', 'Downloads', 'AttendanceReport.xlsx');
        try {
            await workbook.xlsx.writeFile(downloadPath);
            return downloadPath;
        }
        catch (error) {
            throw new common_1.BadRequestException(`Error writing Excel file: ${error.message}`);
        }
    }
    styleSheet(sheet) {
        sheet.getColumn(1).width = 15;
        sheet.getColumn(2).width = 20;
        sheet.getColumn(3).width = 15;
        sheet.getColumn(4).width = 15;
        sheet.getColumn(5).width = 15;
        const headerRow = sheet.getRow(1);
        headerRow.height = 30;
        headerRow.font = { size: 12, bold: true, color: { argb: 'FFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '000000' }
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        sheet.eachRow((row) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });
    }
};
exports.ExcelExportService = ExcelExportService;
exports.ExcelExportService = ExcelExportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], ExcelExportService);
//# sourceMappingURL=excel-export.service.js.map