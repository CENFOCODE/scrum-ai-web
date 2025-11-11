import { Component, OnInit } from '@angular/core';
import { SocketService } from '../../services/socket.service';

/**
 * Componente principal encargado de gestionar las videollamadas grupales WebRTC.
 *
 * FUNCIONES PRINCIPALES
 * ---------------------
 * - Obtiene el stream local (cámara + micrófono).
 * - Maneja salas WebRTC (crear / unirse).
 * - Se comunica con el backend mediante WebSocket.
 * - Envía y recibe señales WebRTC (offer, answer, ice).
 * - Genera dinámicamente los videos remotos en pantalla.
 *
 * QUÉ PUEDE EDITAR EL EQUIPO
 * --------------------------
 * ✅ UI, diseño, modales, roles, pantallas adicionales  
 * ✅ Chat, mute, compartir pantalla, indicadores, overlays  
 * ❌ LÓGICA INTERNA DE NEGOCIACIÓN WEBRTC (ya probada y estable)
 *
 * ARCHIVOS RELACIONADOS
 * ----------------------
 * - socket.service.ts → Canal WebSocket
 * - WebSocketHandler.java → Router de señalización WebRTC
 * - GroqService (no se usa aquí, solo en ceremonias)
 */
@Component({
  selector: 'videoRoom',
  templateUrl: './videoRoom.component.html',
  styleUrls: ['./videoRoom.component.scss']
})
export class VideoRoomComponent implements OnInit {

  /** Identificador único para cada usuario */
  username = `user-${Math.floor(Math.random() * 1000)}`;

  /** Rol dentro de la sala (Scrum Master, PO, Dev, etc.) */
  role = '';

  /** ID de la sala WebRTC */
  room = '';

  /** Indica si la conexión WebSocket está activa */
  isConnected = false;

  /** Stream local del usuario */
  localStream!: MediaStream;

  /** Mapa de conexiones WebRTC por usuario */
  peerConnections = new Map<string, RTCPeerConnection>();

  /** Streams remotos recibidos */
  remoteStreams = new Map<string, MediaStream>();

  constructor(private socketService: SocketService) {}

  /**
   * Inicializa el componente:
   * - Solicita username
   * - Conecta al WebSocket
   * - Activa la cámara
   * - Registra al usuario en el backend
   */
  async ngOnInit() {
    this.username = prompt('Ingresa tu nombre de usuario:')?.trim() || this.username;
    await this.connectSocket();
    await this.initLocalVideo();

    this.socketService.sendMessage({
      type: 'register-user',
      username: this.username
    });
  }

  /**
   * Conecta al servidor WebSocket y registra el manejador de mensajes.
   */
  async connectSocket() {
    try {
      await this.socketService.connect();
      this.isConnected = true;
      this.socketService.onMessage((msg) => this.handleSignal(msg));
    } catch (err) {
      console.error('No se pudo conectar al WebSocket:', err);
    }
  }

  /**
   * Activa cámara y micrófono, y los asigna al video local.
   */
  async initLocalVideo() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const localVideo = document.getElementById('localVideo') as HTMLVideoElement;
      localVideo.srcObject = this.localStream;
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
    }
  }

  /**
   * Crea una nueva sala WebRTC (ID automático).
   */
  createRoom() {
    if (!this.isConnected) return alert('El servidor no está conectado.');

    this.room = `room-${Math.random().toString(36).substring(2, 8)}`;
    this.role = 'Scrum Master';

    this.socketService.sendMessage({
      type: 'create-room',
      room: this.room,
      host: this.username,
      role: this.role
    });

    alert(`Sala creada: ${this.room}`);
  }

  /**
   * Permite unirse a una sala existente ingresando el ID manualmente.
   */
  joinRoom(manualRoomId?: string) {
    if (!this.isConnected) return alert('El WebSocket no está conectado.');

    let roomId = manualRoomId || prompt('ID de la sala:');
    if (!roomId) return;

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
  }

  /**
   * Invita a otro usuario ya registrado en el WebSocket.
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
   * Crea una conexión WebRTC P2P hacia otro usuario.
   *
   * @param targetUser usuario al que se le enviará una offer
   */
  async startPeerConnection(targetUser: string) {
    const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    const pc = new RTCPeerConnection(config);
    this.peerConnections.set(targetUser, pc);

    this.localStream?.getTracks().forEach(track => pc.addTrack(track, this.localStream));

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

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      this.remoteStreams.set(targetUser, stream);
      this.attachRemoteVideo(targetUser, stream);
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    this.socketService.sendMessage({
      type: 'offer',
      offer,
      room: this.room,
      from: this.username,
      to: targetUser
    });
  }

  /**
   * Maneja señales recibidas desde el WebSocket.
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
        if (msg.user && msg.user !== this.username) {
          await this.startPeerConnection(msg.user);
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
   * Responde a una offer creando una answer.
   */
  async handleOffer(fromUser: string, offer: RTCSessionDescriptionInit) {
    const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    const pc = new RTCPeerConnection(config);
    this.peerConnections.set(fromUser, pc);

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

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      this.remoteStreams.set(fromUser, stream);
      this.attachRemoteVideo(fromUser, stream);
    };

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    this.localStream?.getTracks().forEach(t => pc.addTrack(t, this.localStream));

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
   * Crea un elemento de video en el DOM para mostrar un stream remoto.
   */
  attachRemoteVideo(user: string, stream: MediaStream) {
    let video = document.getElementById(`remote-${user}`) as HTMLVideoElement;

    if (!video) {
      const container = document.getElementById('remoteContainer');
      const wrapper = document.createElement('div');
      const label = document.createElement('p');

      label.innerText = user;
      label.className = 'text-sm text-center';

      video = document.createElement('video');
      video.id = `remote-${user}`;
      video.autoplay = true;
      video.playsInline = true;
      video.width = 240;
      video.height = 180;
      video.srcObject = stream;

      wrapper.appendChild(label);
      wrapper.appendChild(video);
      container?.appendChild(wrapper);
    } else {
      video.srcObject = stream;
    }
  }

  /**
   * Finaliza la llamada grupal y cierra todas las conexiones.
   */
  endCall() {
    this.socketService.sendMessage({
      type: 'end-call',
      room: this.room
    });

    this.peerConnections.forEach(pc => pc.close());
    this.peerConnections.clear();

    alert('Llamada finalizada.');
  }
}
