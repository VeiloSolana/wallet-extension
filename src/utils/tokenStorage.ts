import Cookies from "js-cookie";

const TOKEN_KEY = "veilo_auth_token";

export const tokenStorage = {
  setToken: (token: string) => {
    Cookies.set(TOKEN_KEY, token, {
      secure: true, // Only send over HTTPS
      sameSite: "strict", // Protection against CSRF
      expires: 7, // 7 days
    });
  },

  getToken: (): string | undefined => {
    return Cookies.get(TOKEN_KEY);
  },

  removeToken: () => {
    Cookies.remove(TOKEN_KEY);
  },
};
