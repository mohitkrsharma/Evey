/* Importing all the Modules,component,services we need */
import { Injectable } from "@angular/core";
import "rxjs/add/operator/toPromise";
import * as moment from "moment-timezone";
import { BehaviorSubject } from "rxjs";
import { Store } from "@ngrx/store";
import { Aes256Service } from "./aes-256/aes-256.service";
interface PrivilegeRepState {
  _authPrivileges: object;
}

@Injectable()
export class CommonService {
  helperArr = []; /* testing code */
  topPosToStartShowing = 100;
  isShow: boolean;

  public content: BehaviorSubject<string> = new BehaviorSubject<string>("");
  contentdata = this.content.asObservable();

  public residentContent: BehaviorSubject<string> = new BehaviorSubject<string>(
    ""
  );
  residentcontentdata = this.residentContent.asObservable();

  public floorcontent: BehaviorSubject<string> = new BehaviorSubject<string>(
    ""
  );
  floorcontentdata = this.floorcontent.asObservable();

  public loadercontent: BehaviorSubject<string> = new BehaviorSubject<string>(
    ""
  );
  loadercontentdata = this.loadercontent.asObservable();

  public moreoptioncontent: BehaviorSubject<string> =
    new BehaviorSubject<string>(null);
  moreoptioncontentdata = this.moreoptioncontent.asObservable();

  public lastcrumbcontent: BehaviorSubject<string> =
    new BehaviorSubject<string>(null);
  lastcrumbcontentdata = this.lastcrumbcontent.asObservable();

  public medQueryContent: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  medQueryData = this.medQueryContent.asObservable();

  public dnrQueryContent: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  dnrQueryData = this.dnrQueryContent.asObservable();

  public facilitycontent: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  facilityData = this.facilitycontent.asObservable();

  public sidebarPanelContent: BehaviorSubject<any> = new BehaviorSubject<any>(
    null
  );
  sidebarPanel = this.sidebarPanelContent.asObservable();

  public unlinkOrderCountcontent: BehaviorSubject<any> =
    new BehaviorSubject<any>(null);
  unlinkOrderCountdata = this.unlinkOrderCountcontent.asObservable();

  privileges = {
    web: false,
    web_rule: {},
  };
  userPrivilege: any;
  constructor(
    private _authPrivileges: Store<PrivilegeRepState>,
    private _aes256Service: Aes256Service
  ) {
    this._authPrivileges.select("privilegeRepState").subscribe((sub: any) => {
      if (sub.hasOwnProperty("privileges")) {
        this.privileges = this._aes256Service.decFn(sub.privileges);
      }
    });
  }

  createTime(ms) {
    // var milliseconds:any = parseInt((ms % 1000) / 100),
    let seconds = Math.floor((ms / 1000) % 60);
    let minutes = Math.floor((ms / (1000 * 60)) % 60);
    let hours = Math.floor((ms / (1000 * 60 * 60)) % 100000000);

    // return hours + ":" + minutes + ":" + seconds + "." + ;
    let returnTime = "";
    if (hours > 0) {
      if (minutes > 0) {
        returnTime = `${hours} h ${minutes} min`;
      } else {
        returnTime = `${hours} h`;
      }
    } else if (minutes > 0) {
      if (seconds > 0) {
        returnTime = `${minutes + 1} min`;
      } else {
        returnTime = `${minutes} min`;
      }
    } else {
      if (seconds > 10) {
        returnTime = `${minutes + 1} min`;
      }
    }
    return returnTime;
    // if(moment.duration(ms).hours()>0){

    //     return moment.duration(ms).minutes()>0?`${moment.duration(ms).hours()} hrs ${moment.duration(ms).minutes()} min`
    //     :`${moment.duration(ms).hours()} hrs`

    // }
    // else if(moment.duration(ms).hours()==0 && moment.duration(ms).minutes()>0){

    //    return moment.duration(ms).seconds()>0?`${moment.duration(ms).minutes()} min ${moment.duration(ms).seconds()} seconds`
    //     :`${moment.duration(ms).minutes()} min`

    // }
    // else{
    //     return `${moment.duration(ms).seconds()} seconds`

    // }
  }

  formatTimeFromMiliseconds(ms) {
    let seconds = Math.floor((ms / 1000) % 60);
    let minutes = Math.floor((ms / (1000 * 60)) % 60);
    let hours = Math.floor((ms / (1000 * 60 * 60)) % 100000000);

    return { seconds, minutes, hours };
  }

