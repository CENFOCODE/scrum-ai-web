import { Component, Input, Output, EventEmitter, inject, signal, effect, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { SimulationService } from '../../../services/simulation.service';
import { IScenario, IScenarioTemplate, ISimulations, ISimulationUser, ICeremonySession } from '../../../interfaces';
import { AuthService } from '../../../services/auth.service';
import { switchMap, map } from 'rxjs/operators';
import { ScenarioTemplateService } from '../../../services/scenario-template.service';
import { ToastModule } from 'primeng/toast';
import { CeremonySessionService } from '../../../services/ceremony-session.service';
import {InvitationService} from "../../../services/invitation.service";
import {SocketService} from "../../../services/socket.service";
import {UserService} from "../../../services/user.service";

type NoticeType = 'success' | 'warning' | 'error';
interface Notice {
  type: NoticeType;
  text: string;
}
@Component({
  selector: 'app-create-session',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    ToastModule,
 MatIconModule,
  ],
  templateUrl: './create-session.component.html',
  styleUrls: ['./create-session.component.scss']
})
export class CreateSessionComponent implements OnInit, OnDestroy{
  @Input() ceremonyData!: IScenario;
  @Input() autoJoinRoom: string | null = null;
  @Output() returnToMainScreen =  new EventEmitter<IScenario>();
  @Output() backToSelection = new EventEmitter<void>();
  @Output() sessionCreated = new EventEmitter<any>();
  @Output() sendInviteEmitter = new EventEmitter<void>();

  notice = signal<Notice | null>(null);
  selectedScenario: IScenario | null = null
  difficultyLevels = ['Baja', 'Media', 'Alta'];
  scrumRoles  = ['Scrum Master', 'Developer', 'Product Owner', 'QA'];
  selectedDifficulty = '';
  selectedRole = '';
  scenario?: IScenario;
  simulation: ISimulations = {};
  simulationUser: ISimulationUser = {};
  scenarioTemplate: IScenarioTemplate = {};
  inviteEmail = '';
  hasInvitedUsers = false;
  participants: IParticipant[] = [];
  isLoading = false;

  private socketService = inject(SocketService);
  private invitationService = inject(InvitationService);
  private userService = inject(UserService);
  private messageSubscription: (() => void) | null = null;
  ceremonySession: ICeremonySession = {};
 constructor(
    private simulationService: SimulationService,
    public authService: AuthService,
    private router: Router,
    private scenarioTemplateService: ScenarioTemplateService,
    private ceremonySessionService: CeremonySessionService
  ) {
  effect(() => {
      const ceremonyData = this.simulationService.selectedScenario$();
      if (ceremonyData) {
        this.selectedScenario = ceremonyData;
      }
    });
    const nav = this.router.getCurrentNavigation();
    this.ceremonyData = nav?.extras?.state?.['scenario'];
  }

  async ngOnInit(){
    await this.connectToRoom();
    if (this.autoJoinRoom) {
      console.log('Room detectado en create-session:', this.autoJoinRoom);

      // Agregar usuario actual a la lista
      const currentUser = this.authService.getUser();
      this.addParticipant(
        currentUser.email || "",
        this.selectedRole || 'Invitado',
        false
      );
    }
    console.log('Listener registrado');
  }

  ngOnDestroy() {
    if (this.messageSubscription) {
      this.messageSubscription();
    }
  }

  closeNotice() {
    this.notice.set(null);
  }

