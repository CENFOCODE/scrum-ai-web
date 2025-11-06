import { Injectable } from '@angular/core';

/**
 * ✅ Servicio WebSocket para Scrum AI
 * Soporta:
 * - Reconexión automática con backoff exponencial.
 * - Keep-alive (ping/pong cada 20s).
 * - Cola de mensajes en espera mientras abre.
 * - Múltiples listeners (suscripciones).
 * - Cierre manual seguro.
 */
@Injectable({ providedIn: 'root' })
export class SocketService {
  /** 🧠 Cambia esta URL por la del túnel ngrok del backend */
  private readonly WS_URL = 'wss://frore-paz-comprehensibly.ngrok-free.dev/webrtc';

  private socket!: WebSocket;
  private isConnected = false;
  private manuallyClosed = false;

  /** Cola de mensajes en espera */
  private messageQueue: any[] = [];

  /** Suscriptores a mensajes entrantes */
  private listeners: Array<(msg: any) => void> = [];

  /** Timers */
  private keepAliveTimer?: number;
  private reconnectTimer?: number;

  /** Parámetros de reconexión */
  private reconnectAttempts = 0;
  private readonly baseDelayMs = 1000;     // 1s
  private readonly maxDelayMs = 30000;     // 30s
  private readonly pingIntervalMs = 20000; // 20s

  /**
   * 🔌 Conecta al servidor WebSocket
   * - Devuelve una Promise que se resuelve cuando se abre la conexión.
   * - Maneja reconexión automática si se pierde.
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

          // Enviar los mensajes pendientes
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
   * 📤 Envía un mensaje JSON. Si aún no está conectado, lo encola.
   */
  sendMessage(message: any): void {
    if (this.socket?.readyState === WebSocket.OPEN && this.isConnected) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('⌛ WS no abierto, encolando mensaje.');
      this.messageQueue.push(message);
    }
  }

  /**
   * 📥 Registra un listener para mensajes entrantes.
   * Devuelve una función para desuscribirse.
   */
  addMessageListener(callback: (message: any) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(fn => fn !== callback);
    };
  }

  /**
   * (Compat) Define un único listener (reemplaza los anteriores).
   */
  onMessage(callback: (message: any) => void): void {
    this.listeners = [callback];
  }

  /**
   * 🛑 Cierra manualmente el socket (sin reconexión).
   */
  close(): void {
    this.manuallyClosed = true;
    this.stopKeepAlive();
    this.clearReconnectTimer();
    try { this.socket?.close(); } catch {}
    this.isConnected = false;
  }

  // -----------------------------------------------------
  // 🔧 Métodos internos
  // -----------------------------------------------------

  private flushQueue(): void {
    for (const msg of this.messageQueue) {
      this.socket.send(JSON.stringify(msg));
    }
    this.messageQueue = [];
  }

  private handleMessage(event: MessageEvent): void {
    const data = this.safeParse(event.data);
    if (data?.type === 'pong' || data?.type === 'ping') return;
    this.listeners.forEach(fn => {
      try { fn(data); } catch (e) { console.error('Listener error:', e); }
    });
  }

  private startKeepAlive(): void {
    this.stopKeepAlive();
    this.keepAliveTimer = window.setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'ping', ts: Date.now() }));
        // console.log('📡 ping');
      }
    }, this.pingIntervalMs);
  }

  private stopKeepAlive(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = undefined;
    }
  }

  private scheduleReconnect(): void {
    this.clearReconnectTimer();
    this.reconnectAttempts += 1;

    const exp = Math.min(this.baseDelayMs * Math.pow(2, this.reconnectAttempts - 1), this.maxDelayMs);
    const jitter = Math.floor(Math.random() * 500);
    const delay = Math.min(exp + jitter, this.maxDelayMs);

    console.log(`↩️ Reintentando WS en ${Math.round(delay / 1000)}s (intento ${this.reconnectAttempts})`);

    this.reconnectTimer = window.setTimeout(() => {
      if (!this.manuallyClosed) {
        this.connect().catch(() => this.scheduleReconnect());
      }
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }

  private safeParse(raw: any): any {
    try {
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      return raw;
    }
  }
  
}
