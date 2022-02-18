import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
// import { Socket } from 'ngx-socket-io';
import {Aes256Service} from './../../../shared/services/aes-256/aes-256.service';
import {ApiService} from '../api/api.service';
import {io} from 'socket.io-client';
import {environment} from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  _socket;
  constructor(
    // private _socket: Socket,
    private _aes256Service: Aes256Service,
    private _apiService: ApiService,
  ) {
       this._socket = io(environment.config.socket_url);
  }

  onDashboardDown(payload) {
    return  new Observable(observer => {
      const data = this._socket.emit('dashboardDown', {payload});
      observer.next(data);
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
  }

  connectFn(name) {
    // console.log(name)
    const observable = new Observable(observer => {
      const data = this._socket.emit('joinRoom', { roomName: name });
      observer.next(data);
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
  }

  disConnectFn(name) {
    const observable = new Observable(observer => {
      const data = this._socket.emit('leaveRoom', { roomName: name });
      observer.next(data);
    });
    return observable;
  }

  // join room api
  listenRoomFn() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        // console.log(response)
        // console.log(this._aes256Service.decFnWithsalt(response.data))
        if (response.eventType == 'group-permission-update' || response.eventType == 'individual-permission-update' || response.eventType == 'affected_schedule_occurance' || response.eventType == 'activity_schedule') {
          console.log('Listened');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response);
        }
      });
    });
    return observable;
  }

  getloggedOutUserFn() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'logoutUser' && response.status) {
          console.log('logoutUser');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
  }

  onDeleteLiveDashboard() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'logoutLiveDashboard' && response.status) {
          console.log('logoutLiveDashboard');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
  }

  // onScheduleUpdateFn() {
  //   const observable = new Observable(observer => {
  //     this._socket.on('affected_schedule_occurance', (data: any) => {
  //       console.log('affected_schedule_occurance');
  //       data = this._aes256Service.decFnWithsalt(data);
  //       console.log("socket response>>>>>",data)
  //       observer.next(data);
  //     });
  //     return () => {
  //       console.log('TRACKCARE SOCKET DISCONNECTED');
  //     };
  //   });
  //   return observable;
  // }

  onTrackCareUpdateFn() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'trackcare' && response.status) {
          console.log('trackcare');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
            console.log('Trackcare response ----->>', response.data);
          }
          observer.next(response.data);
        }
      });
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
  }

  onVitalUpdate() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'new-care' && response.status) {
          console.log('new-care');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
  }

  onLoginUpdateFn() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'onloginupdate' && response.status) {
          // debugger
          console.log('onloginupdate');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
  }

  getConnectedUserDetailFn() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'newConnectedUserDetail' && response.status) {
          console.log('newConnectedUserDetail');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
  }

  getDisconnectedUserFn() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'disconnectedUser' && response.status) {
          console.log('disconnectedUser');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
  }

  connectedEvent(event: string, payload: any) {
    this._socket.emit(event, payload, function (_res) {
      console.log(event);
      if (!_res) {
        this.connectedEvent(event, payload);
      }
    });
  }

  reqConnectedUsersFn(event: string) {
    console.log(event);
    this._socket.emit(event);
  }

  getMessages() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'loggedInEvent' && response.status) {
          console.log('loggedInEvent');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
  }

  getId() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'socket_id' && response.status) {
          console.log('socket_id');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
  }

  getAnnouncementFn() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'update_announce' && response.status) {
          console.log('update_announce');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
  }

  getActivityUpdatedFn() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'activity_schedule' && response.status) {
          console.log('update_activity');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
  }

  updateResidentFn() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'update_resident' && response.status) {
          console.log('update_resident');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
  }

  addResidentFn() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'add_resident' && response.status) {
          console.log('add_resident');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
  }

  //Resident Delete Start
  deleteResidentFn() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'delete_resident' && response.status) {
          console.log('delete_resident');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
  }

  //Resident Delete End
  updateZoneFn() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'update_zone' && response.status) {
          console.log('update_zone');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
  }

  ///////////////////////////////////////////////////

  // async getOngoingShiftFn(payload) {
  //   return new Promise(async (resolve, reject) => {
  //     this._socket.emit('ongoingShift', payload, function(_confirmation) {
  //       if (_confirmation['_status']) {
  //         resolve(_confirmation);
  //       } else {
  //         reject(_confirmation);
  //       }
  //     });
  //   });
  // }
  // async getOngoingCaresFn(payload) {
  //   return new Promise(async (resolve, reject) => {
  //     this._socket.emit('ongoingCares', payload, function(_confirmation) {
  //       if (_confirmation['_status']) {
  //         resolve(_confirmation);
  //       } else {
  //         reject(_confirmation);
  //       }
  //     });
  //   });
  // }
  // async getOngoingUnassignedFn(payload) {
  //   return new Promise(async (resolve, reject) => {
  //     this._socket.emit('ongoingUnassigned', payload, function(_confirmation) {
  //       if (_confirmation['_status']) {
  //         resolve(_confirmation);
  //       } else {
  //         reject(_confirmation);
  //       }
  //     });
  //   });
  // }

  // async getDateTimeFn(payload) {
  //   return new Promise(async (resolve, reject) => {
  //     this._socket.emit('getDateTime', payload, function(_confirmation) {
  //       if (_confirmation['_status']) {
  //         resolve(_confirmation);
  //       } else {
  //         reject(_confirmation);
  //       }
  //     });
  //   });
  // }
  // getOngoingTotaltimeFn(payload, cb) {
  //   this.socket.emit('ongoingTotaltime', payload, function(_confirmation){
  //     cb(_confirmation);
  //   });
  // }
  // async getOngoingOpenCaresFn(payload) {
  //   return new Promise(async (resolve, reject) => {
  //     this._socket.emit('ongoingOpenCares', payload, function(_confirmation) {
  //       if (_confirmation['_status']) {
  //         resolve(_confirmation);
  //       } else {
  //         reject(_confirmation);
  //       }
  //     });
  //   });
  // }

  // async openCareLeftFn(payload) {
  //   return new Promise(async (resolve, reject) => {
  //     this._socket.emit('openCareLeftCount', payload, function(_confirmation) {
  //       if (_confirmation['_status']) {
  //         resolve(_confirmation);
  //       } else {
  //         reject(_confirmation);
  //       }
  //     });
  //   });
  // }

  // async getOngoingPerformersFn(payload) {
  //   return new Promise(async (resolve, reject) => {
  //     this._socket.emit('ongoingPerformers', payload, function(_confirmation) {
  //       if (_confirmation['_status']) {
  //         resolve(_confirmation);
  //       } else {
  //         reject(_confirmation);
  //       }
  //     });
  //   });
  // }

  // async fetchLevelFn(payload) {
  //   return new Promise(async (resolve, reject) => {
  //     this._socket.emit('fetchLevelRecords', payload , function(_confirmation) {
  //       if (_confirmation['_status']) {
  //         resolve(_confirmation);
  //       } else {
  //         reject(_confirmation);
  //       }
  //     });
  //   });
  // }

  // async fetchFallsFn(payload) {
  //   return new Promise(async (resolve, reject) => {
  //     this._socket.emit('fetchFallsRecords', payload , function(_confirmation) {
  //       if (_confirmation['_status']) {
  //         resolve(_confirmation);
  //       } else {
  //         reject(_confirmation);
  //       }
  //     });
  //   });
  // }

  // async fetchAlertsFn(payload) {
  //   return new Promise(async (resolve, reject) => {
  //     this._socket.emit('fetchAlertsRecords', payload , function(_confirmation) {
  //       if (_confirmation['_status']) {
  //         resolve(_confirmation);
  //       } else {
  //         reject(_confirmation);
  //       }
  //     });
  //   });
  // }

  // async getLabelMessage(payload) {
  //   return new Promise(async (resolve, reject) => {
  //     this._socket.emit('labelMessage', payload, function(_confirmation) {
  //       if (_confirmation['_status']) {
  //         resolve(_confirmation);
  //       } else {
  //         reject(_confirmation);
  //       }
  //     });
  //   });
  // }

  // careGraph
  // async careGraphFn(payload) {
  //   return new Promise(async (resolve, reject) => {
  //     this._socket.emit('onCareGraphFn', payload, function (_confirmation) {
  //       if (_confirmation['_status']) {
  //         resolve(_confirmation);
  //       } else {
  //         reject(_confirmation);
  //       }
  //     });
  //   });
  // }

  // async load_def_Lev_Chart(payload) {
  //   return new Promise(async (resolve, reject) => {
  //     this._socket.emit('onDefLevChart', payload, function (_confirmation) {
  //       if (_confirmation['_status']) {
  //         resolve(_confirmation);
  //       } else {
  //         reject(_confirmation);
  //       }
  //     });
  //   });
  // }


  // LOGGEDIN USERS
  // async fetchConnectedUsersListFn(payload) {
  //   return new Promise(async (resolve, reject) => {
  //     this._socket.emit('connectedUsersList', payload, function(_confirmation) {
  //       if (_confirmation['_status']) {
  //         // console.log("connected Data",_confirmation._result);
  //         resolve(_confirmation);
  //       } else {
  //         reject(_confirmation);
  //       }
  //     });
  //   });
  // }

  onResidentOutOfFacilityFn() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'resi_out_of_facility' && response.status) {
          console.log('resi_out_of_facility');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
    //  console.log('socket connected in resi_out_of_facility');
  }

  onResidentIsVirusCheckFn() {
    // console.log('socket connected in is_virus_check');
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'resi_is_virus_check' && response.status) {
          console.log('resi_is_virus_check');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
  }
  onResidentIsIsolationFn() {
    // console.log('socket connected in is_isolation');
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'resident_isolated' && response.status) {
          console.log('resident_isolated');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
  }
  onResidentStopIsolationFn() {
    // console.log('socket connected in is_isolation');
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'stop_isolation' && response.status) {
          console.log('stop_isolation');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
  }

  onResidentListIsVirusCheckFn() {
    // console.log('socket connected in is_virus_check resident list');
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'resi_list_is_virus_check' && response.status) {
          console.log('resi_list_is_virus_check');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
  }

  onResidentTestingStatusFn() {
    // console.log('socket connected in is_virus_check resident list');
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'resi_testing_status' && response.status) {
          console.log('resi_testing_status');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
  }
  onLiveDashConnectedFn() {
    // console.log('socket connected in is_virus_check resident list');
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'liveDashConnected' && response.status) {
          console.log('liveDashConnected');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
  }
  onStatusDashConnectedFn() {
    // console.log('socket connected in is_virus_check resident list');
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'statusDashConnected' && response.status) {
          console.log('statusDashConnected');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
  }
  onUpdatePrivilegeConnectedFn() {
    // console.log('socket connected in is_virus_check resident list');
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'update_privilege' && response.status) {
          console.log('update_privilege');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
  }
  onResidentOutRoomFn() {
    // console.log('socket connected in is_virus_check resident list');
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'update_resident' && response.status) {
          console.log('update_resident');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
  }

  onAlertDashConnectedFn() {
    // console.log('socket connected in is_virus_check resident list');
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'alertDashConnected' && response.status) {
          console.log('alertDashConnected');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
  }

  OntestEventFn() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'testEvent' && response.status) {
          console.log('testEvent');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
  }

  addPharmacyFn() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'add_pharmacy' && response.status) {
          console.log('add_pharmacy');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
  }

  updatePharmacyFn() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'update_pharmacy' && response.status) {
          console.log('update_pharmacy');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
  }

  addPhysicianFn() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'add_doctor' && response.status) {
          console.log('add_doctor');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
  }

  updatePhysicianFn() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'update_doctor' && response.status) {
          console.log('update_doctor');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
  }
  // add medication socket
  addMedicationFn() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'add_medication' && response.status) {
          console.log('add_medication');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
    });
    return observable;
  }

  // add medication socket
  updateMedicationFn() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'update_medication' && response.status) {
          console.log('update_medication');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
    });
    return observable;
  }

  // add order socket
  addOrderFn() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'new_order' && response.status) {
          console.log('new_order');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
    });
    return observable;
  }

  // link order to resident socket
  dashboardOrderCountFn() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'update_dashboard_order_count' && response.status) {
          console.log('update_dashboard_order_count');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
    });
    return observable;
  }

  // update resident status socket
  dashboardResidentCountFn() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'update_dashboard_resident_count' && response.status) {
          console.log('update_dashboard_resident_count');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
    });
    return observable;
  }

  // update dashboard care socket
  dashboardCareCountFn() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'update_dashboard_care_count' && response.status) {
          console.log('update_dashboard_care_count');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
    });
    return observable;
  }

  // update care socket
  udpateCareFn() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'update_care' && response.status) {
          console.log('update_care');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
    });
    return observable;
  }

  // add care socket
  addCareFn() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'add_care' && response.status) {
          console.log('add_care');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
    });
    return observable;
  }

  // move order on aws socket
  updateOrderFn() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'order_update' && response.status) {
          console.log('order_update');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
    });
    return observable;
  }

  // Update performance dashboard data
  updatePerformanceDashboardFn() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'update_performance_dashboard' && response.status) {
          console.log('update_performance_dashboard');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
    });
    return observable;
  }

  demoDashboardFn() {
    const observable = new Observable(observer => {
      this._socket.on('testevent', response => {
        observer.next(response);
      });
    });
    return observable;
  }

  // Update questionnare data group wise
  updateQuestionnareDataGroupWiseFn() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'update_question_group' && response.status) {
          console.log('update_question_group');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
    });
    return observable;
  }

  // Add questionnare data group wise
  addQuestionnareDataGroupWiseFn() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'add_question_group' && response.status) {
          console.log('add_question_group');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
    });
    return observable;
  }

  // preferred_physician  and preferred_pharmacy

  onResidentpreferred_physicianFn() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'preferred_physician' && response.status) {
          console.log('preferred_physician ');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
    //  console.log('socket connected in resi_out_of_facility');
  }
  onResidentpreferred_pharmacyFn() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'preferred_pharmacy' && response.status) {
          console.log('preferred_pharmacy  ');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
    //  console.log('socket connected in resi_out_of_facility');
  }
  // primary_physician  and primary_pharmacy
  onResidentprimary_pharmacyFn() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'primary_pharmacy' && response.status) {
          console.log('primary_pharmacy');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
    //  console.log('socket connected in resi_out_of_facility');
  }

  onResidentprimary_physicianFn() {
    const observable = new Observable(observer => {
      this._socket.on('onBroadcastToRooms', response => {
        if (response.eventType == 'primary_physician' && response.status) {
          console.log('primary_physician');
          if (response.data.toString().indexOf("object") == -1) {
            response.data = this._aes256Service.decFnWithsalt(response.data);
          }
          observer.next(response.data);
        }
      });
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
    //  console.log('socket connected in resi_out_of_facility');
  }

  // join room api
  joinRoomFn() {
    const observable = new Observable(observer => {
      this._socket.on('joinRoom', (data) => {
        console.log('joinRoom');
        data = this._aes256Service.decFnWithsalt(data);
        observer.next(data);
      });
    });
    return observable;
  }

  // leave room
  leaveRoomFnOld() {
    const observable = new Observable(observer => {
      this._socket.on('leaveRoom', (data) => {
        console.log('leaveRoom');
        data = this._aes256Service.decFnWithsalt(data);
        observer.next(data);
      });
    });
    return observable;
  }

  // leave room
  leaveRoomFn(name) {
    const observable = new Observable(observer => {
      const data = this._socket.emit('leaveRoom', { roomName: name });
      observer.next(data);
      return () => {
        console.log('SOCKET DISCONNECTED');
      };
    });
    return observable;
  }
  async joinRoomWithfac(facility, roomName, isLeaveRoom = false) {
    let room = `${facility}-${roomName}`;

    //leave room
    if (isLeaveRoom) {
      this.leaveRoomFn(room).subscribe((res: any) => {
        if (res.connected) {
          console.log('exit')
        }
      })
    } else {
      this.connectFn(room).subscribe((res: any) => {
        if (res.connected) {
          console.log('entry');
        }
      });

    }


  }
}
