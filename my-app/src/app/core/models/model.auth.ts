import { User } from "./model.user";

export interface AuthCredentials {
  usernameOrEmail: string;
  password: string;
}


/** Exact shape returned by POST /api/auth/login */
export interface LoginApiResponse {
  data: {
    token: string;
    tokenType: string;
    expiresIn: number;
    userId: number;
    username: string;
    email: string;
    role: string;
    hasChangedPassword?: boolean;
  };
  message: string;
  success: boolean;
  timestamp: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}