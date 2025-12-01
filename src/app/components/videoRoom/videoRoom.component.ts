import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { SocketService } from '../../services/socket.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'videoRoom',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './videoRoom.component.html',
  styleUrls: ['./videoRoom.component.scss']
})
export class VideoRoomComponent implements OnInit {

  // 👉 NUEVO: info que le vamos a poder pasar al padre (Daily, etc.)
  @Output() ceremonyInfo = new EventEmitter<{
    activeRoles: string[];
    userRole: string;
    room: string;
  }>();

  username = `user-${Math.floor(Math.random() * 1000)}`;
  role = '';
  room = '';
  isConnected = false;

  // 👉 NUEVO: lista de roles activos que conocemos desde este front
  activeRoles: string[] = [];

  localStream!: MediaStream;
  peerConnections = new Map<string, RTCPeerConnection>();
  remoteStreams = new Map<string, MediaStream>();

  constructor(private socketService: SocketService) {}

  // async ngOnInit() {
  //   this.username = prompt('Ingresa tu nombre de usuario:')?.trim() || this.username;

  //   await this.connectSocket();
  //   await this.initLocalVideo();

  //   this.socketService.sendMessage({
  //     type: 'register-user',
  //     username: this.username
  //   });
  // }

  async ngOnInit() {
  this.username = prompt('Ingresa tu nombre de usuario:')?.trim() || this.username;

  // await this.connectSocket();   // 🔴 DESACTIVADO PARA PRUEBAS SIN WS
  // await this.initLocalVideo();  // 🔴 DESACTIVADO PARA PRUEBA SOLO DEL DAILY CHAT
}


  // 👉 NUEVO: centralizamos la emisión de datos de ceremonia
  private updateCeremonyInfo() {
    if (!this.role) return;

    if (!this.activeRoles.includes(this.role)) {
      this.activeRoles.push(this.role);
    }

    this.ceremonyInfo.emit({
      activeRoles: this.activeRoles,
      userRole: this.role,
      room: this.room
    });
  }

  async connectSocket() {
    try {
      await this.socketService.connect();
      this.isConnected = true;

      this.socketService.onMessage((msg) => this.handleSignal(msg));
    } catch (err) {
      console.error('No se pudo conectar al WebSocket:', err);
    }
  }

  async initLocalVideo() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const localVideo = document.getElementById('localVideo') as HTMLVideoElement;
      localVideo.srcObject = this.localStream;
      localVideo.muted = true;

    } catch (err) {
      console.error('Error al acceder a la cámara/micrófono:', err);
    }
  }

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

    this.updateCeremonyInfo();
    alert(`Sala creada: ${this.room}`);
  }

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

    this.updateCeremonyInfo();
  }

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

  async startPeerConnection(targetUser: string) {
    const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    const pc = new RTCPeerConnection(config);
    this.peerConnections.set(targetUser, pc);

    this.localStream.getTracks().forEach(track => {
      if (!pc.getSenders().find(s => s.track === track)) {
        pc.addTrack(track, this.localStream);
      }
    });

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
      this.attachRemoteAV(targetUser, stream);
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

        if (msg.role && !this.activeRoles.includes(msg.role)) {
          this.activeRoles.push(msg.role);
          this.updateCeremonyInfo();
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
      this.attachRemoteAV(fromUser, stream);
    };

    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    this.localStream.getTracks().forEach(track => {
      if (!pc.getSenders().find(s => s.track === track)) {
        pc.addTrack(track, this.localStream);
      }
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

  attachRemoteAV(user: string, stream: MediaStream) {
    let video = document.getElementById(`remote-video-${user}`) as HTMLVideoElement;

    if (!video) {
      const container = document.getElementById('remoteContainer');
      const wrapper = document.createElement('div');

      const label = document.createElement('p');
      label.innerText = user;
      label.className = 'text-sm text-center';

      video = document.createElement('video');
      video.id = `remote-video-${user}`;
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      video.srcObject = stream;
      video.width = 240;

      let audio = document.createElement('audio');
      audio.id = `remote-audio-${user}`;
      audio.autoplay = true;
      audio.srcObject = stream;

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
