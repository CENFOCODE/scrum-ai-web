import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatbotComponent } from '../../components/chatbot/chatbot.component';
import { Router } from '@angular/router';
import { IScenario, ISimulationUser, IScenarioTemplate } from '../../interfaces';
import {CallService} from "../../services/call.service";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ChatbotComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  
  // Datos recibidos del create-session
  scenario: IScenario | null = null;
  simulationUser: ISimulationUser | null = null;
  aiTemplate: IScenarioTemplate | null = null;
  currentRoomId = '';

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
    this.callService.roomId$.subscribe(roomId => {
      console.log('Nuevo room ID recibido:', roomId);
      this.currentRoomId = roomId; // <- lo guardás para mostrarlo
    });
  }
  sendInviteToCall(){
    this.callService.call("sendInvite");
  }

  joinToCall(){
    this.callService.call("joinCall")
  }
}
