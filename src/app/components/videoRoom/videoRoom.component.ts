import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { SocketService } from '../../services/socket.service';
import { CommonModule } from '@angular/common';
import { TranscriptStateService } from '../../services/transcript-state.service';
import { TranscriptService } from '../../services/transcript.service';
import { AuthService } from '../../services/auth.service';
import { AiService } from '../../services/ai.service';
import { ChatbotComponent } from '../chatbot/chatbot.component';


@Component({
  selector: 'videoRoom',
  standalone: true,
  imports: [CommonModule, ChatbotComponent],
  templateUrl: './videoRoom.component.html',
  styleUrls: ['./videoRoom.component.scss']
})
export class VideoRoomComponent implements OnInit {

  @ViewChild(ChatbotComponent) chatbot!: ChatbotComponent;
  // Nombre aleatorio por si el usuario no ingresa uno
  username = `user-${Math.floor(Math.random() * 1000)}`;

  role = '';
  room = '';
  isConnected = false;

  
  isTranscribing = false;
  private transcriptionInterval?: any;
  private aiAnalysisInterval?: any;


  ceremonySessionId = 0;
  userId = 0;
  // Stream local (cámara + micrófono)
  localStream!: MediaStream;

  // Conexiones WebRTC por usuario remoto
  peerConnections = new Map<string, RTCPeerConnection>();

  // Streams remotos por usuario
  remoteStreams = new Map<string, MediaStream>();

  constructor(
    private socketService: SocketService,
    private transcriptionService: TranscriptService,
    private transcriptState: TranscriptStateService,
    private authService: AuthService,
    private aiService: AiService,
    private router: Router
  ) {}

  async ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state;
    
    if (state && state['ceremonySessionId']) {
      this.ceremonySessionId = state['ceremonySessionId'];
    }else {
   
      const storedId = localStorage.getItem('ceremonySessionId');
      if (storedId) {
        this.ceremonySessionId = parseInt(storedId, 10);
      }
    }
    // Pregunta el username al entrar
    this.username = prompt('Ingresa tu nombre de usuario:')?.trim() || this.username;

    // Conecta al WebSocket
    await this.connectSocket();

    // Habilita cámara y micrófono
    await this.initLocalVideo();

