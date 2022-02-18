import { Component, Input, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable, timer, range } from 'rxjs'
import { take, map } from 'rxjs/operators'
import { Subscription } from 'rxjs/Rx';
@Component({
  selector: 'timer',
  styleUrls: ['./timer.component.scss'],
  template: `<span [style.color]="areTenSecsRemainings?'red':''" *ngIf="isShow && endDate!='Indefinite' && displayValue==false">
<img src="./assets/images/alarm.svg" width="22">
 <!-- <span class="badgenumber abtimes"  matTooltipClass="custom-tooltip"  matTooltipPosition="after" matTooltip="{{timerValue?.days|number :'2.0'}} days, {{timerValue?.hours|number :'2.0'}}:{{timerValue?.minutes|number :'2.0'}}:{{timerValue?.seconds.toFixed() |number :'2.0' }}" *ngIf="days > 7 && days<7">{{days}}</span>
 <span class="badgenumber abtimes singledigit"  matTooltipClass="custom-tooltip"  matTooltipPosition="after" matTooltip="{{timerValue?.days|number :'2.0'}} days, {{timerValue?.hours|number :'2.0'}}:{{timerValue?.minutes|number :'2.0'}}:{{timerValue?.seconds.toFixed() |number :'2.0' }}" *ngIf="days < 14">{{days}}</span> -->
</span>
 <span  *ngIf="endDate=='Indefinite' && displayValue==false">

<img src="./assets/images/alarminfinity.svg" width="22">
<span class="badgenumber" matTooltipClass="custom-tooltip"  matTooltipPosition="after"  matTooltip="{{timerValue?.days|number :'2.0'}} days, {{timerValue?.hours|number :'2.0'}}:{{timerValue?.minutes|number :'2.0'}}:{{timerValue?.seconds.toFixed() |number :'2.0' }}" *ngIf="days!=''"></span>
</span>
 <span  *ngIf="isShow && displayValue==true">
 
 <span class="d-flex align-items-center"  *ngIf="isShow && endDate!='Indefinite'">
<div class="relative">
 <img class="timerclock" src="./assets/images/alarm.svg" width="22">

 <!-- <span class="badgenumber abtimesday"   *ngIf="days > 7 && days<7">{{days}}</span>
 <span class="badgenumber abtimesday singledigit"  *ngIf="days <= 14">{{days}}</span> -->
</div>
 <span class="lightblue">{{timerValue?.days|number :'2.0'}} days, {{timerValue?.hours|number :'2.0'}}:{{timerValue?.minutes|number :'2.0'}}:{{timerValue?.seconds.toFixed() |number :'2.0' }}</span>
 </span>
 <span class="d-flex align-items-center" *ngIf="endDate=='Indefinite'">
<div class="relative">
 <img class="timerclock"  src="./assets/images/alarminfinity.svg" width="22">
 
</div>

 <span class="lightblue">{{timerValue?.days|number :'2.0'}} days, {{timerValue?.hours|number :'2.0'}}:{{timerValue?.minutes|number :'2.0'}}:{{timerValue?.seconds.toFixed() |number :'2.0' }}</span>

 </span>
  </span>
 `,

})
export class TimerComponent implements OnInit, OnDestroy {
  @Input() displayValue: any = false;
  @Input() endDate: any;
  @Input() days: string = "";
  @Input() id: string;
  @Input() startDate: any;
  @Output('onComplete') timerOver: EventEmitter<any> = new EventEmitter<any>();
  timerValue = {
    'days': 0,
    'hours': 0,
    'minutes': 0,
    'seconds': 0
  }
  areTenSecsRemainings: boolean = false;
  value;
  isShow: boolean;
  subscription: Subscription = new Subscription();
  constructor() { }

  ngOnInit() {
    if (this.endDate != 'Indefinite') {
      this.timer1();
    }
    if (this.endDate == 'Indefinite') {
      this.timerInfinite();

    }

  }


  timerInfinite() {
    let t1 = new Date();
    let t2 = new Date(this.startDate);
    this.isShow = true;
    let dif = t1.getTime() - t2.getTime();

    let Seconds_from_T1_to_T2 = dif / 1000;
    this.value = Math.abs(Seconds_from_T1_to_T2);
    this.timerValue = this.indefiniteFn(this.value);
    setInterval(() => {
      this.value++;
      this.timerValue = this.indefiniteFn(this.value);
    }, 1000)


  }

  indefiniteFn(val) {
    let seconds = val;
    // let remainingSecs = seconds;
    let days = Math.floor(seconds / (3600 * 24));
    seconds -= days * 3600 * 24;
    let hrs = Math.floor(seconds / 3600);
    seconds -= hrs * 3600;
    let mins = Math.floor(seconds / 60);
    seconds -= mins * 60;
    // if (remainingSecs < 60) this.areTenSecsRemainings = true
    let res = {
      'days': days,
      'hours': hrs,
      'minutes': mins,
      'seconds': seconds
    }

    return res;

  }

  timer1() {
    let t1 = new Date(this.endDate);
    let t2 = new Date();
    if (t1 > t2) {
      this.isShow = true;
    } else {
      this.isShow = false;
      this.timerOver.emit({ endTimer: this.id })
    }
    let dif = t1.getTime() - t2.getTime();

    let Seconds_from_T1_to_T2 = dif / 1000;
    this.value = Math.abs(Seconds_from_T1_to_T2);
    let source$: Observable<number> = range(0, this.value);

    source$ = timer(0, 1000).pipe(
      take(this.value),
      map(() => --this.value)
    );

    this.subscription.add(source$.subscribe(seconds => {


      let remainingSecs = seconds;
      let days = Math.floor(seconds / (3600 * 24));
      seconds -= days * 3600 * 24;
      let hrs = Math.floor(seconds / 3600);
      seconds -= hrs * 3600;
      let mins = Math.floor(seconds / 60);
      seconds -= mins * 60;
      if (remainingSecs < 60) this.areTenSecsRemainings = true
      let res = {
        'days': days,
        'hours': hrs,
        'minutes': mins,
        'seconds': seconds
      }
      if (days == 0 && hrs == 0 && mins == 0 && seconds < 1) {
        this.isShow = false;
        this.timerOver.emit({ endTimer: this.id })
      }
      this.timerValue = res;
    }, () => this.timerOver.emit('TIMER ERROR'), () => this.timerOver.emit('TIMER OVER'))
    )

  }

  ngOnDestroy() {

    this.subscription.unsubscribe();
  }

}
