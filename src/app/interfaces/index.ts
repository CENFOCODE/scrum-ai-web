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
  backlog?: string;
  ceremonyType?: string;
  description?: string;
  difficultyLevel?: string;
  estimatedDuration?: number;
  goals?: string;
  name?: string;
  team?: string;
}