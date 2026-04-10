import type { LoginCredentials, UserSession } from "./types";

let currentSession: UserSession | null = null;

export const memoryAuthStore = {
  getSession() {
    return currentSession;
  },

  signIn(credentials: LoginCredentials) {
    currentSession = {
      id: "mock-personal-1",
      nombre: credentials.email.split("@")[0] || "Personal OP",
      email: credentials.email,
      rol: "PERSONAL",
    };

    return currentSession;
  },

  signOut() {
    currentSession = null;
  },
};