  formatTimeFromMilisecondsper(ms) {
    let hours = Math.floor(ms / 60);
    let minutes = Math.floor(ms % 60);
    // let hours = Math.floor((ms / 60 * 60) % 100000000));

    return { hours, minutes };
  }

  // convert date if date is in timestamp format
  public formatDate(data) {
    const date = new Date(data);
    // tslint:disable-next-line: max-line-length
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    let hours = date.getHours();
    let minutes = date.getMinutes();
    minutes = Number(minutes);
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? 0 + minutes : minutes;
    const strTime = hours + ":" + minutes + " " + ampm;

    const day = date.getDate();
    const monthIndex = date.getMonth();
    const year = date.getFullYear();

    return monthNames[monthIndex] + " " + day + " " + year + ", " + strTime;
  }
  public allwoOnlyAlpha({ keyCode }) {
    if (
      (keyCode >= 65 && keyCode <= 90) ||
      (keyCode >= 97 && keyCode <= 122) ||
      keyCode === 32
    ) {
      return true;
    } else {
      return false;
    }
  }

  public allwoOnlyAlpharesi({ keyCode }) {
    if (
      (keyCode >= 48 && keyCode <= 57) ||
      (keyCode >= 65 && keyCode <= 90) ||
      (keyCode >= 97 && keyCode <= 122) ||
      keyCode === 32 ||
      keyCode === 45 ||
      keyCode === 40 ||
      keyCode === 41 ||
      keyCode === 34
    ) {
      return true;
    } else {
      return false;
    }
  }

  /* Testing code for Fax number */
  public allowOnlyFax(fax: any) {
    console.log(fax);
    /* /^+?[0-9]+$/.test(fax) */
    let pattern = new RegExp("/^+?[0-9]+$/");
    if (pattern.test(fax) === true) {
      return true;
    } else {
      return false;
    }
  }

  public allwoAlphaAndNumAndSpace({ keyCode }) {
    if (
      (keyCode >= 65 && keyCode <= 90) ||
      (keyCode >= 97 && keyCode <= 122) ||
      (keyCode >= 48 && keyCode <= 57) ||
      keyCode === 32 ||
      keyCode === 45
    ) {
      return true;
    } else {
      return false;
    }
  }

  public allwoAlphaAndNum({ keyCode }) {
    if (
      (keyCode >= 65 && keyCode <= 90) ||
      (keyCode >= 97 && keyCode <= 122) ||
      (keyCode >= 48 && keyCode <= 57)
    ) {
      return true;
    } else {
      return false;
    }
  }

  public allwoAlphaNumLogin({ keyCode }) {
    if (
      (keyCode >= 65 && keyCode <= 90) ||
      (keyCode >= 97 && keyCode <= 122) ||
      (keyCode >= 48 && keyCode <= 57) ||
      keyCode === 46 ||
      keyCode === 95
    ) {
      return true;
    } else {
      return false;
    }
  }

  public allwoAlphaNumDash({ keyCode }) {
    if (
      (keyCode >= 65 && keyCode <= 90) ||
      (keyCode >= 97 && keyCode <= 122) ||
      (keyCode >= 48 && keyCode <= 57) ||
      keyCode === 45
    ) {
      return true;
    } else {
      return false;
    }
  }

  public allwoNum({ keyCode }) {
    if (
      (keyCode >= 48 && keyCode <= 57 && keyCode !== 101 && keyCode !== 69) ||
      keyCode === 13
    ) {
      return true;
    } else {
      return false;
    }
  }

  public allwoNumWithOutZero(event) {
    let { keyCode } = event;
    if (
      (keyCode >= 48 &&
        keyCode <= 57 &&
        ((event.target.value == "" && event.key != 0) ||
          event.target.value > 0) &&
        keyCode !== 101 &&
        keyCode !== 69) ||
      keyCode === 13
    ) {
      return true;
    } else {
      return false;
    }
  }

  public allwoNumDecimal({ keyCode }) {
    if (
      (keyCode >= 48 && keyCode <= 57 && keyCode !== 101 && keyCode !== 69) ||
      keyCode === 13 ||
      keyCode === 46
    ) {
      return true;
    } else {
      return false;
    }
  }

