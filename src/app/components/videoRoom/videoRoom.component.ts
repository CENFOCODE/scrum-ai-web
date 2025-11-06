import { Component, OnInit } from '@angular/core';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'videoRoom',
  templateUrl: './videoRoom.component.html',
  styleUrls: ['./videoRoom.component.scss']
})
export class VideoRoomComponent implements OnInit {

  username = `user-${Math.floor(Math.random() * 1000)}`;
  role = '';
  room = '';
  isConnected = false;

  localStream!: MediaStream;
  peerConnections = new Map<string, RTCPeerConnection>();
  remoteStreams = new Map<string, MediaStream>();

  constructor(private socketService: SocketService) {}

  async ngOnInit() {
    this.username = prompt('Ingresa tu nombre de usuario:')?.trim() || this.username;
    await this.connectSocket();
    await this.initLocalVideo();

    // Registrar usuario en el backend
    this.socketService.sendMessage({
      type: 'register-user',
      username: this.username
    });

    console.log(`🧍 Usuario registrado como: ${this.username}`);
  }

  async connectSocket() {
    try {
      await this.socketService.connect();
      this.isConnected = true;
      this.socketService.onMessage((msg) => this.handleSignal(msg));
      console.log('✅ WebSocket conectado correctamente');
    } catch (err) {
      console.error('⚠️ No se pudo conectar al WebSocket:', err);
    }
  }

  /** 🎥 Cámara local */
  async initLocalVideo() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const localVideo = document.getElementById('localVideo') as HTMLVideoElement;
      localVideo.srcObject = this.localStream;
    } catch (err) {
      console.error('🎥 Error al acceder a la cámara:', err);
    }
  }

  /** 🏗️ Crear sala */
  createRoom() {
    if (!this.isConnected) return alert('El servidor no está conectado todavía.');
    this.room = `room-${Math.random().toString(36).substring(2, 8)}`;
    this.role = 'Scrum Master';
    this.socketService.sendMessage({
      type: 'create-room',
      room: this.room,
      host: this.username,
      role: this.role
    });
    alert(`✅ Sala creada: ${this.room}`);
  }

  /** 👋 Unirse a sala */
  joinRoom(manualRoomId?: string) {
    if (!this.isConnected) return alert('El WebSocket aún no está conectado.');

    let roomId = manualRoomId || prompt('Ingresa el ID de la sala (por ejemplo: room-abc123):');
    if (!roomId) return;

    if (roomId.includes('http')) {
      const parts = roomId.split('/');
      roomId = parts[parts.length - 1];
    }

    if (!roomId.startsWith('room-')) {
      alert('⚠️ El ID de la sala debe comenzar con "room-".');
      return;
    }

    this.room = roomId;
    this.role = prompt('Selecciona tu rol (Product Owner, Scrum Master, Developer, Stakeholder)') || 'Invitado';

    this.socketService.sendMessage({
      type: 'join',
      room: this.room,
      user: this.username,
      role: this.role
    });
  }

  /** 💌 Invitar usuario */
  inviteUser() {
    if (!this.room) return alert('Primero crea o únete a una sala.');
    const toUser = prompt('Nombre del usuario a invitar:');
    if (toUser) {
      this.socketService.sendMessage({
        type: 'invite',
        to: toUser,
        from: this.username,
        room: this.room
      });
    }
  }

  /** 🎥 Inicia conexión P2P con un usuario nuevo */
  async startPeerConnection(targetUser: string) {
    const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    const pc = new RTCPeerConnection(config);
    this.peerConnections.set(targetUser, pc);

    // Agregar tracks locales
    this.localStream?.getTracks().forEach(track => pc.addTrack(track, this.localStream));

    // ICE candidates
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

    // Streams remotos
    pc.ontrack = (e) => {
      const stream = e.streams[0];
      this.remoteStreams.set(targetUser, stream);
      this.attachRemoteVideo(targetUser, stream);
    };

    // Crear y enviar offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    this.socketService.sendMessage({
      type: 'offer',
      offer,
      room: this.room,
      from: this.username,
      to: targetUser
    });

    console.log(`📤 Enviada offer a ${targetUser}`);
  }

  /** 🧠 Manejo de mensajes WebSocket */
  async handleSignal(msg: any) {
    switch (msg.type) {
      case 'invite':
        if (msg.to === this.username) {
          const accept = confirm(`${msg.message}. ¿Deseas unirte?`);
          if (accept) this.joinRoom(msg.room);
        }
        break;

      case 'joinSuccess':
        console.log(`✅ ${msg.message}`);
        // Si hay un nuevo usuario, crea conexión
        if (msg.user && msg.user !== this.username) {
          console.log(`👋 ${msg.user} se unió. Creando conexión...`);
          await this.startPeerConnection(msg.user);
        }
        break;

      case 'offer':
        if (msg.to === this.username) {
          console.log(`📡 Offer recibida de ${msg.from}`);
          await this.handleOffer(msg.from, msg.offer);
        }
        break;

      case 'answer':
        if (msg.to === this.username) {
          console.log(`📩 Answer recibida de ${msg.from}`);
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
        alert('📞 Llamada finalizada por el organizador.');
        break;
    }
  }

  /** 🧠 Manejo de Offer -> Answer */
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

    console.log(`✅ Enviada answer a ${fromUser}`);
  }

  /** 🎞️ Agregar video remoto dinámicamente */
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

  /** 🔚 Finalizar llamada */
  endCall() {
    this.socketService.sendMessage({
      type: 'end-call',
      room: this.room
    });
    alert('Llamada finalizada.');
    this.peerConnections.forEach(pc => pc.close());
    this.peerConnections.clear();
  }
}