    // Registra este usuario en el backend
    this.socketService.sendMessage({
      type: 'register-user',
      username: this.username
    });
    this.userId = this.authService.getUserId() || 0;

  }

  /**
   * Establece conexión WebSocket y registra el listener de mensajes.
   */
  async connectSocket() {
    try {
      await this.socketService.connect();
      this.isConnected = true;

      // Cada mensaje entrante del backend llega a handleSignal(...)
      this.socketService.onMessage((msg) => this.handleSignal(msg));

    } catch (err) {
      console.error('No se pudo conectar al WebSocket:', err);
    }
  }

  /**
   * Inicializa la cámara y micrófono SIN eco.
   *    IMPORTANTE: echoCancellation elimina la retroalimentación.
   */
  async initLocalVideo() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: {
          echoCancellation: true,   //  evita que el micrófono escuche tus bocinas
          noiseSuppression: true,   // reduce ruido ambiental
          autoGainControl: true     // estabiliza volumen
        }
      });

      // Muestra video local en pantalla
      const localVideo = document.getElementById('localVideo') as HTMLVideoElement;
      localVideo.srcObject = this.localStream;

      // El video local SIEMPRE debe estar muteado para evitar eco.
      localVideo.muted = true;
      localVideo.volume = 0;

    } catch (err) {
      console.error('Error al acceder a la cámara/micrófono:', err);
    }
  }

  /**
   * Crea una nueva sala con un ID único.
   */
  createRoom() {
    if (!this.isConnected) return alert('El servidor no está conectado.');

    this.room = `room-${Math.random().toString(36).substring(2, 8)}`;
    this.role = 'Scrum Master';

    this.socketService.sendMessage({
      type: 'create-room',
      room: this.room,
      host: this.username,
      role: this.role,
      ceremonySessionId: this.ceremonySessionId
    });

    alert(`Sala creada: ${this.room}`);

    setTimeout(() => {
    if (!this.isTranscribing && this.localStream) {
      this.startTranscription();
    }
  }, 1000);
  }

  /**
   * Se une a una sala existente.
   */
  joinRoom(manualRoomId?: string) {
    if (!this.isConnected) return alert('El WebSocket no está conectado.');

    let roomId = manualRoomId || prompt('ID de la sala:');
    if (!roomId) return;

    // Si el usuario pega una URL completa, extraemos solo el ID
    if (roomId.includes('http')) {
      const parts = roomId.split('/');
      roomId = parts[parts.length - 1];
    }

    if (!roomId.startsWith('room-')) {
      alert('El ID debe iniciar con "room-".');
      return;
    }

    this.room = roomId;
    this.role = prompt('Selecciona tu rol:') || 'Invitado';

    this.socketService.sendMessage({
      type: 'join',
      room: this.room,
      user: this.username,
      role: this.role
    });

  setTimeout(() => {
    if (!this.isTranscribing && this.localStream) {
      this.startTranscription();
    }
  }, 1500);
  }

  /**
   * Envía invitación a otro usuario ya registrado.
   */
  inviteUser() {
    if (!this.room) return alert('Primero crea o únete a una sala.');

    const toUser = prompt('Usuario a invitar:');
    if (toUser) {
      this.socketService.sendMessage({
        type: 'invite',
        to: toUser,
        from: this.username,
        room: this.room
      });
    }
  }

  /**
   * Prepara la conexión WebRTC hacia otro usuario.
   *    SOLUCIÓN: se evita duplicar pistas, lo cual causaba eco.
   */
  async startPeerConnection(targetUser: string) {
    const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    
    const pc = new RTCPeerConnection(config);
    this.peerConnections.set(targetUser, pc);

    /**
     * Antes agregabas tus pistas dos veces (startPeerConnection + handleOffer)
     * Lo cual enviaba **dos audios** → eco asegurado.
     * 
     * Esta validación evita duplicados.
     */
    this.localStream.getTracks().forEach(track => {
      const exists = pc.getSenders().find(s => s.track === track);
      if (!exists) pc.addTrack(track, this.localStream);
    });

    // Enviamos candidatos ICE al peer
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        this.socketService.sendMessage({
          type: 'ice',
          candidate: e.candidate,
          room: this.room,
          from: this.username,
          to: targetUser
        });
      }
    };

    /**
     * Recibimos stream remoto.
     *    Lo enviamos a attachRemoteAV(), que separa audio y video.
     */
    pc.ontrack = (e) => {
      const stream = e.streams[0];
      this.remoteStreams.set(targetUser, stream);
      this.attachRemoteAV(targetUser, stream);
    };

    // Creamos la oferta WebRTC
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Enviamos la offer al otro usuario
    this.socketService.sendMessage({
      type: 'offer',
      offer,
      room: this.room,
      from: this.username,
      to: targetUser
    });
  }

  /**
   * Router principal de señales WebRTC
   */
  async handleSignal(msg: any) {
    switch (msg.type) {

      case 'invite':
        if (msg.to === this.username) {
          const accept = confirm(`${msg.message}. ¿Unirte?`);
          if (accept) this.joinRoom(msg.room);
        }
        break;

      case 'joinSuccess':
        // Alguien nuevo entró → creamos conexión hacia él
        if (msg.user && msg.user !== this.username) {
          await this.startPeerConnection(msg.user);
        }

        if (msg.ceremonySessionId) {
        this.ceremonySessionId = msg.ceremonySessionId;
       
        }
        break;

        case 'transcript':
        if (msg.username !== this.username) {  
          this.transcriptState.addTranscript(msg.username, msg.text, msg.userId);
        }
        break;

      case 'offer':
        if (msg.to === this.username) {
          await this.handleOffer(msg.from, msg.offer);
        }
        break;

      case 'answer':
        if (msg.to === this.username) {
          await this.peerConnections.get(msg.from)
            ?.setRemoteDescription(new RTCSessionDescription(msg.answer));
        }
        break;

      case 'ice':
        if (msg.to === this.username && msg.candidate) {
          await this.peerConnections.get(msg.from)
            ?.addIceCandidate(new RTCIceCandidate(msg.candidate));
        }
        break;

      case 'endCall':
        alert('Llamada finalizada.');
        break;
    }
  }

  /**
   * Procesa una offer entrante y crea una answer.
   */
  async handleOffer(fromUser: string, offer: RTCSessionDescriptionInit) {
    const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

    const pc = new RTCPeerConnection(config);
    this.peerConnections.set(fromUser, pc);

    // Enviamos ICE al peer
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        this.socketService.sendMessage({
          type: 'ice',
          candidate: e.candidate,
          room: this.room,
          from: this.username,
          to: fromUser
        });
      }
    };

    // Recibimos stream remoto
    pc.ontrack = (e) => {
      const stream = e.streams[0];
      this.remoteStreams.set(fromUser, stream);
      this.attachRemoteAV(fromUser, stream);
    };

    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    this.localStream.getTracks().forEach(track => {
      const exists = pc.getSenders().find(s => s.track === track);
      if (!exists) pc.addTrack(track, this.localStream);
    });

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    this.socketService.sendMessage({
      type: 'answer',
      answer,
      room: this.room,
      from: this.username,
      to: fromUser
    });
  }

  /**
   * Separa AUDIO y VIDEO del stream remoto.
   * Esto elimina por completo el eco y la mezcla incorrecta.
   */
  attachRemoteAV(user: string, stream: MediaStream) {

    // VIDEO
    let video = document.getElementById(`remote-video-${user}`) as HTMLVideoElement;

    if (!video) {
      const container = document.getElementById('remoteContainer');
      const wrapper = document.createElement('div');

      const label = document.createElement('p');
      label.innerText = user;
      label.className = 'text-sm text-center';

      // VIDEO sin audio
      video = document.createElement('video');
      video.id = `remote-video-${user}`;
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;      // ✅ CLAVE: evita mezcla de audio del elemento <video>
      video.srcObject = stream;
      video.width = 240;
      video.height = 180;

      // AUDIO separado
      let audio = document.createElement('audio');
      audio.id = `remote-audio-${user}`;
      audio.autoplay = true;
      audio.srcObject = stream; // audio limpio sin mezclar


      wrapper.appendChild(label);
      wrapper.appendChild(video);
      wrapper.appendChild(audio);
      container?.appendChild(wrapper);

    } else {
      video.srcObject = stream;
      const audio = document.getElementById(`remote-audio-${user}`) as HTMLAudioElement;
      if (audio) audio.srcObject = stream;
    }
  }

