import React, { useContext } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AuthContext } from "../GlobalState";
import { Button, Container } from "react-bootstrap";
import { Navigate, useNavigate } from "react-router-dom";

export default function SessionEnded() {
  const [authState] = useContext(AuthContext);
  const navigate = useNavigate();

  let style = {
    fontSize: 40 + "px",
    display: "inline",
  };

  if (authState.role !== "") return <Navigate to={"/"} />;

  return (
    <Container>
      <p></p>
      <div className="mt-5" />
      <h1 className="text-center">Twoja sesja została zakończona</h1>
      <div className="mt-5" />
      <div className="text-center">
        <Button onClick={() => navigate("/")}>
          <div style={style}>Ok</div>
        </Button>
      </div>
    </Container>
  );
}
