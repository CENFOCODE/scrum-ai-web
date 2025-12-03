import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CallService {
  private trigger = new Subject<{ action: string, payload?: any }>();
  trigger$ = this.trigger.asObservable();
  private roomIdSource = new Subject<string>();
  roomId$ = this.roomIdSource.asObservable();
  private creatorRoom = new Subject<boolean>();
  creatorRoom$ = this.creatorRoom.asObservable();

  call(action: string, payload?: any) {
    this.trigger.next({ action, payload });
  }

  sendRoomId(roomId: string) {
    this.roomIdSource.next(roomId);
  }

  isCreatorRoom(isCreatorRoom: boolean){
    this.creatorRoom.next(isCreatorRoom);
  }

  resetCallState() {
    this.roomIdSource.next('');
    this.creatorRoom.next(false);
  }
}
