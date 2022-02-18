import { Injectable } from '@angular/core';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import * as Excel from 'exceljs/dist/exceljs.min.js';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

const EXCEL_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

const CSV_TYPE = 'text/plain;charset=UTF-8';
const CSV_EXTENSION = '.csv';
// tslint:disable-next-line:max-line-length
export const EVEY_FOOTER_LOGO = 'data:image/png;base64,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';

@Injectable()
export class ExcelService {
  constructor() { }

  public exportAsExcelFile(json: any[], excelFileName: string): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json);
    const workbook: XLSX.WorkBook = {
      Sheets: { data: worksheet },
      SheetNames: ['data']
    };
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });
    // const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    this.saveAsExcelFile(excelBuffer, excelFileName);
  }

  public exportAsExcelFileFromArray(json: any[], excelFileName: string): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json);
    const workbook: XLSX.WorkBook = {
      Sheets: { data: worksheet },
      SheetNames: ['data']
    };
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });
    // const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    this.saveAsExcelFile(excelBuffer, excelFileName);
  }

  public exportAsCsvFile(json: any[], csvFileName: string): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json);
    // const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    // const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    // const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    const csv = XLSX.utils.sheet_to_csv(worksheet, { FS: ';' });
    this.saveAsCsvFile(csv, csvFileName);
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], {
      type: EXCEL_TYPE
    });
    FileSaver.saveAs(
      data,
      fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION
    );
  }

  private saveAsCsvFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], {
      type: CSV_TYPE
    });
    FileSaver.saveAs(
      data,
      fileName + '_export_' + new Date().getTime() + CSV_EXTENSION
    );
  }

  public exportAsPdfFile(json: any[], excelFileName: string): void {
    const arr: any = [];
    json.forEach(val => {
      const arr_response = Object.values(val);
      const new_array = new Array(8).fill('');
      for (let i = 0; i < 8; i++) {
        if (!arr_response[i]) {
          new_array[i] = '';
        } else {
          new_array[i] = arr_response[i];
        }
      }

      arr.push(new_array);
    });
    const PDF = {
      pageSize: 'A2',
      pageOrientation: 'landscape',
      content: [
        {
          layout: 'noBorders',
          table: {
            headerRows: 1,
            widths: [
              'auto',
              'auto',
              'auto',
              'auto',
              'auto',
              'auto',
              'auto',
              'auto'
            ],
            body: arr.splice(0, 4)
          }
        },
        {
          table: {
            headerRows: 1,
            widths: [
              'auto',
              'auto',
              'auto',
              'auto',
              'auto',
              'auto',
              'auto',
              'auto'
            ],
            body: arr
          }
        }
      ]
    };
    this.generatePDF(PDF, excelFileName);

  }

  generatePDF(PDF, FileName) {
    pdfMake.createPdf(PDF).download(FileName);
  }

  public generateExcelForVitalHistory(vitalObj: any, imageUrl: string) {
    const title = vitalObj.CareName + ' Report';
    const header = vitalObj.CareName == 'Blood Pressure' ? ['Date', 'Systolic', 'Diastolic'] : ['Date', vitalObj.CareName];
    const data: any[] = vitalObj.vitalArr;

    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet('Vital Data');
    const titleRow = worksheet.addRow([title]);
    worksheet.mergeCells('A1:C1');
    titleRow.font = { name: 'SFProDisplay-Bold', family: 4, size: 16, bold: true };
    worksheet.addRow([]);
    worksheet.addRow(['Resident Name', vitalObj.ResidentName]);
    worksheet.addRow([]);
    worksheet.addRow(['Date Range', vitalObj.DateRange]);
    worksheet.addRow([]);
    const headerRow = worksheet.addRow(header);
    headerRow.eachCell((cell, number) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { rgb: '186, 188, 189' },
        bgColor: { rgb: '186, 188, 189' }
      },
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    })
    let logo = workbook.addImage({
      base64: imageUrl,
      extension: 'jpeg' || 'png'
    })
    worksheet.addImage(logo, 'K5:V25', { editAs: 'absolute' });
    worksheet.addRows(data);
    worksheet.mergeCells('K5:V25');

    workbook.xlsx.writeBuffer().then((data) => {
      const blob = new Blob([data], { type: EXCEL_TYPE });
      FileSaver.saveAs(blob, vitalObj.CareName + '-History-Report.xlsx');
    });
  }
}
