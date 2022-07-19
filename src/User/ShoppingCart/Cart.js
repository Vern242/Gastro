import { AuthContext } from "../../GlobalState";
import React, { useEffect, useContext, useState } from "react";
import { Modal, Button, Badge } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate, useLocation } from "react-router-dom";
import CartItem from "./CartItem";

export default function Cart() {
  const [authState] = useContext(AuthContext);
  const [show, setShow] = useState(false);
  const [price, setPrice] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    function fillItemsAndCalculatePrice() {
      let base = 0;
      if (authState.items !== undefined) {
        if (authState.items.length !== 0) {
          authState.items.forEach((item) => {
            const total = item.productPrice * item.quantity;
            base += total;
          });
        }
      }
      setPrice(parseFloat(base).toFixed(2));
    }
    fillItemsAndCalculatePrice();
  }, [authState]);

  function checkout() {
    if (authState.items.length > 0 && authState.role === "customer") {
      showAndHide();
      navigate("/checkout");
    }
  }

  function showAndHide() {
    setShow((show) => !show);
  }

  function goToLogin() {
    showAndHide();
    navigate("/login");
  }

  if (location.pathname === "/checkout") return <div />;

  return (
    <>
      <Button onClick={showAndHide}>
        Koszyk{" "}
        {authState.items.length > 0 && (
          <Badge pill bg="danger">
            {authState.items.length}
          </Badge>
        )}
      </Button>
      <Modal show={show} onHide={showAndHide}>
        <Modal.Header>
          <Modal.Title>Twój koszyk</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {authState.items.length > 0 &&
            authState.items.map((item, index) => {
              return <CartItem key={`CartItem:${index}`} item={item} />;
            })}
          {price > 1 ? <h3>Łącznie: {price} zł</h3> : <h3>Jeśli dodasz danie wyświetli się tutaj</h3>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={showAndHide}>
            Kontynuuj
          </Button>
          {authState.role === "" ? (
            <>
              {" "}
              <Button onClick={goToLogin}>Zaloguj</Button>
              <div className="text-danger">Musisz się zalogować aby złożyć zamówienie</div>
            </>
          ) : (
            <Button variant="primary" onClick={checkout} disabled={!(authState.items.length !== 0 && authState.role !== "")}>
              Złóż zamówienie
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
}
