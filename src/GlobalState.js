import React, { useState } from "react";

export const AuthContext = React.createContext();
export const AuthProvider = (props) => {
  const [authState, setAuthState] = useState({
    role: "",
    items: [],
    times: [],
    offset: 0,
  });
  return <AuthContext.Provider value={[authState, setAuthState]}>{props.children}</AuthContext.Provider>;
};
