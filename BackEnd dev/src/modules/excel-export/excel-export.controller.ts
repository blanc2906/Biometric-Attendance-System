import { Controller, Get, Res, Header } from '@nestjs/common';
import { Response } from 'express';
import { ExcelExportService } from './excel-export.service';

@Controller('excel-export')
export class ExcelExportController {
    constructor(private readonly excelExportService: ExcelExportService) {}

    @Get('/download')
    @Header('Content-Type', 'xlsx')
    async downloadReport(@Res() res: Response) {
        const result = await this.excelExportService.downloadExcel();
        res.download(`${result}`);
    }
}
