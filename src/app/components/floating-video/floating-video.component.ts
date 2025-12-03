import {Component, EventEmitter, inject, Input, OnInit, Output, ViewEncapsulation} from '@angular/core';
import {SocketService} from '../../services/socket.service';
import {CommonModule} from '@angular/common';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {AuthService} from "../../services/auth.service";
import {ActivatedRoute} from "@angular/router";
import {FormsModule} from "@angular/forms";
import {InvitationService} from "../../services/invitation.service";
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import {MatFormField, MatLabel} from "@angular/material/form-field";
import {MatInput} from "@angular/material/input";
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import {ConfirmationService, MessageService} from "primeng/api";
import {UserService} from "../../services/user.service";
import {CallService} from "../../services/call.service";
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-call',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule, DialogModule, ButtonModule, InputTextModule, MatFormField, MatInput, MatLabel, ToastModule, RippleModule, ConfirmDialogModule],
  templateUrl: './floating-video.component.html',
  styleUrls: ['floating-video.component.scss'],
  providers: [MessageService, ConfirmationService],
  encapsulation: ViewEncapsulation.None,
})
export class FloatingVideoComponent implements OnInit {

  @Input() autoJoinRoomId?: string | null;
  @Input() selectedRole?: string;
  @Input() selectedScenario?: string;
  @Output() participantJoined = new EventEmitter<{email: string, role: string}>();
  @Output() participantLeft = new EventEmitter<string>();

  private userService = inject(UserService);
  private authService = inject(AuthService);
  private invitationService = inject(InvitationService);
  private userNamesCache = new Map<string, string>();
  private remoteCameraStates = new Map<string, boolean>();

  videoWidth = 260;
  videoHeight = 160;
  resizing = false;
  micOn = true;
  camOn = true;
  isMinimized = false;

  user = this.authService.getUser();
  username = this.user.email;

  role = '';
  room = '';
  isConnected = false;
  isRoomCreator = false;

  roomToJoin = '';
  emailToInvite = '';

  inviteVisible: boolean = false;
  joinVisible: boolean = false;
  showVideo: boolean = false;

  // Stream local (cámara + micrófono)
  localStream!: MediaStream;

  // Conexiones WebRTC por usuario remoto
  peerConnections = new Map<string, RTCPeerConnection>();

  // Streams remotos por usuario
  remoteStreams = new Map<string, MediaStream>();

  constructor(private socketService: SocketService, private route: ActivatedRoute, private messageService: MessageService, private callService: CallService, private confirmationService: ConfirmationService) {}

  async ngOnInit() {
    this.callService.trigger$.subscribe(async event => {
      switch (event.action) {
        case 'sendInvite':
          this.showInviteDialog();
          break;

        case 'joinCall':
          this.showJoinDialog();
          break;
      }
    });
    console.log(this.selectedScenario);
    await this.connectSocket();
    // await this.initLocalVideo();

    this.socketService.sendMessage({
      type: 'register-user',
      username: this.username
    });

    if (this.autoJoinRoomId) {
      console.log('Intentando auto-join a: ', this.autoJoinRoomId);
      await this.joinRoom(this.autoJoinRoomId);
    }

    window.addEventListener("resize", () => {
      if (this.videoWidth > window.innerWidth - 40)
        this.videoWidth = window.innerWidth - 40;

      if (this.videoHeight > window.innerHeight - 40)
        this.videoHeight = window.innerHeight - 40;
    });
  }

