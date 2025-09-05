import { IUser } from "./user";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: IUser;
}

export interface AdminCheckResponse {
  user: IUser | null;
  authenticated: boolean;
  isAdmin: boolean;
}
