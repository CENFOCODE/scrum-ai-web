import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiService } from '../../services/ai.service';

/**
 * Componente del Chat Scrum AI conectado a Groq.
 */
@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss']
})
export class ChatbotComponent {
  messages: { from: string; prompt?: string }[] = [];
  loading = false;

  constructor(private aiService: AiService) {}

  /**
   * Envía el mensaje al backend (Groq) y agrega la respuesta al chat.
   * @param input Elemento <input> del HTML.
   */
  sendMessage(input: HTMLInputElement) {
    const text = input.value.trim();
    if (!text) return;

    this.messages.push({ from: 'Usuario', prompt: text });
    input.value = '';
    this.loading = true;

    this.aiService.askAI({prompt: text}).subscribe({
      next: (response) => {
        console.log(response);
        this.messages.push({ from: 'Scrum AI', prompt: response.data.answer });
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
