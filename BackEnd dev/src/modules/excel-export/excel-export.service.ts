import { BadRequestException, NotFoundException, Injectable } from '@nestjs/common';
import { Workbook, Worksheet } from 'exceljs';
import { join } from 'path';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class ExcelExportService {
    constructor(private readonly userService: UsersService) {}
    
    async downloadExcel(): Promise<string> {
        const data = await this.userService.populateData();
        if (!data || data.length === 0) {
            throw new NotFoundException("No data available");
        }

        const workbook = new Workbook();
        const sheet = workbook.addWorksheet('Attendance Report');

        // Add headers
        const headers = ['ID', 'Name', 'Date', 'Time In', 'Time Out'];
        sheet.addRow(headers);

        // Add data rows
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

        const downloadPath = join(process.env.USERPROFILE || '', 'Downloads', 'AttendanceReport.xlsx');

        try {
            await workbook.xlsx.writeFile(downloadPath);
            return downloadPath;
        } catch (error) {
            throw new BadRequestException(`Error writing Excel file: ${error.message}`);
        }
    }

    private styleSheet(sheet: Worksheet): void {
        // Set column widths
        sheet.getColumn(1).width = 15;  // ID
        sheet.getColumn(2).width = 20;  // Name
        sheet.getColumn(3).width = 15;  // Date
        sheet.getColumn(4).width = 15;  // Time In
        sheet.getColumn(5).width = 15;  // Time Out

        // Style header row
        const headerRow = sheet.getRow(1);
        headerRow.height = 30;
        headerRow.font = { size: 12, bold: true, color: { argb: 'FFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '000000' }
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

        // Add borders
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
}