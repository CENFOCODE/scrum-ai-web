import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from './base-service';
import { IAIResponse, IResponse } from '../interfaces';

/**
 * Servicio encargado de comunicarse con el backend para enviar prompts a la IA (Groq).
 *
 * Este servicio usa `BaseService`, lo cual permite:
 *  - Construir automáticamente la URL base (`/ai`)
 *  - Usar métodos dinámicos como `addCustomSource()`
 *  - Estandarizar la estructura de respuesta IResponse<T>
 *
 * RELACIÓN CON EL BACKEND:
 * ------------------------
 * El backend expone el endpoint:
 *
 *    POST /ai/ask
 *
 * que procesa:
 *    { prompt: string }
 *
 * y responde:
 *    { answer: string }
 *
 * USO TÍPICO EN UN COMPONENTE:
 * ----------------------------
 * this.aiService.askAI({ prompt: this.input }).subscribe(res => {
 *     this.feedback = res.data.answer;
 * });
 *
 * DONDE SE USA:
 * -------------
 * - En las ceremonias: Daily, Planning, Retro, Review…
 * - En pantallas de entrenamiento del Scrum Team
 */
@Injectable({
  providedIn: 'root'
})
export class AiService extends BaseService<IAIResponse> {

  /** Endpoint raíz del backend para IA → /ai */
  protected override source: string = 'ai';

  /**
   * Envía un prompt al backend y retorna la respuesta generada por Groq.
   *
   * @param body Objeto que contiene el campo `prompt` enviado al modelo.
   * @returns Observable con la estructura estándar del backend:
   *          {
   *            message: string,
   *            data: { answer: string }
   *          }
   */
  askAI(body: { prompt: string }): Observable<IResponse<IAIResponse>> {
    return this.addCustomSource("ask", body);
  }
}
