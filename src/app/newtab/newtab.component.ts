import { Component, OnInit } from '@angular/core';
import { SocketService } from './../../../src/app/shared/services/socket/socket.service';

@Component({
  selector: 'app-newtab',
  templateUrl: './newtab.component.html',
  styleUrls: ['./newtab.component.scss']
})
export class NewtabComponent implements OnInit {

  constructor(private _socketService: SocketService) { }

  ngOnInit() {
    this.connectWithSocketFn()
  }

  connectWithSocketFn() {
    console.log('Commit No. 111');
    // this._socketService.connectFn();
    const roomName = '60a7ac5ec13b7b1dd2ee3036-scheduling';
    this._socketService.connectFn(roomName).subscribe(_response => {
      if (_response) {
          console.log("Socket Res ===> ", _response);
      }
  });
  }

}
