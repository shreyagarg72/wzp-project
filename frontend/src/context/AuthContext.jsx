import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";


export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const decoded = jwtDecode(token);

        if (decoded.exp * 1000 < Date.now()) {
          // Token expired
          localStorage.removeItem("token");
          setUser(null);
          navigate("/");
        } else {
          setUser(decoded); // set { id, username, type }
        }
      } catch (err) {
        localStorage.removeItem("token");
        setUser(null);
        navigate("/");
      }
    } else {
      setUser(null);
      navigate("/");
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
