import { EventEmitter, Injectable, Output } from "@angular/core";
import { HttpClient, HttpHeaders, HttpXhrBackend } from "@angular/common/http";
import { Observable, of, throwError } from "rxjs";
import { Store } from "@ngrx/store";
import { select } from "@ngrx/store";
import { catchError, delay, take, timeout } from "rxjs/operators";
import { insertFn, resetFn } from "../../../shared/store/auth/action";
import { Aes256Service } from "./../aes-256/aes-256.service";
import { environment } from "../../../../environments/environment";
import { Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { CommonService } from "src/app/shared/services/common.service";

import * as moment from "moment-timezone";
// import { getPriority } from 'os';

interface AuthState {
  _authUser: object;
}

@Injectable({
  providedIn: "root",
})
export class ApiService {
  // count$: Observable<number>;
  endpoint = {};
  encString: String = "";
  Headers: any = {};
  authStateData;
  @Output() Error400Response: EventEmitter<any> = new EventEmitter();
  constructor(
    private _authUser: Store<AuthState>,
    private http: HttpClient,
    private aes256Service: Aes256Service,
    private router: Router,
    private toastr: ToastrService,
    public _commonService: CommonService
  ) {
    // this.count$ = _authUser.pipe(select('count'));
    this.endpoint = this.getUrl();
  }

  static checkAuthStatus() {
    const _this = new Object();
    const headerKeyVal = {
      "Content-Type": "application/json",
    };
    const _headerss = new HttpHeaders();
    headerKeyVal["x-access-token"] = _headerss.get("x-access-token");
    headerKeyVal["timezone"] = moment.tz.guess();
    headerKeyVal["timezone_offset"] = String(new Date().getTimezoneOffset());
  }

  private getTimezone(): string {
    return moment.tz.guess();
  }

  private getTimezoneOffset(): string {
    return String(new Date().getTimezoneOffset());
  }

  async getClientkey() {
    return new Promise(async (resolve, reject) => {
      resolve(
        this._authUser
          .pipe(select("authState"), take(1))
          .subscribe((_val) => _val)
      );
    });
  }

  async getauthData() {
    return new Promise(async (resolve, reject) => {
      this._authUser.pipe(select("authState"), take(1)).subscribe((_val) => {
        resolve(_val);
      });
    });
  }

  async setHeaders() {
    return new Promise(async (resolve, reject) => {
      let _headers = {};
      this._authUser.pipe(select("authState"), take(1)).subscribe((_val) => {
        const headerKeyVal = {
          "Content-Type": "application/json",
          timezone: this.getTimezone(),
          timezone_offset: this.getTimezoneOffset(),
        };
        if (_val["isLoggedin"] === "true" || _val["forOTP"] === "true") {
          headerKeyVal["x-access-token"] = _val["token"];
        }
        _headers = new HttpHeaders(headerKeyVal);
        resolve(_headers);
      });
    });
  }

  async setHeadersForFileUpload() {
    return new Promise(async (resolve, reject) => {
      const _headers = [];
      this._authUser.pipe(select("authState"), take(1)).subscribe((_val) => {
        if (_val["isLoggedin"] === "true" || _val["forOTP"] === "true") {
          _headers.push({ name: "x-access-token", value: _val["token"] });
          _headers.push({ name: "timezone", value: this.getTimezone() });
          _headers.push({
            name: "timezone_offset",
            value: this.getTimezoneOffset(),
          });
        }
        resolve(_headers);
      });
    });
  }

  async formdataHeaders() {
    return new Promise(async (resolve, reject) => {
      let _headers = {};
      this._authUser.pipe(select("authState"), take(1)).subscribe((_val) => {
        const headerKeyVal = {
          // 'Content-Type': 'multipart/form-data; boundary=WebAppBoundary'
        };
        if (_val["isLoggedin"] === "true") {
          headerKeyVal["x-access-token"] = _val["token"];
        }

        _headers = new HttpHeaders(headerKeyVal);
        //  const httpOptions = {
        //   headers: new HttpHeaders(headerKeyVal)
        // };
        resolve(_headers);
      });
    });
  }

  private getUrl() {
    const obj = {};
    obj["domain"] = environment.config.api_url;
    obj["socket"] = environment.config.socket_url;
    return obj;
  }

  private handleError<T>(operation = "operation", result?: T) {
    return (error: any): Observable<T> => {
      // TODO: send the error to remote logging infrastructure
      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  private extractData(res: Response) {
    const body = res;
    return body || {};
  }

  async deleteFxn(action: Object, payload: any) {
    return new Promise(async (resolve, reject) => {
      const apiURL =
        this.endpoint["domain"] + action["target"] + "?payload=" + payload;
      let _headers = {};
      _headers = await this.setHeaders();
      this.http
        .delete(apiURL, { headers: _headers, observe: "response" })
        .pipe(
          timeout(120000),
          catchError((err) => throwError(err))
        )
        .subscribe(
          async (result: any) => {
            // await this.setNewToken(result.headers.get('x-access-token'));
            console.log(result);
            resolve(result.body);
          },
          (err) => {
            // console.log('errorerrorerror---default----errorerrorerror', JSON.stringify(err));
            this.authStateData = this.getauthData();
            this.authStateData = this.authStateData.__zone_symbol__value;
            if (err.status === 401) {
              if (this.toastr.currentlyActive === 0) {
                this.toastr.error(
                  "Your session has expired please login again."
                );
                this._authUser.dispatch(resetFn({}));
                this.router.navigate(["/"]);
              }
              // this.router.navigate(['/']);
              if (err.error && err.error.data && err.error.data.token_status) {
                this.toastr.error(
                  "Your session has expired please login again."
                );
                this._authUser.dispatch(resetFn({}));
                this.router.navigate(["/"]);
              } else {
                this.toastr.error(err);
              }
            } else if (err.status === 405) {
              if (this.toastr.currentlyActive === 0) {
                this.toastr.error("Permission not granted");
              }
              this._commonService.setLoader(false);
            } else {
              console.log(err);
              if (this.toastr.currentlyActive === 0) {
                this.toastr.error(
                  "We are sorry! An error occurred. Please try again or send us a message."
                );
                // this._authUser.dispatch(resetFn({}));
                //this.router.navigate(['']);
              }
            }
          }
        );
    });
  }

  async putFxn(action: Object, payload: any) {
    return new Promise(async (resolve, reject) => {
      const apiURL = this.endpoint["domain"] + action["target"];
      let _headers = {};
      _headers = await this.setHeaders();
      this.http
        .put(
          apiURL,
          { payload: payload },
          { headers: _headers, observe: "response" }
        )
        .pipe(
          timeout(120000),
          catchError((err) => throwError(err))
        )
        .subscribe(
          async (result: any) => {
            // await this.setNewToken(result.headers.get('x-access-token'));
            resolve(result.body);
          },
          (err) => {
            // console.log('errorerrorerror----default----errorerrorerror', JSON.stringify(err));
            this.authStateData = this.getauthData();
            this.authStateData = this.authStateData.__zone_symbol__value;
            if (err.status === 401) {
              // && this.authStateData.isLoggedin !== 'false' && (this.authStateData.token !== undefined)) {
              // if (err.status === 401 && (this.authStateData != undefined || this.authStateData != "")) {
              if (this.toastr.currentlyActive === 0) {
                this.toastr.error(
                  "Your session has expired please login again."
                );
                this._authUser.dispatch(resetFn({}));
                // this._authUser.dispatch(insertFn({ token: undefined, isLoggedin: false }));
                this.router.navigate(["/"]);
              }
              if (err.error && err.error.data && err.error.data.token_status) {
                this.toastr.error(
                  "Your session has expired please login again."
                );
                this._authUser.dispatch(resetFn({}));
                this.router.navigate(["/"]);
              } else {
                this.toastr.error(err);
              }
            } else if (err.status === 405) {
              if (this.toastr.currentlyActive === 0) {
                this.toastr.error("Permission not granted");
              }
              this._commonService.setLoader(false);
            } else {
              if (this.toastr.currentlyActive === 0) {
                this.toastr.error(
                  "We are sorry! An error occurred. Please try again or send us a message"
                );
                // this._authUser.dispatch(resetFn({}));
                // this.router.navigate(['']);
              }
            }
          }
        );
    });
  }

  async postFxn(action: Object, payload: any) {
    return new Promise(async (resolve, reject) => {
      const apiURL = this.endpoint["domain"] + action["target"];
      let _headers = {};
      _headers = await this.setHeaders();

      if (action["target"] === "login") {
        _headers["x-access-token"] = undefined;
      }
      //  console.log( "final payload ===>>>  ",payload)
      this.http
        .post(
          apiURL,
          { payload: payload },
          { headers: _headers, observe: "response" }
        )
        .pipe(
          timeout(120000),
          catchError((err) => throwError(err))
        )
        .subscribe(
          async (result: any) => {
            // this._commonService.setLoader(false);
            // await this.setNewToken(result.headers.get('x-access-token'));
            resolve(result.body);
          },
          (err) => {
            this._commonService.setLoader(false);
            this.authStateData = this.getauthData();
            this.authStateData = this.authStateData.__zone_symbol__value;
            if (err.status === 401) {
              if (this.toastr.currentlyActive === 0) {
                this.toastr.error(err.error.message);
                // this.toastr.error('Your session has expired please login again.');
                this.router.navigate([""]);
                this._authUser.dispatch(resetFn({}));
              }
              // this.router.navigate(['/']);
            } else if (err.status === 400) {
              console.log(err, "=-=-=-=-erereer");
              this.Error400Response.emit(err);
              if (action["target"] == "users/otp") {
                reject(err.error);
              }

              err.error = this.aes256Service.decFn(err.error);
              if (this.toastr.currentlyActive === 0) {
                this.toastr.error(err.error.message);
              }
              if (action["target"] === "login") {
                reject(err.error);
              }
              this._commonService.setLoader(false);
            } else if (err.status === 500) {
              if (this.toastr.currentlyActive === 0) {
                this.toastr.error(
                  "Internal Server Error, Please contact Administrator!"
                );
                // this.router.navigate(['']);
              }
              this._commonService.setLoader(false);
            } else if (err.status === 405) {
              if (this.toastr.currentlyActive === 0) {
                this.toastr.error("Permission not granted");
              }
              this._commonService.setLoader(false);
            } else {
              //  console.log("error response ===>>>  ",err)
              if (this.toastr.currentlyActive === 0) {
                this.toastr.error(
                  "We are sorry! An error occurred. Please try again or send us a message"
                );
                //this.router.navigate(['']);
              }
            }
          }
        );
    });
  }

  async postDashFxn(action: Object, payload: any) {
    return new Promise(async (resolve, reject) => {
      const apiURL = this.endpoint["domain"] + action["target"];
      let _headers = {};
      _headers = await this.setHeaders();
      if (action["target"] === "login") {
        _headers["x-access-token"] = undefined;
      }
      this.http
        .post(
          apiURL,
          { payload: payload },
          { headers: _headers, observe: "response" }
        )
        .subscribe(
          async (result: any) => {
            // await this.setNewToken(result.headers.get('x-access-token'));
            resolve(result.body);
          },
          (err) => {
            //console.log('errorerrorerror----default----errorerrorerror', JSON.stringify(err));
          }
        );
    });
  }

  async formdataFxn(action: Object, payload: any) {
    return new Promise(async (resolve, reject) => {
      const apiURL = this.endpoint["domain"] + action["target"];
      //////////////////
      let _headers = {};
      _headers = await this.formdataHeaders();
      this.http
        .post(apiURL, payload, { headers: _headers, observe: "response" })
        .subscribe(
          async (result: any) => {
            // await this.setNewToken(result.headers.get('x-access-token'));
            resolve(result.body);
          },
          (err) => {
            // console.log('errorerrorerror----default----errorerrorerror', JSON.stringify(err));
            this.authStateData = this.getauthData();
            this.authStateData = this.authStateData.__zone_symbol__value;
            if (err.status === 401) {
              // && this.authStateData.isLoggedin !== 'false' && (this.authStateData.token !== undefined)) {
              // if (err.status === 401 && (this.authStateData != undefined || this.authStateData != "")) {
              if (this.toastr.currentlyActive === 0) {
                this.toastr.error(
                  "Your session has expired please login again."
                );
                this._authUser.dispatch(resetFn({}));
                // this._authUser.dispatch(insertFn({ token: undefined, isLoggedin: false }));
              }
              // this.router.navigate(['/']);
            } else {
              if (this.toastr.currentlyActive === 0) {
                this.toastr.error(
                  "We are sorry! An error occurred. Please try again or send us a message"
                );
                // this._authUser.dispatch(resetFn({}));
                //this.router.navigate(['']);
              }
            }
          }
        );
    });
  }

  async getFxn(action: Object, encString: String, isSocket?: boolean) {
    return new Promise(async (resolve, reject) => {
      // if(isSocket) {
      //   this.endpoint['domain'] = environment.config.socket_url;
      // } else {
      //   this.endpoint['domain'] = environment.config.api_url;
      // }
      let apiURL = "";
      if (isSocket) {
        apiURL =
          environment.config.socket_url +
          action["target"] +
          "?payload=" +
          encString;
      } else {
        apiURL =
          this.endpoint["domain"] + action["target"] + "?payload=" + encString;
      }
      //const apiURL = this.endpoint['domain'] + action['target'] + '?payload=' + encString;
      let _headers = {};
      _headers = await this.setHeaders();
      //  console.log("gettt FUnction working ====>>>> ",action)
      this.http
        .get(apiURL, { headers: _headers, observe: "response" })
        .pipe(
          timeout(120000),
          catchError((err) => throwError(err))
        )
        .subscribe(
          async (result: any) => {
            // await this.setNewToken(result.headers.get('x-access-token'));
            resolve(result.body);
          },
          (err) => {
            // console.log('errorerrorerror----deafult----errorerrorerror', JSON.stringify(err));
            this.authStateData = this.getauthData();
            this.authStateData = this.authStateData.__zone_symbol__value;
            if (err.status === 401) {
              if (this.toastr.currentlyActive === 0) {
                this.toastr.error(
                  "Your session has expired please login again."
                );
                this._authUser.dispatch(resetFn({}));
                this.router.navigate(["/"]);
              }
              if (err.error && err.error.data && err.error.data.token_status) {
                this.toastr.error(
                  "Your session has expired please login again."
                );
                this._authUser.dispatch(resetFn({}));
                this.router.navigate(["/"]);
              } else {
                this.toastr.error(err);
              }
            } else if (err.status === 400) {
              err.error = this.aes256Service.decFn(err.error);
              if (this.toastr.currentlyActive === 0) {
                this.toastr.error(err.error.message);
              }
              this._commonService.setLoader(false);
            } else if (err.status === 500) {
              if (this.toastr.currentlyActive === 0) {
                this.toastr.error(
                  "Internal Server Error, Please contact Administrator!"
                );
                // this.router.navigate(['']);
              }
              this._commonService.setLoader(false);
            } else if (err.status === 405) {
              if (this.toastr.currentlyActive === 0) {
                this.toastr.error("Permission not granted");
              }
              this._commonService.setLoader(false);
            } else {
              if (this.toastr.currentlyActive === 0) {
                this.toastr.error(
                  "We are sorry! An error occurred. Please try again or send us a message"
                );
                //this.router.navigate(['']);
              }
            }
          }
        );
    });
  }

  async setNewToken(token) {
    // tslint:disable-next-line: no-unused-expression
    new Promise((resolve) => {
      this._authUser.pipe(select("authState"), take(1)).subscribe((_val) => {});
      if (token && token !== "") {
        this._authUser.dispatch(insertFn({ token }));
      }
      resolve(true);
    });
  }

  async getJsonFxn(action: Object) {
    return new Promise(async (resolve, reject) => {
      const apiURL = this.endpoint["domain"] + action["target"];
      this.http
        .get(apiURL, { observe: "response" })
        .subscribe(async (result: any) => {
          // await this.setNewToken(result.headers.get('x-access-token'));
          resolve(result.body);
        });
    });
  }

  async checkTokenInHeaderFn() {
    return new Promise(async (resolve, reject) => {
      this._authUser.pipe(select("authState"), take(1)).subscribe((_val) => {
        resolve(_val["token"]);
      });
    });
  }

  async checkAuthenticationStatus() {
    return new Promise(async (resolve, reject) => {
      const apiURL = this.endpoint["domain"] + "auth/authentication";
      const checkToken = await this.checkTokenInHeaderFn();
      if (checkToken && checkToken !== "") {
        let _headers = {};
        _headers = await this.setHeaders();
        this.http
          .get(apiURL, { headers: _headers, observe: "response" })
          .subscribe(
            async (result: any) => {
              resolve(result.body);
            },
            (err) => {
              resolve(err);
            }
          );
      } else {
        resolve({ msg: "Not authenticate" });
      }
    });
  }

  async apiFn(action, payload, isSocket = null) {
    return new Promise(async (resolve, reject) => {
      let encResult;
      let decResult;
      if (action.type === "LOGIN") {
        this._authUser.dispatch(insertFn({ forOTP: "false", privateKey: "" }));
      }
      if (action.type !== "") {
        //  console.log("Second Function Payload before ency ===>>> ",payload)
        this.encString = this.aes256Service.encFn(payload); // ENC
      }

      switch (action.type) {
        case "GET":
          encResult = await this.getFxn(action, this.encString, isSocket);
          if (isSocket) {
            decResult = encResult;
          } else {
            decResult = this.aes256Service.decFn(encResult); // DEC
          }
          resolve(decResult);
          break;
        case "POST":
          this.postFxn(action, this.encString)
            .then(
              (res) => {
                if (action.resType === 1) {
                  // console.log("this.encString",res)
                  resolve(encResult);
                }
                decResult = this.aes256Service.decFn(res); // DEC
                resolve(decResult);
              },
              (error) => console.log("Error", error)
            )
            .catch((error) => {
              console.log("EFGGGGGRRR", error);
              reject(error);
            });

          break;
        case "POST_DASHBOARD":
          encResult = await this.postDashFxn(action, this.encString);
          if (action.resType === 1) {
            resolve(encResult);
            break;
          }
          decResult = this.aes256Service.decFn(encResult); // DEC
          resolve(decResult);
          break;
        case "FORMDATA":
          encResult = await this.formdataFxn(action, payload);
          decResult = this.aes256Service.decFn(encResult); // DEC
          resolve(decResult);
          break;
        case "PUT":
          encResult = await this.putFxn(action, this.encString);
          decResult = this.aes256Service.decFn(encResult); // DEC
          resolve(decResult);
          break;
        case "DELETE":
          encResult = await this.deleteFxn(action, this.encString);
          decResult = this.aes256Service.decFn(encResult); // DEC
          resolve(decResult);
          break;
        case "LOGIN":
          encResult = await this.postFxn(action, this.encString);
          // console.log(">>>",encResult)
          if (encResult.status == undefined) {
            decResult = this.aes256Service.decFn(encResult); // DEC With Public Key
          } else {
            decResult = encResult;
            resolve(decResult);
          }

          if (decResult["status"] === false) {
            resolve(decResult["data"]);
          } else {
            let privateKey = this.aes256Service.decFn(decResult["privateKey"]); // DEC With Public Key
            privateKey = privateKey["privatekey"];
            this._authUser.dispatch(insertFn({ privateKey })); // INSERT IN authReducer STORE
            decResult = this.aes256Service.decWithKeyFn(decResult["data"]); // DECWith Private Key
            // console.log(">>>",decResult)
            const loginObj = {
              token: decResult["data"]["token"],
              forOTP: "true",
              user_id: decResult["data"]["user"]["_id"],
              //role_id: decResult['data']['user']['role_id']['_id'],
              //role:  decResult['data']['user']['role_id'] && decResult['data']['user']['role_id']['role_name'] ? decResult['data']['user']['role_id']['role_name'] : '',
              position_id: decResult["data"]["user"]["job_title"],
            };
            this._authUser.dispatch(insertFn(loginObj));
            // INSERT token IN authReducer STORE
            resolve(decResult);
          }
          break;
        case "OTP":
          encResult = await this.postFxn(action, this.encString);
          decResult = this.aes256Service.decWithKeyFn(encResult); // DEC With Public Key
          if (decResult["status"] === false) {
            resolve(decResult);
          } else {
            //console.log(">>>",decResult)
            this._authUser.dispatch(insertFn({ isLoggedin: "true" }));
            resolve(decResult);
          }
          break;
        case "LIVE":
          // console.log("this.encStringthis.encString",payload)
          encResult = await this.postFxn(action, payload);
          resolve(encResult);
          // decResult = this.aes256Service.decWithKeyFn(encResult); // DEC With Public Key
          // if (decResult['status'] === false) {
          //   resolve(decResult['data']);
          // }else{
          //   this._authUser.dispatch(insertFn({ isLoggedin: 'true' }));
          //   resolve(decResult['data']);
          // }
          break;
        default:
          // let authStatus = await this.checkAuthStatus(action);
          const result = await this.getJsonFxn(action);
          const publicKey = result["data"]["public_key"];
          this._authUser.dispatch(insertFn({ publicKey })); // INSERT IN authReducer STORE
          this._authUser.dispatch(insertFn({ client_key: payload.client_key }));
          resolve(result["data"]);
      }
    });
  }

  async getRolesData() {
    let userObj = JSON.parse(sessionStorage.getItem("authReducer"));
    let user_access = await this.apiFn(
      { type: "POST", target: "users/user_access" },
      { userId: userObj.user_id }
    );
    if (user_access && user_access["data"] && user_access["data"].length > 0) {
      console.log(
        "JSON.stringify(this.aes256Service.encFn(user_access['data'][0]['module'])) ===============",
        JSON.stringify(
          this.aes256Service.encFn(user_access["data"][0]["module"])
        )
      );
      sessionStorage.setItem(
        "userAccess",
        JSON.stringify(
          this.aes256Service.encFn(user_access["data"][0]["module"])
        )
      );
    }
    const action = { type: "GET", target: "roles/roles_access" };
    const payload = {
      positionId: userObj.position_id,
    };
    const result = await this.apiFn(action, payload);
    if (result["status"] && result["data"] && result["data"].length > 0) {
      const encryptedPermission = this.aes256Service.encFn(result["data"]);
      sessionStorage.setItem(
        "rolesPermission",
        JSON.stringify(encryptedPermission)
      );
    }
  }
}
