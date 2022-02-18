import { AfterViewInit, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MatPaginator, MatSort, MatTableDataSource, MAT_DIALOG_DATA } from '@angular/material';


@Component({
  selector: 'app-display-graph-data',
  templateUrl: './display-graph-data.component.html',
  styleUrls: ['./display-graph-data.component.scss']
})
export class DisplayGraphDataComponent implements OnInit, AfterViewInit {
  dataSource: MatTableDataSource<any>;
  rawData: any[] = [];
  displayedColumns: string[] = ['date', 'input'];
  BPColumns: string[] = ['date', 'systolic', 'diastolic'];
  spanMsg: string = '';
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  constructor(
    public dialogRef: MatDialogRef<DisplayGraphDataComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit() {
    if (this.data.vital === 'Blood Pressure') {
      for (let i = 0; i < this.data.labels.length; i++) {
        this.rawData.push({
          date: this.data.labels[i],
          systolic: this.data.dataset[0]['data'][i],
          diastolic: this.data.dataset[1]['data'][i]
        })
      }
    } else {
      for (let i = 0; i < this.data.labels.length; i++) {
        this.rawData.push({
          date: this.data.labels[i],
          input: this.data.dataset[0]['data'][i],
        })
      }
    }
    this.dataSource = new MatTableDataSource(this.rawData);
    switch (this.data.vital) {
      case 'Pulse':
        this.spanMsg = 'bpm';
        break;
      case 'Respirations':
        this.spanMsg = 'bpm';
        break;
      case 'Oxygen':
        this.spanMsg = 'mm Hg';
        break;
      case 'Weight':
        this.spanMsg = 'lbs';
        break;
      case 'Blood Sugar':
        this.spanMsg = 'mg/dL';
        break;
      case 'Temperature':
        this.spanMsg = '°';
        break;
      case 'Blood Pressure':
        this.spanMsg = 'mm Hg';
        break;
      default:
        this.spanMsg = '';
        break;
    }
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  onClose() {
    this.dialogRef.close();
  }

  onExportAsPDF() {
    let obj = {
      exportValue: 'PDF'
    };
    this.dialogRef.close(obj);
  }

  onExportAsExcel() {
    let obj = {
      exportValue: 'Excel'
    };
    this.dialogRef.close(obj);
  }
}
