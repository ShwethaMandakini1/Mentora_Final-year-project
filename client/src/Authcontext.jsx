import React, { createContext, useContext, useState, useEffect } from "react";
import { getMe } from "../api/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      getMe()
        .then(res => {
          setUser(res.data.user);
          localStorage.setItem("role", res.data.user.role);
        })
        .catch(() => {
          localStorage.removeItem("token");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", userData.role);
    setUser(userData);
  };

  // role stays in localStorage after logout so ProtectedRoute
  // knows which sign-in page to redirect to
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    // NOTE: we intentionally keep "role" in localStorage
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);