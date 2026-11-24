export type UserRole = "admin" | "salesperson" | "user";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}
