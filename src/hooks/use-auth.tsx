import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { SecurityService } from "../services/security.service";
import { API_BASE, DB_LAMBDAS, lambdaDecode } from "../api/config";
import { apiClient } from "../api/client";
import { AuthUser } from "../types/entities";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const lambdaId = lambdaDecode("workflow_security_js");
      const url = `${API_BASE}/lambdas-json-run-node?db=${DB_LAMBDAS}&table=lambda&id=${lambdaId}&format=json`;
      console.log(url);
      const payload = {
        request: {
          flows: [{
            name: "workflow_security",
            description: "workflow_security",
            steps: [{
              name: "security",
              type: "function",
              functionName: "security",
              actions: [{
                name: "signin",
                type: "api",
                action: "mutation",
                params: { body: { username, password } }
              }]
            }]
          }]
        }
      };

      // Save request to localStorage to persist across page reload
      localStorage.setItem("last_login_request", JSON.stringify({ url, payload }));

      const response = await apiClient.post(url, payload);

      const data = response.data;
      console.log(data);

      // Save response to localStorage to persist across page reload
      localStorage.setItem("last_login_response", JSON.stringify(response));

      const signinData = data?.security?.signin;

      if (signinData?.token) {
        const t: string = signinData.token;

        // Decode JWT to extract inner lambdaToken
        let lambdaToken = "";
        let userId = "";
        try {
          const payloadPart = t.split('.')[1];
          const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
          const decodedJSON = JSON.parse(atob(base64));
          lambdaToken = decodedJSON.token || "";
          userId = decodedJSON.userId || "";
        } catch (e) {
          console.error("Error decoding JWT payload:", e);
        }

        const userObj: AuthUser = {
          id: userId || "admin",
          email: username,
          nombre: username.split('@')[0],
          rol: "admin",
          owner: localStorage.getItem("owner") || "default"
        };

        setUser(userObj);
        setToken(t);
        localStorage.setItem("lambdaToken", t);
        // if (lambdaToken) localStorage.setItem("lambdaToken", lambdaToken);
        localStorage.setItem("user", JSON.stringify(userObj));
      } else {
        throw new Error(data?.error ?? "Login fallido: estructura de respuesta inválida");
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    SecurityService.logout();
    setUser(null);
    setToken(null);
    window.location.hash = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Cargando...</div>;
  }

  if (!user) {
    window.location.hash = "/login";
    return null;
  }

  return children;
}
