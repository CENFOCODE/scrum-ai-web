import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiService } from '../../services/ai.service';
import { IScenario, IScenarioTemplate, ISimulationUser } from '../../interfaces';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss']
})
export class ChatbotComponent implements OnInit {

  /** Input para recibir la plantilla de IA desde el dashboard */
  @Input() aiTemplate: IScenarioTemplate | null = null;
  @Input() scenario: ISimulationUser | null = null;

  /**
   * Historial del chat.
   * Cada entrada contiene:
   * - from: "Usuario" | "Scrum AI"
   * - prompt: texto enviado o recibido
   */
  messages: { from: string; prompt?: string }[] = [];

  /** Indica si la IA está generando respuesta */
  loading = false;

  /** Indica si el chatbot está visible/abierto */
  visible = false;

  constructor(private aiService: AiService) { }

  /**
   * Alterna la visibilidad del chatbot
   */
  toggleChatbot() {
    this.visible = !this.visible;
  }

  /**
   * Inicializa el chat con el prompt de la plantilla AI
   */
  ngOnInit() {
    // Contexto inicial del asistente (se envía de forma invisible)
    const contextPrompt = 'Eres un asistente de Scrum donde tienes como objetivo ayudar a los usuarios en los errores más comunes en Scrum, el usuario tiene que seleccionar la ceremonia, ya sea Planning, Daily, Review o Retrospective y tiene que seleccionar tambien la dificultad.';

    if (this.aiTemplate?.promptTemplate) {
      // Agregar el prompt como mensaje del usuario
      this.messages.push({
        from: 'Usuario',
        prompt: this.aiTemplate.promptTemplate
      });

      // Enviar automáticamente el prompt a la IA con el contexto
      this.loading = true;
      const fullPrompt = `${contextPrompt}\n\n${this.aiTemplate.promptTemplate}`;
      
      this.aiService.askAI({ prompt: fullPrompt }).subscribe({
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

    } else {
      // Mensaje por defecto de la IA si no hay plantilla
      this.messages.push({
        from: 'Scrum AI',
        prompt: '¡Hola! Soy tu asistente de Scrum. ¿En qué puedo ayudarte hoy?'
      });
    }
  }

  /**
   * Envía el texto del input hacia Groq usando AiService.
   * - Añade el mensaje del usuario al historial.
   * - Limpia el input.
   * - Inicia estado de carga.
   * - Incluye el contexto del prompt inicial.
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

    // Contexto del asistente
    const contextPrompt = 'Eres un asistente de Scrum donde tienes como objetivo ayudar a los usuarios en los errores más comunes en Scrum, el usuario tiene que seleccionar la ceremonia, ya sea Planning, Daily, Review o Retrospective y con su dificultad. Si el usuario no elige ser Scrum Master por defecto debes tomar este rol.';

    // Combinar contexto + prompt inicial + mensaje del usuario
    let fullPrompt = `${contextPrompt}\n\n`;

    if (this.aiTemplate?.promptTemplate) {
      fullPrompt += `${this.aiTemplate.promptTemplate}\n\n`;
    }

    fullPrompt += `Usuario: ${text}\nScrum AI:`;

    // Solicitud al backend → GroqService con contexto completo
    this.aiService.askAI({ prompt: fullPrompt }).subscribe({
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