  public notAllwoSpace({ keyCode }) {
    if (keyCode === 32) {
      return false;
    } else {
      return true;
    }
  }

  public allowDateKeys({ keyCode }) {
    if (
      (keyCode >= 47 && keyCode <= 57 && keyCode !== 101 && keyCode !== 69) ||
      keyCode === 13 ||
      keyCode === 111
    ) {
      return true;
    } else {
      return false;
    }
  }

  public validSsn = (value: string) =>
    value &&
    /^(?!(000|666|9))(\d{3}-?(?!(00))\d{2}-?(?!(0000))\d{4})$/.test(value)
      ? true
      : false;

  public setRegId(id) {
    this.residentContent.next(id);
  }

  public setOrgFac(data, floorlist, facilityData) {
    data["floorlist"] = floorlist;
    data["timezone"] = facilityData.timezone;
    data["utc_offset"] = facilityData.utc_offset;
    this.content.next(data);
  }

  public setFloor(floorlist) {
    this.floorcontent.next(floorlist);
  }

  public setMoreOption(moreoption) {
    this.moreoptioncontent.next(moreoption);
  }

  public setunlinkOrderCount(count) {
    this.unlinkOrderCountcontent.next(count);
  }

  public setLoader(prop) {
    this.loadercontent.next(prop);
  }

  public setLastCrumb(prop) {
    this.lastcrumbcontent.next(prop);
  }

  public setMedQueryData(data) {
    this.medQueryContent.next(data);
  }

  public setDnrQueryData(data) {
    this.dnrQueryContent.next(data);
  }

  /* Beacon uuid validating */
  public checkUUID(uuid) {
    if (uuid.value.indexOf("_") >= 0 || uuid.value.length < 35) {
      uuid.control.setErrors({
        validateEqual: false,
      });
    } else {
      uuid.control.setErrors(null);
    }
  }

  public shiftTime() {
    const arr = [
      { no: 1, name: "1st Shift (6:00 - 14:00)" },
      { no: 2, name: "2nd Shift (14:00 - 22:00)" },
      { no: 3, name: "3rd Shift (22:00 - 6:00)" },
    ];
    return arr;
  }

  public medPass() {
    const arr = [
      { no: 1, name: "Early AM (4AM - 6AM)" },
      { no: 2, name: "Breakfast (6AM - 9AM)" },
      { no: 3, name: "Lunch (11AM - 2PM)" },
      { no: 4, name: "Supper  (4PM - 7PM)" },
      { no: 5, name: "Bedtime (8PM - 10PM)" },
    ];
    return arr;
  }

  checkScroll() {
    // window의 scroll top
    // Both window.pageYOffset and document.documentElement.scrollTop
    // returns the same result in all the cases.
    // window.pageYOffset is not supported below IE 9.
    const scrollPosition =
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;
    if (scrollPosition >= this.topPosToStartShowing) {
      this.isShow = true;
    } else {
      this.isShow = false;
    }
  }

  convertLocalToTimezone(localDt, localDtFormat, timezone) {
    return moment(localDt, localDtFormat)
      .tz(timezone)
      .format("YYYY-MM-DD hh:mm:ss A");
  }

  convertTimeToTimezone(localDt, timezone) {
    return moment(localDt).tz(timezone).format("HH:mm");
  }

