import { Injectable } from '@angular/core';

/**
 * Servicio WebSocket usado para la señalización WebRTC en Scrum AI.
 *
 * PRINCIPALES FUNCIONES:
 * - Maneja la conexión WebSocket al backend.
 * - Implementa reconexión automática con backoff exponencial.
 * - Mantiene viva la conexión mediante mensajes "ping".
 * - Encola mensajes si la conexión aún no está abierta.
 * - Permite registrar múltiples listeners para mensajes entrantes.
 *
 * RESPONSABILIDADES:
 * - Proveer un canal robusto para enviar/recibir señales WebRTC
 *   (offer, answer, ice, join, invite, etc.)
 * - Asegurar que las desconexiones temporales NO rompan las llamadas grupales.
 *
 * RELACIÓN CON OTROS ARCHIVOS:
 * - WebSocketHandler.java → Procesa los mensajes del backend.
 * - videoRoom.component.ts → Envía y recibe señales WebRTC usando este servicio.
 */
@Injectable({ providedIn: 'root' })
export class SocketService {
  /** URL del WebSocket remoto (ngrok/Cloudflare del backend) */
  private readonly WS_URL = 'wss://wai-fossillike-imperatorially.ngrok-free.dev/webrtc';
  
  /** Instancia WebSocket */
  private socket!: WebSocket;

  /** Estado actual de conexión */
  private isConnected = false;

  /** Evita reconexión si el cierre fue manual */
  private manuallyClosed = false;

  /** Cola de mensajes pendientes */
  private messageQueue: any[] = [];

  /** Subscriptores de mensajes entrantes */
  private listeners: Array<(msg: any) => void> = [];

  /** Keep-alive timer */
  private keepAliveTimer?: number;

  /** Timer de reconexión */
  private reconnectTimer?: number;

  /** Reintentos para backoff exponencial */
  private reconnectAttempts = 0;

  private readonly baseDelayMs = 1000;
  private readonly maxDelayMs = 30000;
  private readonly pingIntervalMs = 20000;

  /**
   * Conecta al servidor WebSocket remoto.
   *
   * @returns Promise<void> cuando la conexión se abre
   */
  connect(): Promise<void> {
    if (this.isConnected && this.socket?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    this.manuallyClosed = false;

    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(this.WS_URL);

        this.socket.onopen = () => {
          console.log('🟢 WS conectado');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.clearReconnectTimer();
          this.startKeepAlive();
          this.flushQueue();
          resolve();
        };

        this.socket.onmessage = (event) => this.handleMessage(event);

        this.socket.onerror = (err) => {
          console.error('⚠️ Error WS:', err);
        };

        this.socket.onclose = () => {
          console.warn('🔴 WS cerrado');
          this.isConnected = false;
          this.stopKeepAlive();

          if (!this.manuallyClosed) {
            this.scheduleReconnect();
          }
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Envía un mensaje JSON al WebSocket.
   * Si no está conectado, lo encola.
   *
   * @param message Objeto JSON a enviar
   */
  sendMessage(message: any): void {
    if (this.socket?.readyState === WebSocket.OPEN && this.isConnected) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('⌛ WS no abierto, mensaje encolado.');
      this.messageQueue.push(message);
    }
  }

  /**
   * Registra un listener de mensajes entrantes.
   *
   * @param callback Función a ejecutar por mensaje recibido
   * @returns función para desuscribir
   */
  addMessageListener(callback: (message: any) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(fn => fn !== callback);
    };
  }

  /**
   * Define un único listener, reemplazando los anteriores.
   *
   * @param callback Función handler
   */
  onMessage(callback: (message: any) => void): void {
    this.listeners = [callback];
  }

  /**
   * Cierra manualmente la conexión WebSocket.
   */
  close(): void {
    this.manuallyClosed = true;
    this.stopKeepAlive();
    this.clearReconnectTimer();

    try {
      this.socket?.close();
    } catch {}

    this.isConnected = false;
  }

  // -----------------------------------
  // 🔧 Métodos internos
  // -----------------------------------

  /** Envía los mensajes acumulados cuando abre el WS. */
  private flushQueue(): void {
    for (const msg of this.messageQueue) {
      this.socket.send(JSON.stringify(msg));
    }
    this.messageQueue = [];
  }

  /** Procesa mensajes recibidos desde backend. */
  private handleMessage(event: MessageEvent): void {
    const data = this.safeParse(event.data);

    // Ignorar keepalive
    if (data?.type === 'ping' || data?.type === 'pong') return;

    this.listeners.forEach(fn => {
      try {
        fn(data);
      } catch (e) {
        console.error('Error en listener:', e);
      }
    });
  }

  /** Inicia keep-alive ping/pong. */
  private startKeepAlive(): void {
    this.stopKeepAlive();

    this.keepAliveTimer = window.setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'ping', ts: Date.now() }));
      }
    }, this.pingIntervalMs);
  }

  /** Detiene keep-alive. */
  private stopKeepAlive(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = undefined;
    }
  }

  /** Programa reconexión con backoff exponencial + jitter. */
  private scheduleReconnect(): void {
    this.clearReconnectTimer();
    this.reconnectAttempts++;

    const exp = Math.min(this.baseDelayMs * Math.pow(2, this.reconnectAttempts - 1), this.maxDelayMs);
    const jitter = Math.floor(Math.random() * 500);
    const delay = Math.min(exp + jitter, this.maxDelayMs);

    console.log(`↩️ Reintentando WS en ${delay / 1000}s (intento ${this.reconnectAttempts})`);

    this.reconnectTimer = window.setTimeout(() => {
      if (!this.manuallyClosed) {
        this.connect().catch(() => this.scheduleReconnect());
      }
    }, delay);
  }

  /** Cancela reconexión pendiente. */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }

  /** Parse seguro de JSON. */
  private safeParse(raw: any): any {
    try {
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      return raw;
    }
  }
}
