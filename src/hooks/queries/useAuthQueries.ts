import { useMutation } from "@tanstack/react-query";
import { authService } from "../../services/authService";
import { tokenStorage } from "../../utils/tokenStorage";
import { useAuthStore } from "../../store/useAuthStore";

export const useCheckUsername = () => {
  return useMutation({
    mutationFn: (username: string) => authService.checkUsername(username),
  });
};

/**
 * Get a challenge for signature-based auth (restore flow)
 */
export const useGetChallenge = () => {
  return useMutation({
    mutationFn: (publicKey: string) => authService.getChallenge(publicKey),
  });
};

/**
 * Register a new account
 * Now accepts { username, publicKey } since keys are generated client-side
 */
export const useRegisterUser = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: ({
      username,
      publicKey,
    }: {
      username: string;
      publicKey: string;
    }) => authService.register(username, publicKey),
    onSuccess: (data) => {
      console.log({ data });
      // Save token
      if (data.token) {
        tokenStorage.setToken(data.token);
      }
      // Update global store
      setAuth({
        username: data.username,
        publicKey: data.publicKey,
      });
    },
  });
};

/**
 * Restore an existing account using signature verification
 * Client proves ownership via signature, never sends mnemonic
 */
export const useRestoreAccount = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: ({
      publicKey,
      signature,
      message,
    }: {
      publicKey: string;
      signature: string;
      message: string;
    }) => authService.restore(publicKey, signature, message),
    onSuccess: (data) => {
      // Save token
      if (data.token) {
        tokenStorage.setToken(data.token);
      }
      // Update global store
      setAuth({
        username: data.username,
        publicKey: data.publicKey,
      });
    },
  });
};
