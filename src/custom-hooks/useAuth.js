// src/custom-hooks/useAuth.js
import { useEffect, useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AllezGoApi from "@/services/allezgo-api/allezGoApi.js";
import toast from "react-hot-toast";

const ACCESS_TOKEN_KEY = "access_token";
const USER_DATA_KEY = "user_data";

const toApiError = (error) => ({
  status: error?.status ?? null,
  message: error?.message || "Request failed",
  data: error?.data ?? null,
});

export default function useAuth() {
  const queryClient = useQueryClient();

  // We keep standard state here to ensure components re-render immediately 
  // upon login/logout, as this isn't standard "server cache" data.
  const [token, setToken] = useState(() => localStorage.getItem(ACCESS_TOKEN_KEY));
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem(USER_DATA_KEY)) || null);

  const loginMutation = useMutation({
    mutationFn: async (payload) => {
      try {
        // 1. Authenticate and get the token
        const response = await AllezGoApi.Auth.login(payload);
        if (!response?.access_token) {
          throw {
            status: 500,
            message: "Login response missing access_token",
            data: response,
          };
        }

        // 2. Decode the JWT natively to get user profile data
        const base64Url = response.access_token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decodedJwt = JSON.parse(window.atob(base64));

        // 3. Reconstruct the final user object
        const finalUserData = {
          id: decodedJwt.sub || decodedJwt.id,
          email: decodedJwt.email,
          role: decodedJwt.role || 'client',
          firstName: decodedJwt.firstName || '',
          lastName: decodedJwt.lastName || ''
        };

        // 4. Bundle the token and the user data together for the onSuccess handler
        return {
          access_token: response.access_token,
          user: finalUserData
        };

      } catch (err) {
        throw err.status === 500 ? err : toApiError(err);
      }
    },
    onSuccess: (response) => {
      const newToken = response.access_token;
      const userData = response.user;

      localStorage.setItem(ACCESS_TOKEN_KEY, newToken);
      setToken(newToken);

      localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
      setUser(userData);

      // Dispatch the event so Header.jsx instantly knows to update
      window.dispatchEvent(new Event("allezgo:auth-sync"));
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (payload) => {
      try {
        return await AllezGoApi.Auth.register(payload);
      } catch (err) {
        throw toApiError(err);
      }
    },
    // onSuccess handled natively by the action in SignInPage.jsx
  });

  const logout = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    setToken(null);
    setUser(null);
    // Optionally wipe your TanStack caches on logout so another user doesn't see old data
    toast.success("Déconnexion réussie ! À bientôt. 👋");
    queryClient.clear();
    window.dispatchEvent(new Event("allezgo:auth-sync"));
  }, [queryClient]);

  // Listen for auth-sync events triggered by login/logout in other tabs or components
  useEffect(() => {
    const handleAuthSync = () => {
      setToken(localStorage.getItem(ACCESS_TOKEN_KEY));
      setUser(JSON.parse(localStorage.getItem(USER_DATA_KEY)) || null);
    };
    window.addEventListener("allezgo:auth-sync", handleAuthSync);
    return () => window.removeEventListener("allezgo:auth-sync", handleAuthSync);
  }, []);

  // Listen for centralized 401 unauthorized errors mapped by axios interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
      queryClient.clear(); // Wipe cache on forced boot
    };
    window.addEventListener("allezgo:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("allezgo:unauthorized", handleUnauthorized);
  }, [queryClient]);

  const loading = loginMutation.isPending || registerMutation.isPending;
  const error = loginMutation.error || registerMutation.error || null;

  return {
    user,
    token,
    isAuthenticated: Boolean(token),
    loading,
    error,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout,
  };
}