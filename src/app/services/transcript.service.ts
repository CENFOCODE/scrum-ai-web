import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from './base-service';
import { environment } from '../../environments/environment';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TranscriptService extends BaseService<any> {
  
  constructor() {
    super();
    this.source = 'api/transcription';
  }

  transcribeChunkOnly(audioBase64: string): Observable<any> {
    const fullUrl = `${this.source}/transcribe-chunk`;
    
    return this.http.post<any>(fullUrl, { 
      audioBase64: audioBase64
    }).pipe(
      catchError(err => throwError(() => err))
    );
  }

  saveBatchTranscripts(data: {
    ceremonySessionId: number;
    roomId: string;
    transcripts: Array<{
      username: string;
      text: string;
      timestamp: string;
      userId: number;
    }>;
  }): Observable<any> {
    
    return this.http.post(`${this.source}/save-batch`, data).pipe(
      catchError(err => throwError(() => err))
    );
  }
}