  sendInvitation() {
    if (!this.emailToInvite || !this.emailToInvite.includes('@')) {
      this.messageService.add({
        severity: 'warning',
        detail: 'Por favor ingresa un email válido'
      });
      return;
    }

    // Si aún no se creó la simulación, marcar que habrá usuarios invitados
    // if (!this.simulation?.id) {
    //   this.hasInvitedUsers = true;
    // }

    const roomId = `room-${Date.now()}`;
    const inviterName = this.authService.getUser()?.name || 'Un usuario';
    // const ceremonyType = this.selectedScenario?.ceremonyType || 'Ceremonia Scrum';
    // const scenarioId = this.selectedScenario?.id || 0;

    console.log(roomId);
    console.log(inviterName)

    this.invitationService.sendInvitation(
      this.emailToInvite,
      roomId,
      inviterName,
      // ceremonyType,
      // scenarioId
    ).subscribe({
      next: () => {
        // this.hasInvitedUsers = true; // Marcar que hay invitados
        this.messageService.add({
          severity: 'success',
          detail: `Invitación enviada exitosamente a ${this.emailToInvite}`
        });
        this.emailToInvite = '';
      },
      //       this.messageService.add({severity:'success', summary: 'Éxito', detail: 'Retrospectiva guardada correctamente.'});
      error: (err) => {
        console.error('Error enviando invitación:', err);
        this.messageService.add({
          severity: 'error',
          detail: 'Error al enviar la invitación. Intenta nuevamente.'
        });
      }
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

  async getUserName(email: string): Promise<string> {
    if (this.userNamesCache.has(email)) {
      return this.userNamesCache.get(email)!;
    }

    try {
      const response = await this.userService.getUserByEmail(email).toPromise();
      const fullName = response?.data?.name
        ? `${response.data.name} ${response.data.lastname || ''}`.trim()
        : email;

      this.userNamesCache.set(email, fullName);
      return fullName;
    } catch (error) {
      console.error('Error obteniendo nombre:', error);
      return email;
    }
  }

  getInitials(fullName: string) {
    if (!fullName) return '?';
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  updateVideoLayout() {
    const container = document.getElementById('videoGrid');
    if (!container) return;

    const cells = container.querySelectorAll('.video-cell');
    const count = cells.length;
    const actualCount = count > 0 ? count : container.querySelectorAll('video').length;

    let cols = 1;
    if (actualCount === 1) cols = 1;
    else if (actualCount === 2) cols = 2;
    else if (actualCount <= 4) cols = 2;
    else if (actualCount <= 6) cols = 3;
    else if (actualCount <= 9) cols = 3;
    else cols = 4;

    container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  }

  toggleMic() {
    this.micOn = !this.micOn;
    if (!this.localStream) return;

    this.localStream.getAudioTracks().forEach(track => {
      track.enabled = this.micOn;
    });
  }

  toggleCam() {
    this.camOn = !this.camOn;
    if (!this.localStream) return;

    this.localStream.getVideoTracks().forEach(track => {
      track.enabled = this.camOn;
    });

    const localVideo = document.getElementById('localVideo') as HTMLVideoElement;
    const localCell = localVideo?.closest('.video-cell');

    if (localCell) {
      if (!this.camOn) {
        localCell.classList.add('camera-off');
      } else {
        localCell.classList.remove('camera-off');
      }
    }

    if (this.room) {
      this.socketService.sendMessage({
        type: 'camera-toggle',
        room: this.room,
        user: this.username,
        camOn: this.camOn
      });
    }
  }

  updateRemoteCameraState(user: string, camOn: boolean) {
    this.remoteCameraStates.set(user, camOn);

    const videoElement = document.getElementById(`remote-video-${user}`);
    if (!videoElement) {
      console.log(`⏳ Video de ${user} aún no existe, estado guardado en cache`);
      return;
    }

    const videoCell = videoElement.closest('.video-cell');
    if (!videoCell) return;

    if (camOn) {
      videoCell.classList.remove('camera-off');
    } else {
      videoCell.classList.add('camera-off');
    }
  }

  showInviteDialog() {
    this.inviteVisible = true;
  }

  showJoinDialog(){
    this.joinVisible = true;
  }

  startResize(event: MouseEvent) {
    this.resizing = true;
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = this.videoWidth;
    const startHeight = this.videoHeight;

    const onMouseMove = (e: MouseEvent) => {
      if (!this.resizing) return;
      this.videoWidth = Math.max(160, startWidth + (e.clientX - startX));
      this.videoHeight = Math.max(90, startHeight + (e.clientY - startY));
    };

    const onMouseUp = () => {
      this.resizing = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;

    if (this.isMinimized) {
      this.videoWidth = 180;
      this.videoHeight = 110;
    } else {
      this.videoWidth = 260;
      this.videoHeight = 160;
    }
  }

  async initLocalVideo() {

    try {
      this.showVideo = true;

      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const videoGrid = document.getElementById('videoGrid');
      const videoContainer = document.createElement('div');
      videoContainer.className='video-cell local-video'

      const label = document.createElement('div');
      label.className = 'user-label';
      label.innerText = `${this.user.name} ${this.user.lastname} (tú)`;

      const localVideo = document.createElement('video');
      localVideo.id = 'localVideo';
      localVideo.autoplay = true;
      localVideo.muted = true;
      localVideo.playsInline = true;
      localVideo.srcObject = this.localStream;

      const initials = document.createElement('div');
      initials.className = 'initials-badge';
      initials.innerText = this.getInitials(`${this.user.name} ${this.user.lastname}`);

      videoContainer.appendChild(initials);
      videoContainer.appendChild(label);
      videoContainer.appendChild(localVideo)
      videoGrid?.appendChild(videoContainer)

      this.updateVideoLayout();
    } catch (err) {
      console.error('Error al acceder a la cámara/micrófono:', err);
    }
  }

  async joinRoomById() {
    if (!this.roomToJoin || !this.roomToJoin.trim()) {
      this.messageService.add({
        severity: 'info',
        summary: 'Atención',
        detail: 'Por favor ingresa un ID de sala'
      })
      return;
    }

    await this.joinRoom(this.roomToJoin.trim());
    this.roomToJoin = '';
    this.joinVisible = false;
  }

  async inviteByEmail() {
    if (!this.emailToInvite || !this.emailToInvite.includes('@')) {
      this.messageService.add({
        severity: 'contrast',
        summary: 'Atención',
        detail: 'Ingrese un email válido'
      })
      return;
    }

    if (!this.room) {
      await this.createRoom()
      this.inviteVisible = false;
      return;
    }

    const inviterName = this.authService.getUser()?.name || 'Un usuario';

    // this.invitationService.sendInvitation(
    //   this.emailToInvite,
    //   this.room,
    //   inviterName,
    // ).subscribe({
    //   next: () => {
    //     this.messageService.add({
    //       severity: 'success',
    //       summary: 'Éxito',
    //       detail: `Invitación enviada a ${this.emailToInvite}`
    //     })
    //     this.emailToInvite = '';
    //     this.inviteVisible = false;
    //     this.showVideo = true;
    //   },
    //   error: (err) => {
    //     console.error('Error:', err);
    //     this.messageService.add({
    //       severity: 'error',
    //       summary: 'Error',
    //       detail: 'Error al enviar invitación'
    //     })
    //   }
    // });
    this.sendInvitation();
  }

  async createRoom() {
    if (!this.isConnected) return this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'El servidor no está conectado.',
      sticky: true
    });

    await this.initLocalVideo()

    this.room = `room-${Math.random().toString(36).substring(2, 8)}`;
    this.role = 'Scrum Master';
    this.isRoomCreator = true;

    this.callService.sendRoomId(this.room);
    this.callService.isCreatorRoom(this.isRoomCreator)

    this.socketService.sendMessage({
      type: 'create-room',
      room: this.room,
      host: this.username,
      role: this.role
    });

    this.messageService.add({
      severity: 'contrast',
      summary: 'Sala creada',
      detail: `Id de la sala: ${this.room}`,
    });

  }

  async joinRoom(manualRoomId?: string) {
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

    // if (!this.selectedRole) {
    //   this.role = this.selectedRole || prompt('Selecciona tu rol:') || 'Invitado';
    // }

    await this.initLocalVideo();
    this.isRoomCreator = false;

    this.socketService.sendMessage({
      type: 'join',
      room: this.room,
      user: this.username,
      role: this.role,
      camOn: this.camOn
    });
  }

  async startPeerConnection(targetUser: string) {
    const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

    const pc = new RTCPeerConnection(config);
    this.peerConnections.set(targetUser, pc);

    this.localStream.getTracks().forEach(track => {
      const exists = pc.getSenders().find(s => s.track === track);
      if (!exists) pc.addTrack(track, this.localStream);
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
          if (accept) await this.joinRoom(msg.room);
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

      case 'camera-toggle':
        if (msg.user && msg.user !== this.username) {
          this.updateRemoteCameraState(msg.user, msg.camOn);
        }
        break;

      case 'endCall':
        this.cleanupAndReset();
        break;

      case 'user-left':
        if (msg.user && msg.user !== this.username) {
          console.log(`${msg.user} salió de la sala`);

          const videoElement = document.getElementById(`remote-video-${msg.user}`);
          if (videoElement) {
            const cellToRemove = videoElement.closest('.video-cell');
            if (cellToRemove) {
              cellToRemove.remove();
            }
          }

          const pc = this.peerConnections.get(msg.user);
          if (pc) {
            pc.close();
            this.peerConnections.delete(msg.user);
          }

          this.remoteStreams.delete(msg.user);
          this.updateVideoLayout();
        }
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

  async attachRemoteAV(user: string, stream: MediaStream) {
    const userName = await this.getUserName(user);

    let video = document.getElementById(`remote-video-${user}`) as HTMLVideoElement;
    if (!video) {
      const videoGrid = document.getElementById('videoGrid');
      if (!videoGrid) return;

      const videoContainer = document.createElement('div');
      videoContainer.className='video-cell'

      const initialCamState = this.remoteCameraStates.get(user);
      if (initialCamState === false) {
        videoContainer.classList.add('camera-off');
        console.log(`✅ Aplicando estado de cámara apagada para ${user}`);
      }

      const label = document.createElement('div');
      label.className = 'user-label';
      label.innerText = userName;

      video = document.createElement('video');
      video.id = `remote-video-${user}`;
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      video.srcObject = stream;

      const audio = document.createElement('audio');
      audio.id = `remote-audio-${user}`;
      audio.autoplay = true;
      audio.srcObject = stream;

      const initials = document.createElement('div');
      initials.className = 'initials-badge';
      initials.innerText = this.getInitials(userName);
      videoContainer.appendChild(initials);

      videoContainer.appendChild(label);
      videoContainer.appendChild(video);
      videoContainer.appendChild(audio);
      videoGrid.appendChild(videoContainer);

    } else {
      video.srcObject = stream;
      const audio = document.getElementById(`remote-audio-${user}`) as HTMLAudioElement;
      if (audio) audio.srcObject = stream;
    }
    this.updateVideoLayout();
  }

  private cleanupAndReset() {
    this.showVideo = false;
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }

    this.peerConnections.forEach(pc => pc.close());
    this.peerConnections.clear();

    this.remoteStreams.clear();

    const videoGrid = document.getElementById('videoGrid');
    if (videoGrid) {
      const remoteCells = videoGrid.querySelectorAll('.video-cell');
      remoteCells.forEach(cell => cell.remove());
    }

    this.room = '';
    this.role = '';
    this.isRoomCreator = false;
  }

  confirmLeaveCall(event: Event){
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: '¿Estás seguro de que quieres salir de la llamada?',
      header: 'Salir de la llamada',
      icon: 'pi pi-exclamation-triangle',
      acceptIcon:"none",
      rejectIcon:"none",
      rejectButtonStyleClass:"p-button-text",
      accept: () => {
        this.messageService.add({ severity: 'info', summary: 'Videollamada terminada', detail: 'Haz salido de la llamada' });
        this.leaveCall();
      },
      reject: () => {
      }
    });
  }

  confirmEndCall(event: Event){
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: '¿Finalizar la llamada para todos los participantes?',
      header: 'Finalizar llamada',
      acceptIcon:"none",
      rejectIcon:"none",
      rejectButtonStyleClass:"p-button-text",
      accept: () => {
        this.messageService.add({ severity: 'info', summary: 'Videollamada finalizada', detail: 'Haz finalizado la llamada a todos los participantes' });
        this.endCall();
      },
      reject: () => {
      }
    });
  }

  leaveCall() {
    if (!this.room) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sala no encontrada',
        detail: 'No estas en ninguna sala'
      });
      return;
    }

    this.socketService.sendMessage({
      type: 'leave-room',
      room: this.room,
      user: this.username
    });

    this.cleanupAndReset();

  }

  endCall() {
    if (!this.isRoomCreator) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Acción no permitida',
        detail: 'Solo el creador puede finalizar la llamada para todos'
      });
      return;
    }

    this.socketService.sendMessage({
      type: 'end-call',
      room: this.room
    });

    this.cleanupAndReset();
    this.callService.resetCallState();
  }
}