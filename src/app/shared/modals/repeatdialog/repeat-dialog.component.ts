import { Component,Input, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiService } from '../../services/api/api.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-repeat-dialog',
  templateUrl: './repeat-dialog.component.html',
  styleUrls: ['./repeat-dialog.component.scss']
})
export class RepeatDialogComponent implements OnInit {
   successBtn:string='Yes';
   cancelBtn:string='No';
   title:string='Are you sure?';
   selectedCareList:any[] = [];
   customWeekDayList = [
    { value: 'Sun', isCheckd: true, name: 'sunday' }, { value: 'Mon', isCheckd: true, name: 'monday' }, { value: 'Tues', isCheckd: true, name: 'tuesday' }, { value: 'Wed', isCheckd: true, name: 'wednesday' }, { value: 'Thurs', isCheckd: true, name: 'thursday' }, { value: 'Fri', isCheckd: true, name: 'friday' }, { value: 'Sat', isCheckd: true, name: 'saturday' },
   ];
   repeatOptions: any = [
    { key: 'never', value: 'Never Repeat' },
    { key: 'every_day', value: 'Daily' },
    { key: 'every_week', value: 'Weekly' },
    { key: 'every_month', value: 'Monthly' },
    { key: 'every_year', value: 'Annually' },
    // { key: 'custom', value : 'Custom'},
    { key: 'custom_weekly', value: 'Custom Weekly' },
    { key: 'custom_monthly', value: 'Custom Monthly' },
    { key: 'custom_yearly', value: 'Custom Yearly' }
  ];
  scheduleDuration: any = [{
    startDate: new Date(),
    endDate: null,
  }];
  public scheduleRepeat: any = {
    index: null,
    startDate: null,
    // startDate : new Date(),
    endDate: null,
    repeat_tenure: 1,
    repeat: 'every_day',
    repeat_old: null,
    repeat_on: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true
    },
    repeat_option: 'on_day',
    repeat_checkoption: 'on_day'
  };
  constructor(private _apiService: ApiService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public _dialogRef: MatDialogRef<RepeatDialogComponent>,
    public toastr: ToastrService
  ) { }

  ngOnInit() {
    this.selectedCareList = this.data.selectedCareList;
    this.scheduleRepeat = this.data.scheduleRepeat;
    this.customWeekDayList = this.data.customWeekDayList;
    console.log("Data",this.data.selectedCareList);
  }
  onNoClick(): void {
    // this._dialogRef.close(['result']['status'] = false);
    this._dialogRef.close();
  }

  getRepeatValue(repeat_val) {
    if (repeat_val !== null) {
      const repeatVal = this.repeatOptions.filter(entry => entry.key === repeat_val)[0];
      return repeatVal.value;
    } else {
      return false;
    }
  }

  weekDayTextInForm(data) {
    const checkData = [];
    for (const [key, value] of Object.entries(data)) {
      if (value) checkData.push((key.charAt(0).toUpperCase() + key.slice(1)));
    }
    let str = (checkData).toString();
    if (checkData.length > 1) {
      str = str.replace(checkData[checkData.length - 2] + ',', checkData[checkData.length - 2] + ' and ');
    }
    return str.replace(/,/g, ', ');
  }

  dateFormat2(d) {
    if (d > 3 && d < 21) return 'th';
    switch (d % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  }

  dayNamesShort(date) {
    var days = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'];
    var d = new Date(date);
    return days[d.getDay()];
  }

  closeRepeatDialog(): void {
    this._dialogRef.close();

    this.selectedCareList[this.scheduleRepeat.index].repeat = this.selectedCareList[this.scheduleRepeat.index].repeat_old;
    this.selectedCareList[this.scheduleRepeat.index].repeat = null;
    this.scheduleRepeat = {
      index: this.scheduleRepeat.index,
      startDate: this.scheduleDuration.startDate,
      endDate: this.scheduleDuration.endDate,
      repeat_tenure: 1,
      repeat: 'every_day',
      repeat_old: null,
      repeat_on: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: true
      },
      repeat_option: 'on_day',
      repeat_checkoption: 'on_day'
    };
  }

  radioRepeatChange(event): void {
    this.scheduleRepeat.repeat_option = event.value;
    this.selectedCareList[this.scheduleRepeat.index].repeat_option = event.value;
  }

  saveRepeatDialog(schedule = null): void {
    if (schedule != null) {
      if (schedule.repeat == 'custom_weekly') {
        if (Object.values(schedule.repeat_on).filter(e => e).length == 0) {
          this.toastr.error('Please select day of week')
        } else {
          schedule.repeat_option = 'on_day';
          this._dialogRef.close();
        }
      } else if (schedule.repeat == 'custom_monthly') {
        if (schedule.month_date == '') {
          this.toastr.error('Please select month day')
        } else {
          let date = new Date();
          let todayDate = date.getDate();
          date.setDate(schedule.month_date);
          if (todayDate > date.getDate()) {
            date.setMonth(date.getMonth() + 1);
          }
          schedule.start_date = date.getTime();
          schedule.repeat_option = 'on_day';
          // schedule.repeat_tenure -= 1;
          this._dialogRef.close();
        }
      } else if (schedule.repeat == "custom_yearly") {
        if (schedule.month_date == '' || !schedule.repeat_option || !schedule.repeat_tenure || !schedule.repeat_on) {
          this.toastr.error('Please fill all details.')
        } else {
          schedule.repeat_on[schedule.repeat_on.name] = true;
          delete schedule.repeat_on.value;
          delete schedule.repeat_on.name;
          delete schedule.repeat_on.isCheckd;
          this._dialogRef.close();
          this.customWeekDayList = [
            { value: 'Sun', isCheckd: true, name: 'sunday' }, { value: 'Mon', isCheckd: true, name: 'monday' }, { value: 'Tues', isCheckd: true, name: 'tuesday' }, { value: 'Wed', isCheckd: true, name: 'wednesday' }, { value: 'Thurs', isCheckd: true, name: 'thursday' }, { value: 'Fri', isCheckd: true, name: 'friday' }, { value: 'Sat', isCheckd: true, name: 'saturday' },
          ];
        }
      }
      // }
    } else {
      this._dialogRef.close({ selectedCareList: this.selectedCareList,scheduleRepeat: this.scheduleRepeat,customWeekDayList: this.customWeekDayList });
    }
  }
}


