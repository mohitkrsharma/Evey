import { Component,Input, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiService } from '../../services/api/api.service';
import { ToastrService } from 'ngx-toastr';
import * as moment from 'moment';

@Component({
  selector: 'app-custom-yearly',
  templateUrl: './customyearly.component.html',
  styleUrls: ['./customyearly.component.scss']
})
export class CustomYearlyComponent implements OnInit {
   successBtn:string='Yes';
   cancelBtn:string='No';
   title:string='Are you sure?';
   selectedCareList:any[] = [];
   weekSearch = '';
   yearSearch = '';
   monthNameSearch = '';
   customrepeatSearch = '';
   yearList = [{ key: 'Year', value: 1 }, { key: '2 Years', value: 2 }, { key: '3 Years', value: 3 }, { key: '4 Years', value: 4 }, { key: '5 Years', value: 5 }, { key: '6 Years', value: 6 }, { key: '7 Years', value: 7 }, { key: '8 Years', value: 8 }, { key: '9 Years', value: 9 }, { key: '10 Years', value: 10 }];
   customRepeat = [{ key: 'First', value: 'on_day' }, { key: 'Second', value: 'on_second_day' }, { key: 'Third', value: 'on_third_day' }, { key: 'Forth', value: 'on_forth_day' }, { key: 'Fifth', value: 'on_fifth_day' }, { key: 'Last', value: 'on_last_day' }];
   customWeekDayList = [
      { value: 'Sun', isCheckd: true, name: 'sunday' }, { value: 'Mon', isCheckd: true, name: 'monday' }, { value: 'Tues', isCheckd: true, name: 'tuesday' }, { value: 'Wed', isCheckd: true, name: 'wednesday' }, { value: 'Thurs', isCheckd: true, name: 'thursday' }, { value: 'Fri', isCheckd: true, name: 'friday' }, { value: 'Sat', isCheckd: true, name: 'saturday' },
   ];
   weekList: any = [
    { key: 'Week', value: 1 }, { key: '2 Weeks', value: 2 }, { key: '3 Weeks', value: 3 }, { key: '4 Weeks', value: 4 }, { key: '5 Weeks', value: 5 }, { key: '6 Weeks', value: 6 }, { key: '7 Weeks', value: 7 },
    { key: '8 Weeks', value: 8 }, { key: '9 Weeks', value: 9 }, { key: '10 Weeks', value: 10 }, { key: '11 Weeks', value: 11 }, { key: '12 Weeks', value: 12 }, { key: '13 Weeks', value: 13 }, { key: '14 Weeks', value: 14 }, { key: '15 Weeks', value: 15 }, { key: '16 Weeks', value: 16 }, { key: '17 Weeks', value: 17 }, { key: '18 Weeks', value: 18 }, { key: '19 Weeks', value: 19 }, { key: '20 Weeks', value: 20 }, { key: '21 Weeks', value: 21 }, { key: '22 Weeks', value: 22 }, { key: '23 Weeks', value: 23 }, { key: '24 Weeks', value: 24 }, { key: '25 Weeks', value: 25 }, { key: '26 Weeks', value: 26 }, { key: '27 Weeks', value: 27 }, { key: '28 Weeks', value: 28 }, { key: '29 Weeks', value: 29 }, { key: '30 Weeks', value: 30 }, { key: '31 Weeks', value: 31 }, { key: '32 Weeks', value: 32 }
  ]
   monthNameList = [{ key: 'January', value: 1 }, { key: 'February', value: 2 }, { key: 'March', value: 3 }, { key: 'April', value: 4 }, { key: 'May', value: 5 }, { key: 'June', value: 6 }, { key: 'July', value: 7 }, { key: 'August', value: 8 }, { key: 'September', value: 9 }, { key: 'October', value: 10 }, { key: 'November', value: 11 }, { key: 'December', value: 12 }];
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
    public _dialogRef: MatDialogRef<CustomYearlyComponent>,
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

  checkWeekNumbers(data) {
    let yearNow = parseInt(moment().format("YYYY"));
    let firstOfMonth = new Date(yearNow, data - 1, 1);
    let lastOfMonth = new Date(yearNow, data, 0);
    let used = firstOfMonth.getDay() + lastOfMonth.getDate();
    let weekNum = Math.ceil(used / 7) - 1;
    if (weekNum < 5) {
      this.customRepeat.splice(4, 1);
    } else {
      if (this.customRepeat[4].value != 'fifth_day') this.customRepeat.splice(4, 0, { key: 'Fifth', value: 'fifth_day' });
    }
  }

