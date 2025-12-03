import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatbotComponent } from '../../components/chatbot/chatbot.component';
import { Router } from '@angular/router';
import { IScenario, ISimulationUser, IScenarioTemplate } from '../../interfaces';
import {CallService} from "../../services/call.service";
import {MessageService} from "primeng/api";
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ChatbotComponent,
    TooltipModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {

  @ViewChild('copyButton') copyButton!: ElementRef;
  scenario: IScenario | null = null;
  simulationUser: ISimulationUser | null = null;
  aiTemplate: IScenarioTemplate | null = null;
  currentRoomId = '';
  isCreator = false;
  tooltipText = "Copiar Id"
  private resetTimeout: any;


  constructor(private router: Router,private callService: CallService, private messageService: MessageService) {
    const nav = this.router.getCurrentNavigation();
    if(nav?.extras?.state) {
      this.scenario = nav.extras.state['scenario'] || null;
      this.simulationUser = nav.extras.state['simulationUser'] || null;
      this.aiTemplate = nav.extras.state['aiTemplate'] || null;
    }


  }

  ngOnInit() {
    this.callService.roomId$.subscribe(roomId => {
      console.log('Nuevo room ID recibido:', roomId);
      this.currentRoomId = roomId;
    });
    this.callService.creatorRoom$.subscribe(isCreator => {
      this.isCreator = isCreator;
    })
  }
  sendInviteToCall(){
    this.callService.call("sendInvite");
  }

  joinToCall(){
    this.callService.call("joinCall")
  }

  copyRoomId() {
    navigator.clipboard.writeText(this.currentRoomId)
      .then(() => {
        if (this.resetTimeout) {
          clearTimeout(this.resetTimeout);
        }

        this.tooltipText = '¡Copiado!';

        const button = this.copyButton.nativeElement;
        button.blur();

        setTimeout(() => {
          const mouseEnterEvent = new Event('mouseenter');
          button.dispatchEvent(mouseEnterEvent);

          setTimeout(() => {
            const mouseLeaveEvent = new Event('mouseleave');
            button.dispatchEvent(mouseLeaveEvent);
            this.tooltipText = 'Copiar ID';
          }, 2000);
        }, 50);
      })
      .catch(() => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo copiar el ID'
        });
      });
  }

  ngOnDestroy() {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }
  }
}
