import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { Button, Col, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function WorkerOrderComponent({
  order: {
    OrderStatus,
    comment,
    totalPrice,
    OrderProducts,
    id,
    date,
    Customer: { name, street, postCode, town, email, telephone },
    Change,
  },
  reload,
  index,
  use,
  variant,
}) {
  const reloadSameCursor = useRef(reload);
  const cid = useRef(index);
  const setActive = useRef(use[1]);
  const active = use[0];
  const navigate = useRef(useNavigate());

  const [t, setT] = useState([]);
  const [status, setStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [payload, setPayload] = useState();
  const first = useRef(true);

  useEffect(() => {
    function checkName() {
      if (OrderStatus) {
        const x = OrderStatus.name;
        if (x === "started") return "Czeka na potwierdzenie";
        if (x === "accepted") return "W trakcie";
        if (x === "rejected") return "Odrzucone";
        if (x === "finished") return "Wysłane";
      }
    }
    function formatDate() {
      const output = [];
      const d = new Date(date);
      output.push(d.getDate());
      output.push(d.getMonth() + 1);
      output.push(d.getFullYear());
      output.push(d.getHours());
      output.push(d.getMinutes());
      output.push(d.getSeconds());
      return output.map((number) => {
        return number < 10 ? ("0" + number).slice(-2) : number;
      });
    }
    setT(formatDate());
    setStatus(checkName());
  }, [OrderStatus, date]);

  const changeActive = useCallback(() => {
    setActive.current((active) => (active === cid ? -1 : cid));
  }, []);

  useEffect(() => {
    if (first.current) {
      console.log("first");
      first.current = false;
      return;
    }
    const controller = new AbortController();
    async function updateOrder() {
      const result = await axios({
        method: "POST",
        data: payload,
        signal: controller.signal,
        withCredentials: true,
        url: "http://localhost:8000/worker/orders/update",
      })
        .then((response) => {
          setErrorMessage("");
          changeActive();
          reloadSameCursor.current(cid);
          return response.data;
        })
        .catch((error) => {
          if (error?.message === "canceled") {
            console.log("canceled");
            return undefined;
          }
          if (!error.response) {
            setErrorMessage("Nie udało połączyć się z serwerem, spróbuj odświeżyć stronę");
            return undefined;
          }
          setErrorMessage(error?.response?.data?.message);
          if (error?.response?.data?.logout) navigate.current("/logout");
          return error;
        });
      return result;
    }
    updateOrder();

    return () => {
      controller.abort();
      console.log("WorkerOrderComp aborted");
    };
  }, [changeActive, payload]);

  async function accept() {
    const OrderStatusName = "accepted";
    setPayload({ OrderStatusName, id });
  }

  async function reject() {
    const OrderStatusName = "rejected";
    setPayload({ OrderStatusName, id });
  }

  async function finish() {
    const OrderStatusName = "finished";
    setPayload({ OrderStatusName, id });
  }

  return (
    <>
      <tr>
        <td>{id}</td>
        <td>
          <Button onClick={changeActive} disabled={status === "Wysłane" || status === "Odrzucone"}>
            {active !== cid ? "Edytuj" : <div>Zamknij</div>}
          </Button>
          <br />
        </td>
        <td>
          {name}
          <br />
          {street} <br />
          {postCode} {town} <br />
          {email} <br />
          {telephone} <br />
        </td>
        <td>{status}</td>
        <td>{comment}</td>
        <td>{totalPrice.toFixed(2)} zł</td>
        <td>
          {OrderProducts.map((OrderProduct) => {
            return (
              <div key={"order" + id + "prod" + OrderProduct.Product.id}>
                {OrderProduct.Product.Category.categoryName}: {OrderProduct.Product.productName} x {OrderProduct.productQuantity}
              </div>
            );
          })}
        </td>
        <td>
          {t[0]}.{t[1]}.{t[2]} {t[3]}:{t[4]}:{t[5]}
        </td>
        {(variant === "finished" || variant === "rejected") && (
          <td>
            {Change.map((i) => {
              return <p key={`change: ${i.id}`}>{i.description}</p>;
            })}
          </td>
        )}
      </tr>
      {errorMessage !== "" && (
        <tr>
          <td colSpan={8}>
            <div className="text-center">
              <div className="text-danger">{errorMessage}</div>
            </div>
          </td>
        </tr>
      )}
      {active === cid && (
        <tr>
          <td colSpan={8}>
            <Row>
              {variant === "started" && (
                <>
                  <Col>
                    <div className="text-center">
                      Zmień stan na:{" "}
                      <Button variant="success" disabled={false} onClick={accept}>
                        Przyjęte
                      </Button>
                    </div>
                  </Col>
                  <Col>
                    <div className="text-center">
                      Zmień stan na:{" "}
                      <Button variant="danger" disabled={false} onClick={reject}>
                        Odrzucone
                      </Button>
                    </div>
                  </Col>
                </>
              )}
              {variant === "accepted" && (
                <Col>
                  <div className="text-center">
                    Zmień stan na:{" "}
                    <Button variant="warning" disabled={false} onClick={finish}>
                      Wysłane
                    </Button>
                  </div>
                </Col>
              )}
            </Row>
          </td>
        </tr>
      )}
    </>
  );
}
