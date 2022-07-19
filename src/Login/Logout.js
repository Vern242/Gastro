import React, { useContext, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AuthContext } from "../GlobalState";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Container } from "react-bootstrap";

export default function Logout() {
  const [, setAuthState] = useContext(AuthContext); // , sprawia ze bierzemy drugi element z listy - setter
  const navigate = useRef(useNavigate());

  useEffect(() => {
    const controller = new AbortController();

    async function logout() {
      await axios({
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "GET",
        signal: controller.signal,
        withCredentials: true,
        url: "http://localhost:8000/logout",
      })
        .then((res) => {
          setAuthState((authState) => ({ ...authState, role: "" }));
          navigate.current("/nosession");
          return res;
        })
        .catch((error) => {
          return error;
        });
    }

    logout();

    return () => {
      controller.abort();
    };
  });

  return (
    <Container>
      <div className="mt-3" />
      <div className="text-center">
        <h1>Pomyślne wylogowanie</h1>
      </div>
    </Container>
  );
}