  async get_rotation(timezone) {
    return new Promise((resolve, reject) => {
      const currHour = moment().tz(timezone).hour();
      const currTs = moment().tz(timezone).valueOf();
      const tomorrow = moment().tz(timezone).add(1, "day");

      const newDate1 = moment().tz(timezone);
      const newDate2 = moment().tz(timezone);
      let shift = 1;
      if (currHour >= 6 && currHour < 14) {
        shift = 1;
        newDate1.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
        newDate2.set({ hour: 13, minute: 59, second: 59, millisecond: 0 });
      } else if (currHour >= 14 && currHour < 22) {
        shift = 2;
        newDate1.set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
        newDate2.set({ hour: 21, minute: 59, second: 59, millisecond: 0 });
      } else {
        shift = 3;
        if (currHour < 6) {
          newDate1
            .subtract(1, "day")
            .set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
          newDate2.set({ hour: 5, minute: 59, second: 59, millisecond: 0 });
        } else {
          newDate1.set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
          newDate2
            .add(1, "day")
            .set({ hour: 5, minute: 59, second: 59, millisecond: 0 });
        }
      }

      const sTime = newDate1.hours();
      const eTime = newDate2.hours();
      const sTimeUTC = newDate1.utc().hours();
      const eTimeUTC = newDate2.utc().hours();
      const sMinute = newDate1.utc().minutes();
      const eMinute = newDate2.utc().minutes();
      let shiftStart, shiftEnd, prevShiftStart;
      shiftStart = newDate1.utc().valueOf();
      shiftEnd = newDate2.utc().valueOf();
      prevShiftStart = newDate1.subtract(8, "hours").utc().valueOf();

      let shiftsMinute, shifteMinute;
      let date1 = moment().tz(timezone),
        date2 = moment().tz(timezone).subtract(1, "days");
      date1 = date1.utc();
      date2 = date2.utc();
      shiftsMinute = date2["_d"].getTime();
      shifteMinute = date1["_d"].getTime();

      const rotation = {
        rotation: shift,
        sTime: sTime,
        eTime: eTime,
        sTimeUTC: sTimeUTC,
        eTimeUTC: eTimeUTC,
        sMinute: sMinute,
        eMinute: eMinute,
        start_date: shiftStart,
        end_date: shiftEnd,
        shift24sMinute: shiftsMinute,
        shift24eMinute: shifteMinute,
        prevShiftStart: prevShiftStart,
      };
      resolve(rotation);
    });
  }

  fallTypeList() {
    const fallTypes = [
      { no: 0, name: "All" },
      { no: 1, name: "With Head Injury" },
      { no: 2, name: "Without Head Injury" },
    ];
    return fallTypes;
  }

  testingStatusList() {
    const status = [
      { no: 0, name: "Negative" },
      { no: 1, name: "Positive" },
      { no: 2, name: "In-Progress" },
    ];

    return status;
  }

  curr_hrs_mnt() {
    return moment().minutes();
  }

  contactTypeList = [
    { name: "Home" },
    { name: "Mobile" },
    { name: "Office" },
    { name: "Fax" },
  ];

  async get_rotation_as_timeslot(payload) {
    return new Promise((resolve, reject) => {
      const mins = moment().utc().minutes();
      const milliseconds = mins > 30 ? 0 : 3600000;

      const ms = moment().valueOf() - milliseconds;
      const gte = ms + 1800000;
      const lt = ms + 3600000;
      const rotation = {
        $gte: gte,
        $lt: lt,
      };
      resolve(rotation);
    });
  }

  public errorMessages() {
    const errorMessageList = [
      {
        user_errors: {
          first_name_allow: "First name must be contain only letter and spaces",
          first_name_required: "First name not found",
          last_name_allow: "Last name must be contain only letter and spaces",
          last_name_required: "Last name not found",
          personal_email: "Invalid personal email address",
          work_email: "Invalid work email address",
          work_email_required: "Work email not found",
          primary_no: "Invalid primary Phone please enter only number's",
          primary_no_requires: "Primary phone not found",
          primary_no_len: "Primary phone no must be 10 digit's",
          secondary_no: "Invalid secondary Phone please enter only number's",
          secondary_no_len: "Secondary phone no must be 10 digit's",
          employee_id: "Employee ID not found",
          postion: "Invaild postion, Please choose User Position",
        },
      },
    ];
    return errorMessageList;
  }

  public toFeet(n) {
    //const realFeet = (( n * 0.393700) / 12);
    const realFeet = JSON.parse(n) / 12;
    const hie1 = realFeet.toString().split(".");
    const feet = parseInt(hie1[0]);
    const inches = Math.round(JSON.parse(n) - 12 * feet);
    return feet + "' `" + inches + "''";
    // if (realFeet > 0) {
    //   const feet = Math.floor(realFeet);
    //   const inches = Math.round((realFeet - feet) * 12);
    //   return feet + '\' `' + inches + '\'\'';
    // } else {
    //   return ( n * 0.393700) + '\'\'';
    // }
  }

