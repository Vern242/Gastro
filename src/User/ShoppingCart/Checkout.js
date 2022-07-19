import { AuthContext } from "../../GlobalState";
import React, { useEffect, useContext, useState, useRef } from "react";
import { Button, Stack, Container, Row, Col, Form, ProgressBar } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { Navigate, useNavigate } from "react-router-dom";
import Helper from "../../Helper";

export default function Checkout() {
  const [authState, setAuthState] = useContext(AuthContext);
  const setState = useRef(setAuthState);
  const [items, setItems] = useState([]);
  const [price, setPrice] = useState(0);
  const navigate = useRef(useNavigate());
  const [terms, setTerms] = useState(false);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [payload, setPayload] = useState();
  const first = useRef(true);
  const itemsInState = useRef(authState.items);

  let style = {
    fontSize: 40 + "px",
    display: "inline",
  };

  useEffect(() => {
    setLoading(true);
    const controller = new AbortController();

    async function verifyOrder() {
      const result = await axios({
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
        data: { items: itemsInState.current },
        signal: controller.signal,
        withCredentials: true,
        url: "http://localhost:8000/user/verifyOrder",
      })
        .then((response) => response.data)
        .then((data) => {
          setState.current((authState) => ({ ...authState, items: data.order }));
          setItems(data.order);
          Helper.emptySessionStorage();
          Helper.setSessionStorage(data.order);
          setLoading(false);
          return data;
        })
        .catch((error) => {
          if (error?.message === "canceled") {
            console.log("canceled");
            return undefined;
          }
          setLoading(false);
          if (!error?.response) {
            setVerifyError("Nie udało połączyć się z serwerem, spróbuj odświeżyć stronę");
            return undefined;
          }
          setVerifyError(error?.response?.data?.message);
          if (error?.response?.data?.logout) navigate.current("/logout");
          return error;
        });
      return result;
    }

    verifyOrder();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const controller = new AbortController();
    setLoading(true);

    async function newOrder() {
      const result = await axios({
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
        data: payload,
        signal: controller.signal,
        withCredentials: true,
        url: "http://localhost:8000/user/createOrder",
      })
        .then((response) => response.data)
        .then((data) => {
          setSent(true);
          setState.current((authState) => ({ ...authState, items: [] }));
          setItems([]);
          Helper.emptySessionStorage();
          setLoading(false);
          return data;
        })
        .catch((error) => {
          if (error?.message === "canceled") {
            console.log("canceled");
            return undefined;
          }
          setLoading(false);
          if (!error?.response) {
            setVerifyError("Nie udało połączyć się z serwerem, spróbuj odświeżyć stronę");
            return undefined;
          }
          setErrorMessage(error?.response?.data?.message);
          if (error?.response?.data?.logout) navigate.current("/logout");
          return error;
        });
      return result;
    }

    newOrder();

    return () => {
      controller.abort();
    };
  }, [payload]);

  useEffect(() => {
    function fillItems() {
      let base = 0;
      if (authState.items !== undefined) {
        if (authState.items.length !== 0) {
          setItems(authState.items);
          authState.items.forEach((item) => {
            const total = item.productPrice * item.quantity;
            base += total;
          });
        }
      }
      setPrice(parseFloat(base).toFixed(2));
    }

    fillItems();
  }, [authState]);

  function handleSubmit() {
    if (authState.role !== "" && authState.items.length !== 0) {
      const data = {
        comment: comment,
        items: items,
      };
      setPayload(data);
    }
  }

  function addQuantity(item) {
    let helper = authState.items;
    let found = false;

    for (let i = 0; i < helper.length && !found; i++) {
      if (helper[i].id === item.id) {
        helper[i].quantity += 1;
        setAuthState((authState) => ({ ...authState, items: helper }));
        Helper.addSession(helper[i]);
        found = true;
      }
    }
  }

  function reduceQuantity(item) {
    let helper = authState.items;
    let found = false;

    for (let i = 0; i < helper.length && !found; i++) {
      if (helper[i].id === item.id) {
        if (helper[i].quantity > 1) {
          Helper.reduceSession(helper[i]);
          helper[i].quantity -= 1;
          setAuthState((authState) => ({ ...authState, items: helper }));
          found = true;
        } else if (helper[i].quantity === 1) {
          Helper.reduceSession(helper[i]);
          helper.splice(i, 1);
          setAuthState((authState) => ({ ...authState, items: helper }));
          found = true;
        }
      }
    }
  }

  function removeItem(item) {
    let helper = authState.items;
    let found = false;

    for (let i = 0; i < helper.length && !found; i++) {
      if (helper[i].id === item.id) {
        Helper.removeFromSession(helper[i]);
        helper.splice(i, 1);
        setAuthState((authState) => ({ ...authState, items: helper }));
        found = true;
      }
    }
  }

  function handleChange() {
    setTerms((t) => !t);
  }

  if (loading) return <ProgressBar animated now={100} />;

  if (sent === true) {
    return (
      <Container>
        <div className="mt-5" />
        <div className="text-center">
          <h1>Zlecenie zostało pomyślnie wysłane!</h1>
        </div>
        <div className="mt-5" />
        <div className="text-center">
          <Button onClick={() => navigate.current("/panel/orders")}>
            <div style={style}>Ok</div>
          </Button>
        </div>
      </Container>
    );
  }

  if (verifyError !== "") {
    return (
      <Container>
        <div className="mt-3" />
        <div className="text-center">
          <h1>{verifyError}</h1>
        </div>
      </Container>
    );
  }

  if (authState.items.length === 0 && sent === false) {
    return <Navigate to="/" />;
  }

  return (
    <Container>
      <p> </p>
      <h1>Zamówienie:</h1>

      <hr />
      {items !== [] &&
        items.map((item, index) => {
          return (
            <React.Fragment key={"cart" + index}>
              <Stack direction="horizontal" gap={3}>
                {item.categoryName}: {item.productName} {parseFloat(item.productPrice).toFixed(2)} zł
                <div className="ms-auto">
                  <Button onClick={() => reduceQuantity(item)}>-</Button>
                </div>
                <div>{item.quantity}</div>
                <Button onClick={() => addQuantity(item)}>+</Button>
                <Button variant="warning" onClick={() => removeItem(item)}>
                  Usuń
                </Button>
              </Stack>
              <hr />
            </React.Fragment>
          );
        })}
      <h3>Łącznie: {price}zł</h3>
      <div className="mt-5" />
      <h1>Dane:</h1>
      <Row>
        <Col>
          <Row>
            <div className="text-end">Imie:</div>
          </Row>
          <Row>
            <div className="text-end">Email:</div>
          </Row>
          <Row>
            <div className="text-end">Ulica:</div>
          </Row>
          <Row>
            <div className="text-end">Kod pocztowy:</div>
          </Row>
          <Row>
            <div className="text-end">Miasto: </div>
          </Row>
          <Row>
            <div className="text-end">Nr telefonu:</div>
          </Row>
        </Col>
        <Col>
          <Row>{authState.name}</Row>
          <Row>{authState.email}</Row>
          <Row>{authState.street}</Row>
          <Row>{authState.postCode}</Row>
          <Row>{authState.town}</Row>
          <Row>{authState.telephone}</Row>
        </Col>
      </Row>
      <div className="mt-2" />
      <div className="text-center">
        <Button onClick={() => navigate.current("/panel/settings")}>Zmień dane</Button>
      </div>
      <p></p>
      <Form>
        <Form.Group controlId="formComments" className="mb-3">
          <Form.Label>Komentarz</Form.Label>
          <Form.Control as="textarea" placeholder="Dodatkowe informacje dla restauracji i dostawcy" onChange={(e) => setComment(e.target.value)} />
        </Form.Group>
      </Form>
      <Row>
        <Col></Col>
        <Col></Col>
        <Col>
          <Form>
            <Form.Check type="switch" id="terms">
              <Form.Check.Input type="checkbox" onChange={handleChange} isInvalid={!terms} />
              <Form.Check.Label>Zamawiam z obowiązkiem zapłaty</Form.Check.Label>
              <Form.Control.Feedback type="invalid">Musisz zaakceptować aby złożyć zamówienie</Form.Control.Feedback>
            </Form.Check>
          </Form>
        </Col>
      </Row>
      <div className="text-end">{errorMessage !== "" && <div className="text-danger">{errorMessage}</div>}</div>
      <div className="mt-3" />
      <div className="text-end">
        <Button variant="secondary" onClick={() => navigate.current("/")}>
          Anuluj
        </Button>
        <> </>
        <Button disabled={terms === false} onClick={handleSubmit}>
          Zamawiam
        </Button>
      </div>
    </Container>
  );
}
