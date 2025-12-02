import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {IResponse} from "../interfaces";

@Injectable({
    providedIn:'root'
})

export class InvitationService {
    constructor(private http: HttpClient) {}

    sendInvitation(
      email: string,
      roomId: string,
      inviterName: string,
      ceremonyType?: string,
      scenarioId?: number
    ): Observable<IResponse<any>> {

        console.log("Aqui chill en el service");
        return this.http.post<IResponse<any>>(`api/webrtc/send-invitation`, {
            email,
            roomId,
            inviterName,
            ceremonyType,
            scenarioId
        });
    }
}

// sendInvitation() {
//   if (!this.inviteEmail || !this.inviteEmail.includes('@')) {
//     this.notice.set({
//       type: 'warning',
//       text: 'Por favor ingresa un email válido'
//     });
//     return;
//   }
//
//   // Si aún no se creó la simulación, marcar que habrá usuarios invitados
//   // if (!this.simulation?.id) {
//   //   this.hasInvitedUsers = true;
//   // }
//
//   const roomId = `room-${Date.now()}`;
//   const inviterName = this.authService.getUser()?.name || 'Un usuario';
//   const ceremonyType = this.selectedScenario?.ceremonyType || 'Ceremonia Scrum';
//   const scenarioId = this.selectedScenario?.id || 0;
//
//   this.invitationService.sendInvitation(
//     this.inviteEmail,
//     roomId,
//     inviterName,
//     // ceremonyType,
//     // scenarioId
//   ).subscribe({
//     next: () => {
//       this.hasInvitedUsers = true; // Marcar que hay invitados
//       this.notice.set({
//         type: 'success',
//         text: `Invitación enviada exitosamente a ${this.inviteEmail}`
//       });
//       this.inviteEmail = '';
//     },
//     error: (err) => {
//       console.error('Error enviando invitación:', err);
//       this.notice.set({
//         type: 'error',
//         text: 'Error al enviar la invitación. Intenta nuevamente.'
//       });
//     }
//   });
// }