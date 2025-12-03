export interface ILoginResponse {
  authUser: IUser;
  token: string;
  expiresIn: number;
}
export interface IResponse<T> {
  data: T;
  message: string,
  meta: T;
}

export interface IUser {
  id?: number;
  name?: string;
  lastname?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  authorities?: IAuthority[];
  role?: IRole
  authProvider?: 'local' | 'google';
}

export interface IAuthority {
  authority: string;
}

export interface IFeedBackMessage {
  type?: IFeedbackStatus;
  message?: string;
}

export enum IFeedbackStatus {
  success = "SUCCESS",
  error = "ERROR",
  default = ''
}

export enum IRoleType {
  admin = "ROLE_ADMIN",
  user = "ROLE_USER",
  superAdmin = 'ROLE_SUPER_ADMIN'
}

export interface IRole {
  createdAt: string;
  description: string;
  id: number;
  name : string;
  updatedAt: string;
}

export interface IRole {
  id: number;
  name: string;
}

export interface IUserRoleAssign {
  userId: number;
  roleId: number;
  simulationId?: number;
}


export interface IOrder {
  id?: number;
  description?: string;
  total?: number;
}

export interface ISearch {
  page?: number;
  size?: number;
  pageNumber?: number;
  pageSize?: number;
  totalElements?: number;
  totalPages?:number;
}

export interface IGiftList {
  id?: number;
  name?: string;
  description?: string;
}

export interface IGift {
  id?: number;
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  giftList?: IGiftList;
}

export interface IAIResponse {
  answer?: string;
  error?: string;
}

export interface ICeremony {
  id?: number;
  ceremonyType?: string;
  startTime?: Date;
  summary?: string;
}

export interface IScenario {
  id?: number;
  backlog?: string | string[];
  ceremonyType?: string;
  description?: string;
  difficultyLevel?: string;
  estimatedDuration?: number;
  goals?: string;
  name?: string;
  team?: string;
  initialTasks?: {
    title: string;
    description?: string;
  }[];
  templates?: IScenarioTemplate[];
 
}

export interface ISimulations {
  id?: number;
  averageScore?: number; 
  difficultyLevel?: string;
  endDate?: Date;
  startDate?: Date;
  createdBy?: IUser;
  scenario?: IScenario;
  simulationUsers?: ISimulationUser[];
}

export interface ISimulationUser {
  id? : number;
  assignedAt?: Date;
  scrumRole?: string;
  simulation?: ISimulations;
  user?: IUser;
}

export interface IScenarioTemplate {
  id?: number;
  stepOrder?: number;       
  promptTemplate?: string;     
  scenario?: IScenario;      
  createdAt?: string;        
  updatedAt?: string;        
  answers?: string[];
}
export interface ICeremonySession {
  id?: number;
  ceremonyType?: string;
  simulationId?: number;
  startTime?: Date;
  endTime?: Date;
  simulation?: ISimulations;
}

export interface IHistory {
  id?: number;
  user?: IUser;
  simulation?: ISimulations;
  createdAt?: Date;
  transcript?: string;
  finalScore?: number;
  simulationUser?: ISimulationUser;
}

export interface ISimulationFeedback {
  id?: number;
  createdAt?: Date;
  user?: IUser;
  message?: string;
  simulation?: ISimulations;
}


export interface IParticipant {
  email: string;
  name: string;
  role: string;
  difficulty?: string; // Solo el creador tiene esto
  isCreator?: boolean;
}