  getSchedulePerformingTimeString(schedule) {
    let scheduleRepeatTenure = schedule.repeat_tenure;
    let repeat = schedule.repeat

    if (repeat == 'custom_weekly') {
      let repeatDay = Object.entries(schedule.repeat_on).filter((e, i) => e).filter(e => e[1]).map(e => e[0])
      if(repeatDay && repeatDay.length) {
        let capitalRepeatDay = [];
        repeatDay.filter(item => {
          item = item.charAt(0).toUpperCase() + item.slice(1);
          capitalRepeatDay.push(item)
        })
        repeatDay = [];
        repeatDay = capitalRepeatDay;
      }
      let finalString = repeatDay && repeatDay.length ? `Care will occur every ${scheduleRepeatTenure} ${scheduleRepeatTenure == 1 ? 'week' : 'weeks'} ${repeatDay.length > 0 ? 'on' : ''}
      ${repeatDay.length > 1 ? repeatDay.slice(0, repeatDay.length - 1).toString().replace(/,/g, ', ') : repeatDay.slice(0, repeatDay.length).toString()} ${repeatDay.length > 1 ? ' and ' : ''} ${repeatDay.length > 1 ? repeatDay[repeatDay.length - 1].charAt(0).toUpperCase() + repeatDay[repeatDay.length - 1].slice(1) : ''}.`: '';
      return finalString
    } else if (repeat == 'custom_monthly') {
      if (schedule.month_date == '') return;
      let finalString = `Care will occur every ${schedule.repeat_tenure > 1 ? schedule.repeat_tenure : ''} ${schedule.repeat_tenure == 1 ? 'month' : 'months'} on the ${schedule.month_date}${this.dateFormat2(schedule.month_date)}.`
      return finalString;
    } else if (repeat == 'custom_yearly') {
      if (schedule.month_date == '' || !schedule.repeat_option || !schedule.repeat_tenure || !schedule.repeat_on) return;
      let repeat = this.customRepeat.filter(e => e.value == schedule.repeat_option);
      let month = this.monthNameList.filter(e => e.value == schedule.month_date);
      let day = this.customWeekDayList.filter(e => e.value == schedule.repeat_on.value);
      if (schedule.repeat_on) {
        day.push({
          'name': Object.keys(schedule.repeat_on)[0],
          'value': Object.keys(schedule.repeat_on)[0],
          'isCheckd': true
        })
      }
      let finalString = `Care will occur every ${schedule.repeat_tenure > 1 ? schedule.repeat_tenure : ''} ${schedule.repeat_tenure == 1 ? 'year' : 'years'} in the month of ${month[0].key} on the ${repeat[0].key} of ${day[0].name ? day[0].name.charAt(0).toUpperCase() + day[0].name.slice(1) : day[1].name.charAt(0).toUpperCase() + day[1].name.slice(1)}`
      return finalString;
    }
  }

  weekDayChanged(e) {
    let checkData = true;
    for (const [key, value] of Object.entries(this.scheduleRepeat.repeat_on)) {
      if (!value) {
        checkData = false;
        break;
      }
    }
    if (!checkData) {
      this.scheduleRepeat.repeat = 'every_week';
    } else {
      this.scheduleRepeat.repeat = 'every_day';
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
          this._dialogRef.close({ selectedCareList: this.selectedCareList,scheduleRepeat: this.scheduleRepeat,customWeekDayList: this.customWeekDayList });
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
          this._dialogRef.close({ selectedCareList: this.selectedCareList,scheduleRepeat: this.scheduleRepeat,customWeekDayList: this.customWeekDayList });
        }
      } else if (schedule.repeat == "custom_yearly") {
        if (schedule.month_date == '' || !schedule.repeat_option || !schedule.repeat_tenure || !schedule.repeat_on) {
          this.toastr.error('Please fill all details.')
        } else {
          schedule.repeat_on[schedule.repeat_on.name] = true;
          delete schedule.repeat_on.value;
          delete schedule.repeat_on.name;
          delete schedule.repeat_on.isCheckd;
          this._dialogRef.close({ selectedCareList: this.selectedCareList,scheduleRepeat: this.scheduleRepeat,customWeekDayList: this.data.customWeekDayList });
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


