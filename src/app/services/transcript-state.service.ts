import { Injectable, signal } from '@angular/core';

/**
 * Servicio compartido para gestionar transcripts en memoria.
 *
 * RESPONSABILIDADES:
 * - Acumular transcripts en tiempo real
 * - Compartir datos entre VideoRoom y Chatbot
 * - Formatear transcripts para la IA
 * - Limpiar transcripts al finalizar ceremonia
 */
@Injectable({
  providedIn: 'root'
})
export class TranscriptStateService {

  private transcriptHistory = signal<Array<{
    username: string;
    text: string;
    userId: number;
    timestamp: Date;
  }>>([]);

  private accumulatedTexts: string[] = [];

  addTranscript(username: string, text: string, userId: number) {
    this.transcriptHistory.update(history => [
      ...history,
      {
        username,
        text,
        userId,
        timestamp: new Date()
      }
    ]);

    this.accumulatedTexts.push(text);

  }

  getTranscriptHistory() {
    return this.transcriptHistory();
  }

  getFormattedTranscript(): string {
    return this.transcriptHistory()
      .map(t => `[${t.username}]: ${t.text}`)
      .join('\n');
  }

  getConsolidatedText(): string {
    return this.accumulatedTexts.join(' ');
  }

  getAllTranscripts(): Array<{
    username: string;
    text: string;
    userId: number;
    timestamp: Date;
  }> {
    return this.transcriptHistory();
  }

  clearTranscripts() {
    this.transcriptHistory.set([]);
    this.accumulatedTexts = [];
  }

  get transcriptHistory$() {
    return this.transcriptHistory.asReadonly();
  }
}