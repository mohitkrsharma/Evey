import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup, NgForm, FormControl } from '@angular/forms';
import { MatSelect } from '@angular/material';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from 'src/app/shared/services/api/api.service';
import { CommonService } from 'src/app/shared/services/common.service';
import * as moment from 'moment-timezone';
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent implements OnInit, OnDestroy {
  goalsForm: FormGroup;
  budgetVal: any;
  totalUnit: any;
  occupancy_percetage: any = 0;
  occupancy_goal: any;
  carelevelData: any[] = [];
  goals: any[] = [];
  careSearch: string = '';
  selectedCareLevel: string = '';
  @ViewChild('goalSelect', { static: true }) goalSelect: MatSelect
  subscription: Subscription = new Subscription();
  facilityId: string = '';
  organizationId: string = '';
  timeZone: any;
  goalId: string;
  editMode: boolean = false;

  selectedTimeCareLevel: string = '';
  timegoals: any[] = [];
  @ViewChild('timegoalSelect', { static: true }) timegoalSelect: MatSelect
  timegoalsForm: FormGroup;
  timecareSearch: string = '';
  selectedIndexVal = new FormControl(0);
  shift1_timegoal: number;
  shift2_timegoal: number;
  shift3_timegoal: number;
  timegoalId: string;
  timegoalsdata: any;
  constructor(
    private apiService: ApiService,
    public _commonService: CommonService,
    private router: Router,
    private _toastr: ToastrService
  ) { }

  async ngOnInit() {
    this._commonService.setLoader(true);
    this.subscription = this._commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        this.facilityId = contentVal.fac;
        this.organizationId = contentVal.org;
        this.timeZone = contentVal.timezone;
        await this.loadGoalData();
        await this.loadFacilityUnit();
      }
      await this.loadCarelevel();
    });
    this._commonService.setLoader(false);
  }

  async loadCarelevel() {
    const action = { type: 'GET', target: 'residents/carelevellist' };
    const payload = { date: new Date(), type: ["1", "3"] };
    const result = await this.apiService.apiFn(action, payload);
    this.carelevelData = result['data'];
  }

  async loadGoalData() {
    const action = { type: 'GET', target: 'goals/goal' };
    const payload = { facilityId: this.facilityId };
    const result = await this.apiService.apiFn(action, payload);
    if (result['data'].length > 0) {
      let goalData = result['data'][0];
      this.budgetVal = goalData.budget_value;
      this.goals = goalData.goals;
      this.occupancy_goal = goalData.occupancy_goal;
      this.goalId = goalData._id;
      this.goalId ? this.editMode = true : this.editMode = false;
    } else {
      this.budgetVal = 0;
      this.goals = [];
      this.occupancy_goal = 0;
      this.goalId = undefined;
      this.editMode = false;
    }
  }

  async loadTimeGoalData() {
    this._commonService.setLoader(true);
    const action = { type: 'GET', target: 'goals/timegoal' };
    const payload = { facilityId: this.facilityId };
    const result = await this.apiService.apiFn(action, payload);
    if (result['data'].length > 0) {
      const timegoalData = result['data'][0];
      this.timegoalsdata = timegoalData;
      this.timegoals = timegoalData.timegoals;
      this.shift1_timegoal = timegoalData.shift1_goal;
      this.shift2_timegoal = timegoalData.shift2_goal;
      this.shift3_timegoal = timegoalData.shift3_goal;
      this.timegoalId = timegoalData._id;
      this.timegoalId ? this.editMode = true : this.editMode = false;
    } else {
      this.timegoals = [];
      this.timegoalId = undefined;
      this.shift1_timegoal = null;
      this.shift2_timegoal = null;
      this.shift3_timegoal = null;
      this.editMode = false;
    }
    this._commonService.setLoader(false);
  }

  async loadFacilityUnit() {
    let date = moment(new Date().valueOf()).tz(this.timeZone, true);
    const action = { type: 'POST', target: 'reports/census' };
    const payload = {
      tilldate: date.set({ hour: 0, minute: 0, second: 0 }),
      fac: this.facilityId,
      org: this.organizationId
    };
    const result = await this.apiService.apiFn(action, payload);
    this.totalUnit = result['data'].totalUnit;
    this.onGoalInputChange();
  }
  onChangeCareLevel(selectedLevel) {
    const level = this.carelevelData.find(care => care._id === selectedLevel);
    const goalId = this.goals.findIndex(goal => goal.care_level_id === selectedLevel);
    if (goalId === -1) {
      this.goals.push({ care_level_id: selectedLevel, name: level.label, value: "" });
      this.goalSelect.value = '';
    }
  }

  onRemove(index) {
    this.goals.splice(index, 1);
  }

  async onSubmit() {    
    if (this.selectedIndexVal.value === 0) {
      if (this.goals.length > 0) {
        let flag = this.goals.findIndex(el => el.value === "");
        if (flag !== -1) {
          this._toastr.error('please enter value in required fields');
          return;
        }
      }
      if (this.occupancy_goal && this.budgetVal && this.goals.length > 0) {
        this._commonService.setLoader(true);
        let goalData = {
          facility: { org: this.organizationId, fac: this.facilityId },
          budget_value: this.budgetVal,
          occupancy_goal: this.occupancy_goal,
          occupancy_percentage: this.occupancy_percetage,
          goals: this.goals,
          total_units: this.totalUnit,
          _id: this.goalId
        }
        const action = { type: 'POST', target: 'goals/add' };
        const payload = goalData;
        const result = await this.apiService.apiFn(action, payload);
        result['status'] ? this._toastr.success(result['message']) : this._toastr.error(result['message']);
        this._commonService.setLoader(false);
      } else {
        this._toastr.error('please enter value in required fields');
      }
    }
    else if (this.selectedIndexVal.value === 1) {
      if (this.timegoals.length > 0 && this.shift1_timegoal && this.shift2_timegoal && this.shift3_timegoal) {
        let tflag = this.timegoals.findIndex(el => el.value === "");
        if (tflag !== -1) {
          this._toastr.error('please enter value in required fields');
          return;
        }
        else {
          this._commonService.setLoader(true);
          let goalData = {
            facility: { org: this.organizationId, fac: this.facilityId },
            timegoals: this.timegoals,
            shift1_goal: this.shift1_timegoal,
            shift2_goal: this.shift2_timegoal,
            shift3_goal: this.shift3_timegoal,
            _id: this.goalId
          }
          const action = { type: 'POST', target: 'goals/addtimegoal' };
          const payload = goalData;
          const result = await this.apiService.apiFn(action, payload);
          result['status'] ? this._toastr.success(result['message']) : this._toastr.error(result['message']);
          this._commonService.setLoader(false)
        }
      } else {
        this._toastr.error('please enter value in required fields');
      }
    }

  }

  onGoalInputChange() {
    this.occupancy_percetage = (this.occupancy_goal * 100) / this.totalUnit;
    this.occupancy_percetage = this.occupancy_percetage.toFixed(0);
  }

  onCancel() {
    this.router.navigate(['./dashboard']);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }


  // Start time goal section
  onChangeTimeCareLevel(selectedLevel) {
    const level = this.carelevelData.find(care => care._id === selectedLevel);
    const tgoalId = this.timegoals.findIndex(tgoal => tgoal.care_level_id === selectedLevel);
    if (tgoalId === -1) {
      this.timegoals.push({ care_level_id: selectedLevel, name: level.label, value: "" });
      this.timegoalSelect.value = '';
    }
  }

  ontimeRemove(index) {
    this.timegoals.splice(index, 1);
  }
  Ongoaltabchange(event) {
    // debugger
    this.selectedIndexVal.setValue(event)
    if (this.selectedIndexVal.value == 1 && !this.timegoalsdata) {
      this.loadTimeGoalData();
    }
  }
  // end time goal section
}