  onReturnPressed(){
   this.returnToMainScreen.emit();
  }
createGroupSimulation() {
  if (!this.selectedDifficulty || !this.selectedRole) {
    this.notice.set({
      type: 'warning',
      text: 'Atención: Debes seleccionar un rol y dificultad'
    });
    return;
  }

  if (this.selectedDifficulty.trim() === '') {
    this.notice.set({
      type: 'warning',
      text: 'Atención: Debes seleccionar una dificultad'
    });
    return;
  }

  if (this.selectedRole.trim() === '') {
    this.notice.set({
      type: 'warning',
      text: 'Atención: Debes seleccionar un rol'
    });
    return;
  }

  const currentUserId = this.authService.getUserId();
  if (!currentUserId) {
    alert('Error: no se encontró el usuario actual.');
    return;
  }

  this.isLoading = true;
  const userId = this.authService.getUser().id;
  const now = new Date();

  const newSimulation: ISimulations = {
    difficultyLevel: this.selectedDifficulty,
    startDate: now,
    endDate: new Date(now.getTime() + 60 * 60000),
    createdBy: { id: userId },
    scenario: { id: this.selectedScenario?.id }
  };

  this.scenarioTemplateService.getTemplate(
    this.selectedScenario?.id || 0,
    this.scenarioTemplateService.mapDifficultyToNumber(this.selectedDifficulty),
    this.selectedRole
  ).pipe(
    switchMap((templateResponse: any) => {
      if (templateResponse && templateResponse.promptTemplate) {
        this.scenarioTemplate = templateResponse;
      } else if (templateResponse && templateResponse.data) {
        if (Array.isArray(templateResponse.data) && templateResponse.data.length > 0) {
          this.scenarioTemplate = templateResponse.data[0];
        } else if (templateResponse.data.promptTemplate) {
          this.scenarioTemplate = templateResponse.data;
        }
      } else {
        this.scenarioTemplate = {};
      }

      return this.simulationService.createSimulation(newSimulation);
    }),

    switchMap((createdSim) => {
      if (!createdSim.id) {
        alert('Error: el backend no devolvió el id de la Simulation.');
        throw new Error('Simulation sin id');
      }

      this.simulation = createdSim;

      const newSimUser: ISimulationUser = {
        scrumRole: this.selectedRole,
        assignedAt: new Date(),
        simulation: { id: createdSim.id },
        user: { id: currentUserId }
      };

      return this.simulationService.createSimulationUser(newSimUser);
    }),

    switchMap((simUser) => {
   
      this.simulationUser = simUser;

      if (!this.simulation.id) {
        throw new Error('Simulation sin id');
      }


      if (!this.selectedScenario?.name) {
        throw new Error('Scenario sin nombre');
      }

      const newCeremonySession = {
        ceremonyType: this.selectedScenario.name,
        simulationId: this.simulation.id, 
        startTime: new Date()
      };

      return this.ceremonySessionService.createCeremonySession(newCeremonySession);
    })
  ).subscribe({
    next: (ceremonySessionResponse) => {
      this.isLoading = false;

      if (ceremonySessionResponse.data) {
        this.ceremonySession = ceremonySessionResponse.data;
      } else if (ceremonySessionResponse.id) {
        this.ceremonySession = ceremonySessionResponse;
      } else {
        this.ceremonySession = { id: 1 };
      }

      this.redirectToDashboard();
      this.sessionCreated.emit(ceremonySessionResponse);
    },
    error: (err) => {
      console.error('Error en el flujo', err);
      this.isLoading = false;
    }
  });
}
  createSimulation() {
    if (!this.selectedDifficulty|| !this.selectedRole) {
      this.notice.set({
        type: 'warning',
        text: 'Atención: Debes seleccionar un rol'
      });
    }

  if (this.selectedDifficulty.trim() === '') {
    this.notice.set({
      type: 'warning',
      text: 'Atención: Debes seleccionar una dificultad'
    });
    return;
  }

  if (this.selectedRole.trim() === '') {
    this.notice.set({
      type: 'warning',
      text: 'Atención: Debes seleccionar un rol'
    });
    return;
  }

  const currentUserId = this.authService.getUserId();
  if (!currentUserId) {
    alert('Error: no se encontró el usuario actual.');
    return;
  }




 this.isLoading = true;
  const userId = this.authService.getUser().id;
  const now = new Date();
  const newSimulation: ISimulations = {
    difficultyLevel: this.selectedDifficulty,
    startDate: now,
    endDate: new Date(now.getTime() + 60 * 60000),
    createdBy: { id : userId },
    scenario: { id: this.selectedScenario?.id}
  };


  this.scenarioTemplateService.getTemplate(
    this.selectedScenario?.id || 0,
    this.scenarioTemplateService.mapDifficultyToNumber(this.selectedDifficulty),
    this.selectedRole
  ).pipe(
    switchMap((templateResponse: any) => {

      if (templateResponse && templateResponse.promptTemplate) {
        this.scenarioTemplate = templateResponse;
      }

      else if (templateResponse && templateResponse.data) {
        if (Array.isArray(templateResponse.data) && templateResponse.data.length > 0) {
          this.scenarioTemplate = templateResponse.data[0];
        } else if (templateResponse.data.promptTemplate) {
          this.scenarioTemplate = templateResponse.data;
        }
      } else {
        this.scenarioTemplate = {};
      }


      return this.simulationService.createSimulation(newSimulation);
    }),
    switchMap((createdSim) => {
      if (!createdSim.id) {
      alert('Error: el backend no devolvió el id de la Simulation.');
      throw new Error('Simulation sin id');
    }
    this.simulation = createdSim;
      const newSimUser: ISimulationUser = {
        scrumRole: this.selectedRole,
        assignedAt: new Date(),
        simulation: { id: createdSim.id },
        user: { id: currentUserId }
      };


      return this.simulationService.createSimulationUser(newSimUser);
    })
  ).subscribe({
    next: (res) => {
  this.isLoading = false;
  this.simulationUser = res;

  if (this.hasInvitedUsers) {
    const roomId = `room-${res.simulation?.id || Date.now()}`;
    this.socketService.sendMessage({
      type: 'create-room',
      room: roomId,
      host: this.authService.getUser()?.name || 'Host',
      role: this.selectedRole
    });
  }
  this.redirectToScenarioPage(this.selectedScenario?.name, {
    scenario: this.selectedScenario,
    simulationUser: res
  });
  this.sessionCreated.emit(res);
},
    error: (err) => {
      console.error('Error en el flujo', err);
      this.isLoading = false;
      if (err.status === 404) {
        this.notice.set({
          type: 'warning',
          text: `No se encontró una plantilla para ${this.selectedScenario?.name} con dificultad ${this.selectedDifficulty} y rol ${this.selectedRole}. Continuando sin plantilla específica.`
        });

        // Redirigir al dashboard sin plantilla
        this.scenarioTemplate = {};
        this.redirectToDashboard();
      } else {
        this.notice.set({
          type: 'error',
          text: 'Error al crear la sesión. Por favor, intenta nuevamente.'
        });
      }
    }
  });
}
      private redirectToScenarioPage(scenarioName?: string, stateData?: any) {
      if (!scenarioName) {
        alert('Error: el escenario no tiene nombre definido.');
        return;
      }
       const normalizedName = scenarioName.trim().toLowerCase();
       const routes: Record<string, string> = {
    'daily': '/app/daily',
    'planning': '/app/planning',
    'review': '/app/review',
    'retrospective': '/app/retrospective'
  };
  const routePath = routes[normalizedName];
  if (routePath) {
    console.log(`➡️ Redirigiendo a: ${routePath}`);
    this.router.navigate([routePath], {
      state: {
        ...(stateData || {}),
        simulation: this.simulation,
        simulationId: this.simulation?.id,
        scenario: this.selectedScenario,
        simulationUser: this.simulationUser,
        simulationUserId: this.simulationUser?.id,
        aiTemplate: this.scenarioTemplate
      }
    });
  } else {
    this.notice.set({
      type: 'error',
      text: `Error: No se encontró una ruta para el escenario "${scenarioName}".`
    });
    this.isLoading = false;
    return;
  }
}
private redirectToDashboard() {
  if (this.ceremonySession.id) {
      localStorage.setItem('ceremonySessionId', this.ceremonySession.id.toString());
    }
    this.router.navigate(['/app/dashboard'], {
      state: {
        scenario: this.selectedScenario,
        simulationUser: this.simulationUser,
        aiTemplate: this.scenarioTemplate,
        ceremonySessionId: this.ceremonySession.id
      }
    });
    console.log('Datos enviados al dashboard:', {
      scenario: this.selectedScenario,
      simulationUser: this.simulationUser,
      aiTemplate: this.scenarioTemplate,
      ceremonySessionId: this.ceremonySession.id
    });
}

