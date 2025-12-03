import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiService } from '../../services/ai.service';
import { SimulationService } from '../../services/simulation.service';
import {IScenarioTemplate, ISimulationUser} from '../../interfaces';

/**
 * ============================================================
 * 🧠 COMPONENTE UNIVERSAL DE CHAT (Scrum AI)
 * ============================================================
 * Este componente permite interacción con la IA en cualquier ceremonia.
 * Funciona en dos modos:
 *
 *   - "general" → Planning, Review, Retrospective y entrenamiento
 *   - "daily"   → Daily con lógica especial (roles, tablero, impedimentos)
 *
 * Ambos modos conviven de forma independiente.
 *
 * ============================================================
 * ¿CÓMO USARLO EN TU CEREMONIA?
 * ============================================================
 * 1) Si tu ceremonia usa plantillas desde `scenario_templates`:
 *
 *      <app-chatbot [aiTemplate]="template"></app-chatbot>
 *
 * 2) Si tu ceremonia solo necesita mensajes libres:
 *
 *      <app-chatbot></app-chatbot>
 *
 * 3) Para Daily:
 *
 *      <app-chatbot mode="daily"></app-chatbot>
 *
 * ============================================================
 */

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss']
})
export class ChatbotComponent implements OnInit {

  /** Plantilla proveniente de scenario_templates (Planning/Review/Retro) */
  @Input() aiTemplate: IScenarioTemplate | null = null;
  @Input() scenario: ISimulationUser | null = null;

  /** Modo de funcionamiento */
  @Input() mode: 'daily' | 'general' = 'general';

  /** Historial del chat */
  messages: { from: string; prompt?: string }[] = [];

  loading = false;

  /** Mostrar/ocultar chatbot */
  visible = false;

  constructor(
    private aiService: AiService,
    private simulationService: SimulationService
  ) {}

  toggleChatbot() {
    this.visible = !this.visible;
  }

  /**
   * ============================================================
   * INICIALIZACIÓN
   * ============================================================
   * - Modo Daily → mensaje inicial básico
   * - Modo general → muestra la plantilla del escenario si existe
   */
  ngOnInit() {

    // Modo general (Planning/Review/Retro o Training)
    const contextPrompt =
      'Eres un asistente de Scrum y debes ayudar según la ceremonia seleccionada.';

    if (this.aiTemplate?.promptTemplate) {
      // Mostrar la plantilla como primer mensaje
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
          this.aiService.setResponse(response.data.answer || '');
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

    /**
     * ============================================================
     * MODO DAILY
     * ============================================================
     * Usa un request estructurado para que la IA analice roles,
     * impedimentos, tablero y respuestas tipo "ayer / hoy / blockers".
     */
    if (this.mode === 'daily') {

      // 🚀 Tomamos valores reales de SimulationService (Signals)
      const ceremonyInfo = this.simulationService.dailyCeremonyInfo$();
      const board = this.simulationService.dailyBoard$();
      const answers = this.simulationService.dailyAnswers$();

      const payload = {
        message: text,
        answers: answers,
        board: board,
        activeRoles: ceremonyInfo?.activeRoles || [],
        userRole: ceremonyInfo?.userRole || 'Scrum Master',
        simulationId: ceremonyInfo?.simulationId || null,
        difficulty: ceremonyInfo?.difficulty || 1
      };

      this.aiService.dailyChat(payload).subscribe({
        next: (response: string) => {
          this.messages.push({ from: 'Scrum AI', prompt: response });
          this.loading = false;
        },
        error: () => {
          this.messages.push({
            from: 'Scrum AI',
            prompt: '⚠️ Hubo un error procesando el Daily.'
          });
          this.loading = false;
        }
      });

      return;
    }

    /**
     * ============================================================
     * MODO GENERAL
     * ============================================================
     * Para Planning, Review y Retrospective:
     * Se arma un prompt libre, con contexto + plantilla (si existe).
     */
    const contextPrompt =
      'Eres un asistente experto en Scrum y debes guiar según la ceremonia.';

    let fullPrompt = `${contextPrompt}\n\n`;

    // Si existe plantilla del escenario → agregarla
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
