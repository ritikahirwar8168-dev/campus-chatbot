import { createContext, useContext } from "react";
import type { Student } from "./api";

export type AuthState = {
  student: Student | null;
  setSession: (token: string | null, student: Student | null) => void;
};

export const AuthContext = createContext<AuthState>({
  student: null,
  setSession: () => undefined,
});

export function useAuth() {
  return useContext(AuthContext);
}
