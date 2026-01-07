import { api } from "../api/apiHandler";

export interface CheckUsernameResponse {
  available: boolean;
  username: string;
}

export interface AuthResponse {
  success: boolean;
  username: string;
  publicKey: string;
  encryptedMnemonic?: string; // Only on registration? The controller sends "encryptedMnemonic" which is actually the plain mnemonic in the code I saw
  token: string;
  message?: string;
}

export const authService = {
  checkUsername: async (username: string): Promise<CheckUsernameResponse> => {
    const response = await api.get<CheckUsernameResponse>(`/auth/checkUsername`, {
      params: { username },
    });
    return response.data;
  },

  register: async (username: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/createAccount", {
      username,
    });
    return response.data;
  },

  restore: async (mnemonic: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/restoreAccount", {
      mnemonic,
    });
    return response.data;
  },
};
