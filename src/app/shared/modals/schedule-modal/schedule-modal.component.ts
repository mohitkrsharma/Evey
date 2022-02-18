import { Component, Inject, OnInit } from '@angular/core';
import { CommonService } from '../../services/common.service';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import * as moment from 'moment';
import * as medpass from './../../../shared/medpass/medpass.json';
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { RepeatDialogComponent } from '../repeatdialog/repeat-dialog.component';
import { CustomWeeklyComponent } from '../customweekly/customweekly.component';
import { CustomMonthlyComponent } from '../custommonthly/custommonthly.component';
import { CustomYearlyComponent } from '../customyearly/customyearly.component';
@Component({
  selector: 'app-schedule-modal',
  templateUrl: './schedule-modal.component.html',
  styleUrls: ['./schedule-modal.component.scss']
})
export class ScheduleModalComponent implements OnInit {

  public Medpass: any;
  medPassArr;
  medPassSelected = [];
  minDate = new Date();
  minDateEnd: Date;
  userLocalTimeZone = moment.tz.guess();
  rSearch = '';
  weekSearch = '';
  monthSearch = '';
  daySearch = '';
  weekList: any = [
    { key: 'Week', value: 1 }, { key: '2 Weeks', value: 2 }, { key: '3 Weeks', value: 3 }, { key: '4 Weeks', value: 4 }, { key: '5 Weeks', value: 5 }, { key: '6 Weeks', value: 6 }, { key: '7 Weeks', value: 7 },
    { key: '8 Weeks', value: 8 }, { key: '9 Weeks', value: 9 }, { key: '10 Weeks', value: 10 }, { key: '11 Weeks', value: 11 }, { key: '12 Weeks', value: 12 }, { key: '13 Weeks', value: 13 }, { key: '14 Weeks', value: 14 }, { key: '15 Weeks', value: 15 }, { key: '16 Weeks', value: 16 }, { key: '17 Weeks', value: 17 }, { key: '18 Weeks', value: 18 }, { key: '19 Weeks', value: 19 }, { key: '20 Weeks', value: 20 }, { key: '21 Weeks', value: 21 }, { key: '22 Weeks', value: 22 }, { key: '23 Weeks', value: 23 }, { key: '24 Weeks', value: 24 }, { key: '25 Weeks', value: 25 }, { key: '26 Weeks', value: 26 }, { key: '27 Weeks', value: 27 }, { key: '28 Weeks', value: 28 }, { key: '29 Weeks', value: 29 }, { key: '30 Weeks', value: 30 }, { key: '31 Weeks', value: 31 }, { key: '32 Weeks', value: 32 }
  ];
  customString:string = '';
  schedule = {
    _id: null,
    startDate: new Date(),
    endDate: null,
    startTime: null,
    endTime: null,
    repeat_tenure: 1,
    repeat: 'every_day',
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
    repeat_checkoption: 'on_day',
    month_date: null
  };
  freqlist:any[] = [];
  EarlyAM;
  AM;
  Noon;
  Evening;
  Bedtime;
  dialogRefs = null;
  selectedCareList = [];
  scheduleRepeat: any = {
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

  monthlyDialogData:any;
  repeatDialogData: any;

  repeatOptions: any = [
    { key: 'never', value: 'Never Repeat' },
    { key: 'every_day', value: 'Daily' },
    { key: 'every_week', value: 'Weekly' },
    { key: 'every_month', value: 'Monthly' },
    { key: 'every_year', value: 'Annually' },
    { key: 'custom_weekly', value: 'Custom Weekly' },
    { key: 'custom_monthly', value: 'Custom Monthly' },
    { key: 'custom_yearly', value: 'Custom Yearly' }
  ];

  weekDayList = [
    { value: 'Sun', isCheckd: true }, { value: 'Mon', isCheckd: true }, { value: 'Tues', isCheckd: true }, { value: 'Wed', isCheckd: true },
    { value: 'Thurs', isCheckd: true }, { value: 'Fri', isCheckd: true }, { value: 'Sat', isCheckd: true },
  ];

  customWeekDayList = [
    { value: 'Sun', isCheckd: true, name: 'sunday' }, { value: 'Mon', isCheckd: true, name: 'monday' }, { value: 'Tues', isCheckd: true, name: 'tuesday' }, { value: 'Wed', isCheckd: true, name: 'wednesday' }, { value: 'Thurs', isCheckd: true, name: 'thursday' }, { value: 'Fri', isCheckd: true, name: 'friday' }, { value: 'Sat', isCheckd: true, name: 'saturday' },
  ];

  monthList = [{ key: 'Month', value: 1 }, { key: '2 Months', value: 2 }, { key: '3 Months', value: 3 }, { key: '4 Months', value: 4 }, { key: '5 Months', value: 5 }, { key: '6 Months', value: 6 }, { key: '7 Months', value: 7 }, { key: '8 Months', value: 8 }, { key: '9 Months', value: 9 }, { key: '10 Months', value: 10 }, { key: '11 Months', value: 11 }, { key: '12 Months', value: 12 }];

  yearList = [{ key: 'Year', value: 1 }, { key: '2 Years', value: 2 }, { key: '3 Years', value: 3 }, { key: '4 Years', value: 4 }, { key: '5 Years', value: 5 }, { key: '6 Years', value: 6 }, { key: '7 Years', value: 7 }, { key: '8 Years', value: 8 }, { key: '9 Years', value: 9 }, { key: '10 Years', value: 10 }];

  monthNameList = [{ key: 'January', value: 1 }, { key: 'February', value: 2 }, { key: 'March', value: 3 }, { key: 'April', value: 4 }, { key: 'May', value: 5 }, { key: 'June', value: 6 }, { key: 'July', value: 7 }, { key: 'August', value: 8 }, { key: 'September', value: 9 }, { key: 'October', value: 10 }, { key: 'November', value: 11 }, { key: 'December', value: 12 }];

  customRepeat = [{ key: 'First', value: 'on_day' }, { key: 'Second', value: 'on_second_day' }, { key: 'Third', value: 'on_third_day' }, { key: 'Forth', value: 'on_forth_day' }, { key: 'Fifth', value: 'on_fifth_day' }, { key: 'Last', value: 'on_last_day' }];

  monthDayList = Array.from({ length: 31 }, (_, i) => i + 1).map(e => ({ name: `${e}${this.dateFormat2(e)}`, value: e }));

  scheduleDuration: any = [{
    startDate: new Date(),
    endDate: null,
  }];
  careString: string;

  constructor(public _commonService: CommonService,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public _dialogRef: MatDialogRef<ScheduleModalComponent>) { 
    this.minDate = new Date();
    this.minDateEnd = this.minDate;
  }

  ngOnInit() {
    const med: any = (JSON.stringify(medpass));
    this.medPassArr = JSON.parse(med).default;
    console.log(this.medPassArr);
    if(this.data){
      this.selectedCareList = this.data.selectedCareList;
      if(this.data.selectedFreq && this.data.selectedFreq.length){
        this.medPassArr = this.data.selectedFreq;
      }
    }
    console.log(this.selectedCareList, this.data);
  }

  frequencyClick(event) {
    const _foundFreq = this.medPassArr.find(m => m.name == event.target.value);
    if(_foundFreq){
      console.log(_foundFreq);
      _foundFreq.checked = event.target.checked;
    }

    console.log("FreqName--- value---",event.target.value, event.target.checked);
    let newDate1 = moment();
    let newDate2 = moment();
    if (event.target.value == '') {
      newDate1.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
      newDate2.set({ hour: 23, minute: 59, second: 59, millisecond: 999 });
    }
    if (event.target.value == 'Early AM' && event.target.checked) {
      newDate1.set({ hour: 4, minute: 0, second: 0, millisecond: 0 });
      newDate2.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
      console.log("Date 1, Date 2",newDate1, newDate2);
    }
    if (event.target.value == 'AM' && event.target.checked) {
      newDate1.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
      newDate2.set({ hour: 9, minute: 0, second: 0, millisecond: 0 });
    }
    if (event.target.value == 'Noon' && event.target.checked) {
      newDate1.add().set({ hour: 11, minute: 0, second: 0, millisecond: 0 });
      newDate2.set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
    }
    if (event.target.value == 'Evening' && event.target.checked) {
      newDate1.set({ hour: 16, minute: 0, second: 0, millisecond: 0 });
      newDate2.set({ hour: 19, minute: 0, second: 0, millisecond: 0 });
    }
    if (event.target.value == 'Bedtime' && event.target.checked) {
      newDate1.set({ hour: 20, minute: 0, second: 0, millisecond: 0 });
      newDate2.set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
    }
    // this.selectedCareList[0].time.push({ start_time: moment(newDate1).tz(this.userLocalTimeZone, true).format("HH:mm"), end_time: moment(newDate2).tz(this.userLocalTimeZone, true).format("HH:mm") });
    // console.log("Care time---", this.selectedCareList[0].time);
    let sIndex = this.medPassSelected.findIndex(x => { if(x.medPassNumber == event.target.value){return true}});
    if (sIndex > -1) {
      this.medPassSelected.splice(sIndex, 1);
    }else{
      this.medPassSelected.push({
        medPassNumber: event.target.value,
        startTime: moment(newDate1).tz(this.userLocalTimeZone, true).format(),
        endTime: moment(newDate2).tz(this.userLocalTimeZone, true).format()
      });
      console.log("Medpass Selected",this.medPassSelected);
    }
  }

  startDateChangeEvent(type: string, event: MatDatepickerInputEvent<Date>) {
    this.schedule.startDate = event.value;
    this.minDateEnd = event.value;
  }

  repeatChanged(ci) {
    console.log(ci)
    this.selectedCareList[ci].repeat_checkoption = this.selectedCareList[ci].repeat;
    this.scheduleRepeat.index = ci;
    this.minDate = new Date();
    if (this.selectedCareList[ci].repeat === 'custom'
      || this.selectedCareList[ci].repeat === 'never'
      || this.selectedCareList[ci].repeat === 'every_day'
      || this.selectedCareList[ci].repeat === 'every_week'
      || this.selectedCareList[ci].repeat === 'every_month'
      || this.selectedCareList[ci].repeat === 'every_year') {
      if (this.selectedCareList[ci].repeat === 'custom') {
        // this.selectedCareList[ci].repeat = 'every_day';
      } else {
        this.selectedCareList[ci].repeat = this.selectedCareList[ci].repeat;
      }
      
      const selectedCareList = JSON.parse(JSON.stringify(this.selectedCareList[ci]));
      this.scheduleRepeat.repeat = this.selectedCareList[ci].repeat;
      this.scheduleRepeat.index = ci;
      this.scheduleRepeat.startDate = this.selectedCareList[ci].startDate;
      this.scheduleRepeat.endDate = this.selectedCareList[ci].endDate;
     
      const repeatDays = { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true };
      this.scheduleRepeat.repeat_tenure = selectedCareList.repeat_tenure ? selectedCareList.repeat_tenure : 1;
      if (this.selectedCareList[ci].repeat === 'every_day') {
        this.scheduleRepeat.repeat_on = repeatDays;
      } else {
        this.scheduleRepeat.repeat_on = selectedCareList.repeat_on ? selectedCareList.repeat_on : repeatDays;
      }
      this.scheduleRepeat.repeat_option = selectedCareList.repeat_option ? selectedCareList.repeat_option : 'on_day';
    } else if (this.selectedCareList[ci].repeat === 'custom_weekly') {

      const repeatDays = { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true };
      const selectedCareList = JSON.parse(JSON.stringify(this.selectedCareList[ci]))

      this.scheduleRepeat.repeat = selectedCareList.repeat;
      this.scheduleRepeat.index = ci;
      this.scheduleRepeat.startDate = this.selectedCareList[ci].startDate;
      this.scheduleRepeat.endDate = this.selectedCareList[ci].endDate;
      this.scheduleRepeat.repeat_on = selectedCareList.repeat_on ? selectedCareList.repeat_on : repeatDays;
      this.scheduleRepeat.repeat_option = 'on_day';

    } else if (this.selectedCareList[ci].repeat === 'custom_monthly') {

      const repeatDays = { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true };
      const selectedCareList = JSON.parse(JSON.stringify(this.selectedCareList[ci]))

      this.scheduleRepeat.repeat = selectedCareList.repeat;
      this.scheduleRepeat.index = ci;
      this.scheduleRepeat.startDate = this.selectedCareList[ci].startDate;
      this.scheduleRepeat.endDate = this.selectedCareList[ci].endDate;

      this.selectedCareList[this.scheduleRepeat.index]['month_date'] = '';
    } else if (this.selectedCareList[ci].repeat === 'custom_yearly') {

      const repeatDays = { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true };
      const selectedCareList = this.selectedCareList[ci];
      this.scheduleRepeat.repeat = selectedCareList.repeat;
      this.scheduleRepeat.index = ci;
      this.scheduleRepeat.startDate = this.selectedCareList[ci].startDate;
      this.scheduleRepeat.endDate = this.selectedCareList[ci].endDate;
      this.selectedCareList[this.scheduleRepeat.index]['month_date'] = '';
    } else {
      this.selectedCareList[ci].startDate = this.selectedCareList[ci].startDate;//this.scheduleRepeat.startDate;
      this.selectedCareList[ci].endDate = this.selectedCareList[ci].endDate;//this.scheduleRepeat.endDate;
      this.selectedCareList[ci].repeat_tenure = 1;
      this.selectedCareList[ci].repeat = this.selectedCareList[ci].repeat;
      this.selectedCareList[ci].repeat_on = { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true };
      this.selectedCareList[ci].repeat_option = 'on_day';
    }

    this.scheduleDuration.startDate = this.scheduleRepeat.startDate;
    const End = this.scheduleDuration.endDate;
    if (End != null) {
      const checkSDate = moment(this.scheduleDuration.startDate).format('YYYY-MM-DD');
      const checkEDate = moment(End).format('YYYY-MM-DD');
      if (checkSDate > checkEDate) this.scheduleDuration.endDate = '';
    }
    this.selectedCareList[this.scheduleRepeat.index].startDate = this.scheduleRepeat.startDate;
    this.selectedCareList[this.scheduleRepeat.index].endDate = this.scheduleRepeat.endDate;
    this.selectedCareList[this.scheduleRepeat.index].repeat_tenure = this.scheduleRepeat.repeat_tenure;
    this.selectedCareList[this.scheduleRepeat.index].repeat = this.scheduleRepeat.repeat;
    this.selectedCareList[this.scheduleRepeat.index].repeat_old = this.scheduleRepeat.repeat;
    this.selectedCareList[this.scheduleRepeat.index].repeat_on = this.scheduleRepeat.repeat_on;
    this.selectedCareList[this.scheduleRepeat.index].repeat_option = this.scheduleRepeat.repeat_option;

    /* Set Repeat for Every Week */
    if (this.selectedCareList[ci].repeat === 'every_week') {
      let days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      let d = new Date(this.selectedCareList[this.scheduleRepeat.index].startDate);
      let dayName = days[d.getDay()];
      var key = dayName;
      var obj = {};
      obj[key] = true;
      this.selectedCareList[this.scheduleRepeat.index].repeat_on = obj;
    }
  }

  radioRepeatChange(event): void {
    this.scheduleRepeat.repeat_option = event.value;
    this.selectedCareList[this.scheduleRepeat.index].repeat_option = event.value;
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
    console.log("Weekly------", data);
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

  weekDayText(e) {
    const checkData = [];
    for (const [key, value] of Object.entries(this.scheduleRepeat.repeat_on)) {
      if (value) checkData.push((key.charAt(0).toUpperCase() + key.slice(1)));
    }
    return (checkData).toString().replace(/,/g, ', ');
  }

  getSchedulePerformingTimeString(schedule) {
    let scheduleRepeatTenure = schedule.repeat_tenure;
    let repeat = schedule.repeat;
    var finalString:string = '';

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
      finalString = repeatDay && repeatDay.length ? `Care will occur every ${scheduleRepeatTenure} ${scheduleRepeatTenure == 1 ? 'week' : 'weeks'} ${repeatDay.length > 0 ? 'on' : ''}
      ${repeatDay.length > 1 ? repeatDay.slice(0, repeatDay.length - 1).toString().replace(/,/g, ', ') : repeatDay.slice(0, repeatDay.length).toString()} ${repeatDay.length > 1 ? ' and ' : ''} ${repeatDay.length > 1 ? repeatDay[repeatDay.length - 1].charAt(0).toUpperCase() + repeatDay[repeatDay.length - 1].slice(1) : ''}.`: '';
      this.customString = finalString;
      return finalString
    } else if (repeat == 'custom_monthly') {
      if (schedule.month_date == '') return;
      finalString = `Care will occur every ${schedule.repeat_tenure > 1 ? schedule.repeat_tenure : ''} ${schedule.repeat_tenure == 1 ? 'month' : 'months'} on the ${schedule.month_date}${this.dateFormat2(schedule.month_date)}.`
      this.customString = finalString;
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
        });
      }
      finalString = `Care will occur every ${schedule.repeat_tenure > 1 ? schedule.repeat_tenure : ''} ${schedule.repeat_tenure == 1 ? 'year' : 'years'} in the month of ${month[0].key} on the ${repeat[0].key} of ${day[0].name ? day[0].name.charAt(0).toUpperCase() + day[0].name.slice(1) : day[1].name.charAt(0).toUpperCase() + day[1].name.slice(1)}`;
      this.customString = finalString;
      return finalString;
    }
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

  cancel(){
    this.selectedCareList[0].startDate = null;
    this.selectedCareList[0].endDate = null;
    this._dialogRef.close();
  }

  saveScheduleCare(){
    console.log(this.medPassArr);
    this.selectedCareList[0].time = [];
    this.medPassSelected.map(selectedItem=>{
      let item = JSON.stringify(selectedItem);
      this.selectedCareList[0].time.push(JSON.parse(item));
    });
    console.log("Selected Care list data---", this.selectedCareList);
    this._dialogRef.close({ selectedCareList: this.selectedCareList, customString: this.customString, selectedFreq: this.medPassArr });
  }

}
