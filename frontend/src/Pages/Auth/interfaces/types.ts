export type UserRole = "ADMIN" | "PERSONAL";

export type UserSession = {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  token: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
};
