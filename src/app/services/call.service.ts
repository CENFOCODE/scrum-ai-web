import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CallService {
  private trigger = new Subject<{ action: string, payload?: any }>();
  trigger$ = this.trigger.asObservable();

  call(action: string, payload?: any) {
    this.trigger.next({ action, payload });
  }
}