  checkPrivilegeModule(module, action) {
    // if (this.privileges.web_rule != undefined && this.privileges.web_rule.hasOwnProperty(module)) {
    //   if (action == '') {
    //     let _arr = Object.values(this.privileges.web_rule[module]);
    //     return _arr.indexOf(true) > -1 ? true : false;
    //   } else {

    //     return this.privileges.web_rule[module].hasOwnProperty(action) ? this.privileges.web_rule[module][action] : false
    //   }

    // } else {
    //   return false;
    // }
    let user_access = JSON.parse(sessionStorage.getItem("userAccess"));
    if (user_access) {
      let userAcsData = this._aes256Service.decFn(user_access);
      let requestedModule = userAcsData.filter(
        (privlg) => privlg.module_name.toLowerCase() === module.toLowerCase()
      );
      if (requestedModule.length > 0) {
        if (
          requestedModule[0].access[action] &&
          requestedModule[0].access["view"]
        ) {
          return true;
        } else {
          return false;
        }
      } else {
        let ses = JSON.parse(sessionStorage.getItem("rolesPermission"));
        if (ses) {
          this.userPrivilege = this._aes256Service.decFn(ses);
          let requestedModule = this.userPrivilege.filter(
            (privlg) =>
              privlg.module_name.toLowerCase() === module.toLowerCase()
          );
          if (
            requestedModule.length > 0 &&
            requestedModule[0].position &&
            requestedModule[0].position.length &&
            requestedModule[0].position[0].access[action] == true &&
            requestedModule[0].position[0].access["view"]
          ) {
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      }
    } else {
      let ses = JSON.parse(sessionStorage.getItem("rolesPermission"));
      if (ses) {
        this.userPrivilege = this._aes256Service.decFn(ses);
        let requestedModule = this.userPrivilege.filter(
          (privlg) => privlg.module_name.toLowerCase() === module
        );
        if (
          requestedModule.length > 0 &&
          requestedModule[0].position[0].access[action] == true &&
          requestedModule[0].position[0].access["view"]
        ) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
  }

  formatPhoneNumberToUS(phone) {
    phone = phone.replace(/[^\d]/g, "");
    if (phone.length == 10) {
      return phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
    }
    return null;
  }

  // commonPaginationFn(moduleName) {
  //   const pageListingData = JSON.parse(sessionStorage.getItem('newPageListing')) || [];
  //   if (pageListingData && pageListingData.length) {
  //     pageListingData.forEach(element => {
  //       if (element.moduleName !== moduleName) {
  //           element['pageIndex'] = 0;
  //           element['pageSize'] = 10;
  //           element['previousPageIndex'] = 0;
  //           element['length'] = 0;
  //           element['search'] = '';
  //       }
  //     });
  //   }
  //   sessionStorage.setItem('newPageListing', JSON.stringify(pageListingData));
  // }
  payloadSetup(moduleName, pagiPayload) {
    let pageListingData = [];
    // pageListingData.forEach(e=>{

    /*if(e.moduleName != moduleName){
      e['previousPageIndex'] = 0;
      e['pageIndex'] = 0;
      e['pageSize'] = 10;
      e['length'] = 0;
    }
  })*/

    console.log("----setting payload-------");

    if (sessionStorage.getItem("activeModule") != moduleName) {
      sessionStorage.setItem("activeModule", moduleName);

      pageListingData =
        JSON.parse(sessionStorage.getItem("newPageListing")) || [];

      pageListingData.forEach((e) => {
        if (e.moduleName != moduleName) {
          e["previousPageIndex"] = 0;
          e["pageIndex"] = 0;
          e["pageSize"] = 10;
          e["length"] = 0;
        }
      });

      sessionStorage.setItem("newPageListing", JSON.stringify(pageListingData));
    }

    if (
      moduleName !== "residentList" &&
      moduleName !== "medicationList" &&
      moduleName !== "orderList"
    ) {
      const medicationList = {
        pageIndex: 0,
        pageSize: 10,
        previousPageIndex: 0,
        search: "Proscar",
        activeMed: true,
        sort: {
          active: "medication_name",
          direction: "asc",
        },
        resident_id: "",
        listType: "",
        // 'resident_id': '5cf55ffbaed88f1fc3da2f50',
        // 'listType': 'U2FsdGVkX188NUTcLYreWti04q1HuI9o*WQgKijvaLkBdvu2r%2BkjcpnBydjtgsDM',
        delete: false,
      };

      const orderPageList = {
        length: 0,
        pageIndex: 0,
        pageSize: 10,
        previousPageIndex: 0,
        prescriptionCreated: false,
        sort: { active: "name", direction: "asc" },
        folderName: "unlink_orders",
      };
      sessionStorage.setItem(
        "orderListing",
        JSON.stringify({ orderList: orderPageList })
      );
      sessionStorage.setItem(
        "medicationListing",
        JSON.stringify({ medicationList: orderPageList })
      );
    }

    /* if (sessionStorage.getItem('activeModule') !== activeModule) {
       console.log('active module',activeModule)
       sessionStorage.setItem('activeModule', activeModule);
       pageListingData.push(pagiPayload);
        sessionStorage.setItem('newPageListing', JSON.stringify(pageListingData));
     }*/

    if (sessionStorage.getItem("newPageListing")) {
      const pageListing = JSON.parse(sessionStorage.getItem("newPageListing"));
      pageListingData =
        JSON.parse(sessionStorage.getItem("newPageListing")) || [];
      const index = pageListingData.findIndex(
        (item) => item.moduleName === moduleName
      );
      if (index !== -1) {
        pagiPayload.previousPageIndex =
          pageListingData[index].previousPageIndex;
        pagiPayload.pageIndex = pageListingData[index].pageIndex;
        pagiPayload.pageSize = pageListingData[index].pageSize;
        pagiPayload.length = pageListingData[index].length;
      } else {
        pagiPayload.moduleName = moduleName;
        pageListingData.push(pagiPayload);
        sessionStorage.setItem(
          "newPageListing",
          JSON.stringify(pageListingData)
        );
      }
    } else {
      pagiPayload.moduleName = moduleName;
      pageListingData.push(pagiPayload);
      sessionStorage.setItem("newPageListing", JSON.stringify(pageListingData));
    }
  }

  updatePayload(event, moduleName, pagiPayload) {
    let pageListingData = [];

    if (sessionStorage.getItem("newPageListing")) {
      // const pageListing = JSON.parse(sessionStorage.getItem('newPageListing'));
      pageListingData =
        JSON.parse(sessionStorage.getItem("newPageListing")) || [];
      const index = pageListingData.findIndex(
        (item) => item.moduleName === moduleName
      );
      if (index !== -1) {
        pageListingData[index].previousPageIndex =
          pagiPayload.previousPageIndex;
        pageListingData[index].pageIndex = pagiPayload.pageIndex;
        pageListingData[index].pageSize = pagiPayload.pageSize;
        pageListingData[index].length = pagiPayload.index;

        sessionStorage.setItem(
          "newPageListing",
          JSON.stringify(pageListingData)
        );

        /*this.pagiPayload.previousPageIndex = pageListingData[index].previousPageIndex;
        this.pagiPayload.pageIndex = pageListingData[index].pageIndex;
        this.pagiPayload.pageSize = pageListingData[index].pageSize;
        this.pagiPayload.length = pageListingData[index].length;*/
      } else {
        pagiPayload.moduleName = moduleName;
        pageListingData.push(pagiPayload);
        sessionStorage.setItem(
          "newPageListing",
          JSON.stringify(pageListingData)
        );
      }
    } else {
      pagiPayload.moduleName = moduleName;
      pageListingData.push(pagiPayload);
      sessionStorage.setItem("newPageListing", JSON.stringify(pageListingData));
    }
  }

  // checkPermission(moduleName, privilege) {
  //   let encryptedPermission = JSON.parse(sessionStorage.getItem('rolesPermission'));
  //   let loggedDetails = JSON.parse(sessionStorage.getItem('authReducer'));
  //   if(encryptedPermission){
  //     let roles_permssion = this._aes256Service.decFn(encryptedPermission);
  //     let requested = roles_permssion.filter(role => role.module_name === moduleName);
  //     if(requested.length>0 && requested[0].position[0].access[privilege]==false /*&& requested[0].position[0].position_id == loggedDetails.position_id*/){
  //       return false;
  //     }
  //     else
  //     {
  //       return true;
  //     }

  //   }
  // }

  checkAllPrivilege(moduleName) {
    let user_access = JSON.parse(sessionStorage.getItem("userAccess"));
    let encryptedRoles = JSON.parse(sessionStorage.getItem("rolesPermission"));
    if (user_access) {
      let userAcsData = this._aes256Service.decFn(user_access);
      let requestedModule =
        userAcsData.filter((privlg) => privlg.module_name === moduleName) || [];
      if (requestedModule && requestedModule.length > 0) {
        if (
          requestedModule &&
          requestedModule.length > 0 &&
          requestedModule[0].access["add"] == false &&
          requestedModule[0].access["view"] == false &&
          requestedModule[0].access["edit"] == false &&
          requestedModule[0].access["delete"] == false &&
          requestedModule[0].access["export"] == false
        ) {
          return false;
        } else {
          return true;
        }
      } else {
        if (encryptedRoles) {
          let privileges = this._aes256Service.decFn(encryptedRoles);
          let filtered = privileges.filter(
            (privilege) => privilege.module_name === moduleName
          );
          if (
            filtered &&
            filtered.length > 0 &&
            filtered[0].position &&
            filtered[0].position.length &&
            (filtered[0].position[0].access["add"] == true ||
              filtered[0].position[0].access["view"] == true ||
              filtered[0].position[0].access["edit"] == true ||
              filtered[0].position[0].access["delete"] == true ||
              filtered[0].position[0].access["export"] == true)
          ) {
            return true;
          } else {
            return false;
          }
        }
      }
    } else {
      if (encryptedRoles) {
        let privileges = this._aes256Service.decFn(encryptedRoles);
        let filtered = privileges.filter(
          (privilege) => privilege.module_name === moduleName
        );
        if (
          filtered.length > 0 &&
          filtered[0].position &&
          filtered[0].position.length &&
          (filtered[0].position[0].access["add"] == true ||
            filtered[0].position[0].access["view"] == true ||
            filtered[0].position[0].access["edit"] == true ||
            filtered[0].position[0].access["delete"] == true ||
            filtered[0].position[0].access["export"] == true)
        ) {
          return true;
        } else {
          return false;
        }
      }
    }
  }

  checkRolesPosition(moduleName, positionId) {
    let authorisedPositionId = [
      { position_name: "Director", positionId: "5db035d70fc0bc161a5844a0" },
      { position_name: "Agency", positionId: "5db2cbbb2b6044d2126f207e" },
      { position_name: "iKoble", positionId: "5db2cbf12b6044d2126f20a2" },
    ];
    let encryptedRoles = JSON.parse(sessionStorage.getItem("rolesPermission"));
    if (encryptedRoles) {
      let privileges = this._aes256Service.decFn(encryptedRoles);
      let filtered = privileges.filter(
        (privilege) => privilege.module_name === moduleName
      );
      if (
        filtered.length > 0 &&
        filtered[0].position[0].access["add"] == false &&
        filtered[0].position[0].access["view"] == false &&
        filtered[0].position[0].access["edit"] == false &&
        filtered[0].position[0].access["delete"] == false &&
        filtered[0].position[0].access["export"] == false
      ) {
        if (
          authorisedPositionId.find((elem) => elem.positionId == positionId)
        ) {
          return true;
        } else {
          return false;
        }
      } else {
        return true;
      }
    }
  }

  checkEditPermission(positionId) {
    let authorisedPositionId = [
      { position_name: "Director", positionId: "5db035d70fc0bc161a5844a0" },
      { position_name: "Agency", positionId: "5db2cbbb2b6044d2126f207e" },
      { position_name: "iKoble", positionId: "5db2cbf12b6044d2126f20a2" },
    ];
    let flag = authorisedPositionId.findIndex(
      (elem) => elem.positionId == positionId
    );
    if (flag != -1) {
      return false;
    }
    let encryptedPermission = JSON.parse(
      sessionStorage.getItem("rolesPermission")
    );
    if (encryptedPermission) {
      let roles_permssion = this._aes256Service.decFn(encryptedPermission);
      let requested = roles_permssion.filter(
        (role) => role.module_name === "Permissions"
      );
      console.log(requested);
      if (
        requested.length > 0 &&
        requested[0].position[0].access["edit"] == false
      ) {
        return true;
      } else {
        return false;
      }
    }
  }

  setCheckedValue(depName: any, checkValue: any) {
    if (this.helperArr.length === 0) {
      this.helperArr.push({ name: depName, checked: checkValue });
    } else {
      for (let i = 0; i < this.helperArr.length; i++) {
        if (this.helperArr[i].name === depName) {
          this.helperArr[i].checked = checkValue;
        }
      }
    }
  }
  getCheckedValue() {
    return this.helperArr;
  }
}
