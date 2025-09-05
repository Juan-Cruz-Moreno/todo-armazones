import { IUser } from "./user";

export interface AuthResponse {
  user: IUser;
}

export interface CurrentUserResponse {
  user: IUser | null;
  authenticated: boolean;
}