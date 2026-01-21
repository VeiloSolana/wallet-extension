import { api } from "../api/apiHandler";

export interface CheckUsernameResponse {
  available: boolean;
  username: string;
}

export interface AuthResponse {
  success: boolean;
  username: string;
  publicKey: string;
  privateKey: string; // Wallet private key in hex
  veiloPublicKey: string; // Privacy public key
  veiloPrivateKey: string; // Privacy private key in hex
  encryptedMnemonic: string; // Mnemonic phrase
  token: string;
  message?: string;
}

export const authService = {
  checkUsername: async (username: string): Promise<CheckUsernameResponse> => {
    const response = await api.get<CheckUsernameResponse>(
      `/api/auth/checkUsername`,
      {
        params: { username },
      },
    );
    return response.data;
  },

  register: async (username: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/api/auth/createAccount", {
      username,
    });
    return response.data;
  },

  restore: async (mnemonic: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/api/auth/restoreAccount", {
      mnemonic,
    });
    return response.data;
  },
};
