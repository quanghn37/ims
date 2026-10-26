"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { UserSession } from "@/types";
import { getStoredSession, saveSession, clearSession, erpGet } from "./api-client";
import { message } from "antd";

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (email: string, pass: string, lang?: string) => Promise<boolean>;
  logout: () => void;
  updateUserSession: (data: Partial<UserSession>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => false,
  logout: () => {},
  updateUserSession: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const session = getStoredSession();
    if (session) {
      setUser(session);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== "consims_session" || event.newValue !== null) return;
      if (localStorage.getItem("consims_session")) return;

      try {
        sessionStorage.removeItem("consims_session");
      } catch (error) {
        console.error("Error clearing session in this tab:", error);
      }
      setUser(null);
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const login = async (email: string, pass: string, lang = "vi"): Promise<boolean> => {
    try {
      // Direct API call: /api/validate-user?params={"Email":"...","Password":"...","Language":"vi"}
      const data = await erpGet("api/validate-user", {
        Email: email,
        LogIn: email,
        Password: pass,
        Language: lang,
        SessionId: "",
      });

      // API Consims returns: { Success: "true", Message: "...", Data: [{ SessionId, UserId, Email }] }
      const successFlag = data?.Success ?? data?.success;
      if (successFlag === false || successFlag === 0 || String(successFlag).toLowerCase() === "false") {
        let errDetail = data?.Message || "Đăng nhập không thành công.";
        if (Array.isArray(data?.Errors) && data.Errors.length > 0) {
          const explanations = data.Errors.map((e: any) => e.Explanation).filter(Boolean);
          if (explanations.length > 0) {
            errDetail = explanations.join(" - ");
          }
        }
        message.error(errDetail);
        return false;
      }

      let sessionData: any = null;
      if (data?.Data && Array.isArray(data.Data) && data.Data.length > 0) {
        sessionData = data.Data[0];
      } else if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
        sessionData = data.data[0];
      } else if (Array.isArray(data) && data.length > 0) {
        sessionData = data[0];
      } else if (data?.Data && typeof data.Data === "object") {
        sessionData = data.Data;
      } else if (data?.SessionId || data?.Email) {
        sessionData = data;
      }

      const sessionId =
        typeof sessionData?.SessionId === "string"
          ? sessionData.SessionId
          : typeof sessionData?.sessionId === "string"
            ? sessionData.sessionId
            : typeof sessionData?.SessionID === "string"
              ? sessionData.SessionID
              : typeof sessionData?.Token === "string"
                ? sessionData.Token
                : "";
      const logIn =
        typeof sessionData?.LogIn === "string"
          ? sessionData.LogIn
          : typeof sessionData?.Email === "string"
            ? sessionData.Email
            : email;

      if (sessionData && sessionId.trim() && logIn.trim()) {
        const session: UserSession = {
          LogIn: logIn.trim(),
          Email: typeof sessionData.Email === "string" ? sessionData.Email : email,
          FullName:
            typeof sessionData.FullName === "string"
              ? sessionData.FullName
              : logIn.trim(),
          SessionId: sessionId.trim(),
          Language: lang,
          ClientId:
            typeof sessionData.ClientId === "string" ||
            typeof sessionData.ClientId === "number"
              ? sessionData.ClientId
              : undefined,
          JobTitle: typeof sessionData.JobTitle === "string" ? sessionData.JobTitle : undefined,
        };
        saveSession(session);
        setUser(session);
        message.success("Đăng nhập thành công!");
        return true;
      } else {
        clearSession();
        setUser(null);
        message.error(data?.Message || "Đăng nhập không thành công. Vui lòng kiểm tra lại tài khoản.");
        return false;
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      message.error(err.response?.data?.message || err.message || "Không thể kết nối đến máy chủ.");
      return false;
    }
  };

  const logout = () => {
    clearSession();
    setUser(null);
    message.info("Đã đăng xuất");
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  const updateUserSession = (data: Partial<UserSession>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    saveSession(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUserSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