  async connectToRoom() {
    await this.socketService.connect();

    this.messageSubscription = this.socketService.addMessageListener((msg) => {
      this.handleParticipantEvents(msg);
    });
  }

  handleParticipantEvents(msg: any) {
    console.log('Mensaje recibido en create-session:', msg);

    switch(msg.type) {
      case 'joinSuccess':
        // Alguien se unió
        if (msg.user && msg.role) {
          this.addParticipant(msg.user, msg.role, false);
        }
        break;

      case 'user-left':
        // Alguien salió
        if (msg.user) {
          this.removeParticipant(msg.user);
        }
        break;
    }
  }

  async addParticipant(userEmail: string, role: string, isCreator: boolean = false) {
    console.log('➕ Intentando agregar:', userEmail, role);
    // Verificar si ya existe
    const exists = this.participants.find(p => p.email === userEmail);
    if (exists) {
      console.log('Participante ya existe:', userEmail);
      return;
    }

    // Obtener nombre real
    let displayName = userEmail;
    try {
      const response = await this.userService.getUserByEmail(userEmail).toPromise();
      if (response?.data?.name) {
        displayName = `${response.data.name} ${response.data.lastname || ''}`.trim();
      }
    } catch (error) {
      console.error('Error obteniendo nombre:', error);
    }

    // Agregar a la lista
    const newParticipant: IParticipant = {
      email: userEmail,
      name: displayName,
      role: role,
      isCreator: isCreator,
      difficulty: isCreator ? this.selectedDifficulty : undefined
    };

    this.participants.push(newParticipant);
    console.log('✅ Participante agregado:', displayName, role);
  }

