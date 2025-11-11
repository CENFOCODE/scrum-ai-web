import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiService } from '../../services/ai.service';

/**
 * Componente del Chat Scrum AI conectado al backend (Groq).
 *
 * RESPONSABILIDADES:
 * ------------------
 * ✅ Capturar el input del usuario.
 * ✅ Enviar el mensaje al backend (Groq API vía Spring Boot).
 * ✅ Renderizar la respuesta generada por la IA.
 * ✅ Mostrar el estado de carga mientras se espera respuesta.
 *
 * ESTE COMPONENTE NO:
 * --------------------
 * ❌ No genera prompts avanzados.
 * ❌ No gestiona WebRTC.
 * ❌ No aplica lógica de ceremonias Scrum.
 *
 * RELACIÓN CON OTROS ARCHIVOS:
 * ----------------------------
 * - AiService → envía las solicitudes a /ai/ask
 * - AIController.java → recibe la solicitud del frontend
 * - GroqService.java → ejecuta el request a Groq
 */
@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss']
})
export class ChatbotComponent {

  /**
   * Historial del chat.
   * Cada entrada contiene:
   * - from: "Usuario" | "Scrum AI"
   * - prompt: texto enviado o recibido
   */
  messages: { from: string; prompt?: string }[] = [];

  /** Indica si la IA está generando respuesta */
  loading = false;

  constructor(private aiService: AiService) {}

  /**
   * Envía el texto del input hacia Groq usando AiService.
   * - Añade el mensaje del usuario al historial.
   * - Limpia el input.
   * - Inicia estado de carga.
   * - Añade la respuesta generada por IA.
   *
   * @param input Elemento <input> que contiene el texto ingresado.
   */
  sendMessage(input: HTMLInputElement) {
    const text = input.value.trim();
    if (!text) return;

    // Registrar mensaje local
    this.messages.push({ from: 'Usuario', prompt: text });
    input.value = '';
    this.loading = true;

    // Solicitud al backend → GroqService
    this.aiService.askAI({ prompt: text }).subscribe({
      next: (response) => {
        this.messages.push({
          from: 'Scrum AI',
          prompt: response.data.answer
        });
        this.loading = false;
      },
      error: () => {
        this.messages.push({
          from: 'Scrum AI',
          prompt: '⚠️ Error al comunicarse con la IA.'
        });
        this.loading = false;
      }
    });
  }
}
