import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from './base-service';
import { IAIResponse, IResponse } from '../interfaces';

/**
 * Servicio Angular que conecta con el backend Spring Boot para enviar prompts a la IA (Groq).
 */
@Injectable({
  providedIn: 'root'
})
export class AiService extends BaseService<IAIResponse> {
  protected override source: string = 'ai';

  /**
   * Envía un prompt al backend y retorna la respuesta de la IA.
   * @param prompt Texto del usuario
   * @returns Observable<string> Respuesta de la IA
   */
    askAI(body:{prompt: string}): Observable<IResponse<IAIResponse>> {
        return this.addCustomSource("ask", body);

    }
}

