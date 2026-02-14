import { api } from "../lib/api/relayerApi";

export interface CheckUsernameResponse {
  available: boolean;
  username: string;
}

export interface ChallengeResponse {
  challenge: string;
  expiresAt: number;
}

export interface RegisterRequest {
  username: string;
  publicKey: string;
}

export interface RegisterResponse {
  success: boolean;
  username: string;
  publicKey: string;
  // veiloKeys - publicKey is plain, privateKey is encrypted via ECDH
  veiloPublicKey: string;
  encryptedVeiloPrivateKey: string; // Base64 encrypted blob
  ephemeralPublicKey: string; // Server's ephemeral key for ECDH decryption
  token: string;
  message?: string;
}

export interface RestoreResponse {
  success: boolean;
  username: string;
  publicKey: string;
  veiloPublicKey: string;
  encryptedVeiloPrivateKey: string;
  ephemeralPublicKey: string;
  token: string;
  message?: string;
}

export const authService = {
  /**
   * Check if a username is available
   */
  checkUsername: async (username: string): Promise<CheckUsernameResponse> => {
    const response = await api.get<CheckUsernameResponse>(
      `/auth/checkUsername`,
      { params: { username } },
    );
    return response.data;
  },

  /**
   * Get a challenge for signature-based authentication (restore flow)
   */
  getChallenge: async (publicKey: string): Promise<ChallengeResponse> => {
    const response = await api.post<ChallengeResponse>("/auth/challenge", {
      publicKey,
    });
    return response.data;
  },

  /**
   * Register a new account
   * Client generates wallet locally, only sends publicKey + username
   * Server generates veiloKeys and encrypts privateKey for user
   */
  register: async (
    username: string,
    publicKey: string,
  ): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>("/auth/register", {
      username,
      publicKey,
    });
    return response.data;
  },

  /**
   * Restore an existing account using signature verification
   * Client proves ownership via signature, never sends mnemonic
   */
  restore: async (
    publicKey: string,
    signature: string,
    message: string,
  ): Promise<RestoreResponse> => {
    const response = await api.post<RestoreResponse>("/auth/restore", {
      publicKey,
      signature,
      message,
    });
    return response.data;
  },
};