  removeParticipant(userEmail: string) {
    const index = this.participants.findIndex(p => p.email === userEmail);
    if (index > -1) {
      const removed = this.participants.splice(index, 1)[0];
      console.log('❌ Participante removido:', removed.name);
    }
  }

  // sendInvitation() {
  //   if (!this.inviteEmail || !this.inviteEmail.includes('@')) {
  //     this.notice.set({
  //       type: 'warning',
  //       text: 'Por favor ingresa un email válido'
  //     });
  //     return;
  //   }
  //
  //   // Si aún no se creó la simulación, marcar que habrá usuarios invitados
  //   // if (!this.simulation?.id) {
  //   //   this.hasInvitedUsers = true;
  //   // }
  //
  //   const roomId = `room-${Date.now()}`;
  //   const inviterName = this.authService.getUser()?.name || 'Un usuario';
  //   const ceremonyType = this.selectedScenario?.ceremonyType || 'Ceremonia Scrum';
  //   const scenarioId = this.selectedScenario?.id || 0;
  //
  //   this.invitationService.sendInvitation(
  //     this.inviteEmail,
  //     roomId,
  //     inviterName,
  //     // ceremonyType,
  //     // scenarioId
  //   ).subscribe({
  //     next: () => {
  //       this.hasInvitedUsers = true; // Marcar que hay invitados
  //       this.notice.set({
  //         type: 'success',
  //         text: `Invitación enviada exitosamente a ${this.inviteEmail}`
  //       });
  //       this.inviteEmail = '';
  //     },
  //     error: (err) => {
  //       console.error('Error enviando invitación:', err);
  //       this.notice.set({
  //         type: 'error',
  //         text: 'Error al enviar la invitación. Intenta nuevamente.'
  //       });
  //     }
  //   });
  // }

}