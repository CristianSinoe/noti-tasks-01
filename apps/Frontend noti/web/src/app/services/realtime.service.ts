import { Injectable, NgZone } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private socket!: Socket;
  private notifications$ = new Subject<any>();
  private taskEvents$ = new Subject<any>();

  constructor(private zone: NgZone) {
    this.socket = io(environment.SOCKET_URL, { transports: ['websocket'] });

    this.socket.on('notification', (payload) => {
      this.zone.run(() => this.notifications$.next(payload));
    });

    this.socket.on('task:event', (payload) => {
      this.zone.run(() => this.taskEvents$.next(payload));
    });
  }

  onNotification(): Observable<any> { return this.notifications$.asObservable(); }
  onTaskEvent(): Observable<any> { return this.taskEvents$.asObservable(); }
}
