import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      
      // Inject Authorization header into axios instances automatically
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const decoded = decodeToken(token);
      if (decoded) {
        const role = decoded["role"] || decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
        const name = decoded["unique_name"] || decoded["name"] || decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];
        const email = decoded["email"] || decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"];
        const id = decoded["sub"] || decoded["nameid"] || decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
        
        setUser({ id, name, email, role });
      } else {
        logout();
      }
    } else {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
    }
    setLoading(false);
  }, [token]);

  const login = (jwtToken) => {
    setToken(jwtToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
