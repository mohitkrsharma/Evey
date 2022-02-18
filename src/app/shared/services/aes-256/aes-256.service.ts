  import { Injectable } from '@angular/core';
import * as crypto from 'crypto-js';
import { Store } from '@ngrx/store';
import { environment } from './../../../../environments/environment';


interface AppState {
  _authUser: number;
}

@Injectable({
  providedIn: 'root'
})
export class Aes256Service {
  passphraseKey: String;
  authState: Object;

  constructor(private authStore: Store<AppState>) {
    this.authStore.select('authState').subscribe(sub => {
      this.authState = sub;
    });
  }

  printStore(state) {
    this.authStore.select(state).subscribe(sub => {
      this.authState = sub;
    });
  }

  getKey() {
    // console.log('this.authState',this.authState);
    // tslint:disable-next-line: max-line-length
    // let key = (this.authState['isLoggedin'] === 'true' || this.authState['forOTP'] === 'true' ) ?  this.authState['privateKey'] : this.authState['publicKey'];
    // tslint:disable-next-line: max-line-length
    const key = (this.authState['isLoggedin'] === 'true' || this.authState['forOTP'] === 'true' ) ?  this.authState['privateKey'] : environment.config.salt;
    // let key = !this.authState['token'] ? this.authState['publicKey'] : this.authState['privateKey'];
    return key;
  }

  encFnWithsalt(payload) {
    const key = environment.config.salt;
    const encrypted = crypto.AES.encrypt(JSON.stringify(payload), key);
    return encrypted.toString().replace(/\//g, '*');
  }

  decFnWithsalt(payload) {
    const key = environment.config.salt;
    // if(!payload){
    //   return {};
    // }
    const decrypted = crypto.AES.decrypt( payload.replace(/\*/g, '/') , key);
    try {
      // tslint:disable-next-line: max-line-length
      return (decrypted.toString(crypto.enc.Utf8)) ? JSON.parse( decrypted.toString(crypto.enc.Utf8) ) ? JSON.parse( decrypted.toString(crypto.enc.Utf8) ) : {} : {};
    } catch (e) {
      return {};
    }
  }

  encFn(payload) {
    const key = this.getKey();
    const encrypted = crypto.AES.encrypt(JSON.stringify(payload), key);
    return encrypted.toString();
  }

  decFn(payload) {
    const key = this.getKey();
    // console.log("dec function keyeeee1111",key)
    const decrypted = crypto.AES.decrypt(payload, key);
    return JSON.parse( decrypted.toString(crypto.enc.Utf8) );
  }

  decWithKeyFn(payload) {
    const key = this.authState['privateKey'];
    // console.log("dec with key  func keyeeeeee2222",key)
    const decrypted = crypto.AES.decrypt(payload, key);
    return JSON.parse( decrypted.toString(crypto.enc.Utf8) );
  }
}