async startTranscription() {
  if (this.isTranscribing) {
    return;
  }

  if (!this.localStream) {
    alert('Primero activa tu micrófono');
    return;
  }

  this.isTranscribing = true;

 
  this.captureAndTranscribeChunk();


  this.transcriptionInterval = setInterval(() => {
    this.captureAndTranscribeChunk();
  }, 8000);


  this.aiAnalysisInterval = setInterval(() => {
    this.analyzeConversationWithAI();
  }, 30000);
}


private captureAndTranscribeChunk() {
  if (!this.localStream || !this.isTranscribing) {
    return;
  }

  try {
    const audioStream = new MediaStream(this.localStream.getAudioTracks());
    
    const recorder = new MediaRecorder(audioStream, {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 128000
    });

    const audioChunks: Blob[] = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      if (audioChunks.length > 0) {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
        
    
        if (audioBlob.size > 1000) {
          this.transcribeChunk(audioBlob);
        }
      }
    };

    recorder.start();
    
    setTimeout(() => {
      if (recorder.state === 'recording') {
        recorder.stop();
      }
    }, 10000);

  } catch (err) {

  }
}

private analyzeConversationWithAI() {
  const formattedTranscript = this.transcriptState.getFormattedTranscript();

  if (formattedTranscript.length === 0) {
    return;
  }

  const prompt = `Eres un Scrum Master virtual. Analiza esta conversación del equipo durante la ceremonia y proporciona feedback breve y constructivo (máximo 3 puntos):

--- Conversación del equipo ---
${formattedTranscript}

Proporciona:
1. ¿Qué está yendo bien?
2. ¿Qué se puede mejorar?
3. Una sugerencia específica para el equipo.

Sé específico con los nombres de los participantes.`;

  this.aiService.askAI({ prompt }).subscribe({
    next: (response) => {
      const answer = response?.data?.answer;

      if (this.chatbot && answer) {
        this.chatbot.addAIMessage('Análisis Automático', answer);
      }
    },
    error: (err) => {
      // Error silencioso o manejador global
    }
  });
}

private isDuplicateText(newText: string): boolean {
  const recentTranscripts = this.transcriptState.getFormattedTranscript();
  const lastChars = recentTranscripts.slice(-200);
  
  return lastChars.includes(newText.trim());
}

/**
 * Transcribe un chunk de audio y lo guarda en el estado compartido
 */
private transcribeChunk(audioBlob: Blob) {
  const reader = new FileReader();

  reader.onloadend = () => {
    const base64Audio = (reader.result as string).split(',')[1];

    this.transcriptionService.transcribeChunkOnly(base64Audio).subscribe({
      next: (response) => {
        const text = response.data;

        if (text && text.trim().length > 0) {
          if (!this.isDuplicateText(text)) {
            this.transcriptState.addTranscript(this.username, text, this.userId);

            this.socketService.sendMessage({
              type: 'transcript',
              username: this.username,
              userId: this.userId,
              text: text,
              timestamp: new Date().toISOString(),
              room: this.room
            });
          }
        }
      },
      error: (err) => {
        // Error silencioso o manejador global
      }
    });
  };

  reader.readAsDataURL(audioBlob);
}

endCall() {
  this.socketService.sendMessage({
    type: 'end-call',
    room: this.room
  });

  this.peerConnections.forEach(pc => pc.close());
  this.peerConnections.clear();

  if (this.transcriptionInterval) {
    clearInterval(this.transcriptionInterval);
    this.transcriptionInterval = undefined;
  }

  if (this.aiAnalysisInterval) {
    clearInterval(this.aiAnalysisInterval);
    this.aiAnalysisInterval = undefined;
  }

  if (this.isTranscribing) {
    this.isTranscribing = false;

    const allTranscripts = this.transcriptState.getAllTranscripts();

    if (allTranscripts.length > 0) {
      const transcriptsFormatted = allTranscripts.map(t => ({
        username: t.username,
        text: t.text,
        userId: t.userId,
        timestamp: t.timestamp.toISOString()
      }));

      this.transcriptionService.saveBatchTranscripts({
        ceremonySessionId: this.ceremonySessionId,
        roomId: this.room,
        transcripts: transcriptsFormatted
      }).subscribe({
        next: () => {
          this.transcriptState.clearTranscripts();
          localStorage.removeItem('ceremonySessionId');
        },
        error: (err) => {

        }
      });
    } else {
      localStorage.removeItem('ceremonySessionId');
    }
  }
}
}