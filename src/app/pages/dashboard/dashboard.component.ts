import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatbotComponent } from '../../components/chatbot/chatbot.component';
import { Router } from '@angular/router';
import { IScenario, ISimulationUser, IScenarioTemplate } from '../../interfaces';
import {CallService} from "../../services/call.service";
import { FloatingVideoComponent } from '../../components/floating-video/floating-video.component';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ChatbotComponent,
    FloatingVideoComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
    @ViewChild('dashboardChatbot') chatbot!: ChatbotComponent;
  // Datos recibidos del create-session
  scenario: IScenario | null = null;
  simulationUser: ISimulationUser | null = null;
  aiTemplate: IScenarioTemplate | null = null;

  constructor(private router: Router,private callService: CallService) {
    // Obtenemos los datos pasados desde create-session
    const nav = this.router.getCurrentNavigation();
    if(nav?.extras?.state) {
      this.scenario = nav.extras.state['scenario'] || null;
      this.simulationUser = nav.extras.state['simulationUser'] || null;
      this.aiTemplate = nav.extras.state['aiTemplate'] || null;
    }

  }

  ngOnInit() {
    
  }
  sendInviteToCall(){
    this.callService.call("sendInvite");
  }

  joinToCall(){
    this.callService.call("joinCall")
  }
    onAIAnalysis(analysis: string) {
    if (this.chatbot) {
      this.chatbot.addAIMessage('Análisis Automático', analysis);
    }
  }
}
