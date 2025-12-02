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
        return this.http.post<IResponse<any>>(`api/webrtc/send-invitation`, {
            email,
            roomId,
            inviterName,
            ceremonyType,
            scenarioId
        });
    }
}