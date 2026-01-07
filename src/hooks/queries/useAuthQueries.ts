import { useMutation } from "@tanstack/react-query";
import { authService } from "../../services/authService";
import { tokenStorage } from "../../utils/tokenStorage";
import { useAuthStore } from "../../store/useAuthStore";

export const useCheckUsername = () => {
  return useMutation({
    mutationFn: (username: string) => authService.checkUsername(username),
  });
};

export const useRegisterUser = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (username: string) => authService.register(username),
    onSuccess: (data) => {
      console.log({data})
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

export const useRestoreAccount = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (mnemonic: string) => authService.restore(mnemonic),
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
