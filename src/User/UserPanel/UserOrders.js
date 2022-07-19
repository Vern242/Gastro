import React, { useState, useContext, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Button, Container, ProgressBar, Table } from "react-bootstrap";
import axios from "axios";
import { AuthContext } from "../../GlobalState";
import { useNavigate, Navigate } from "react-router-dom";
import OrderComponent from "./OrderComponent";
import Pagination from "@vlsergey/react-bootstrap-pagination";

export default function UserOrders() {
  const [authState] = useContext(AuthContext);
  const [orders, setOrders] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 5;

  const [payload, setPayload] = useState({ perPage, skip: 0 });
  const navigate = useRef(useNavigate());

  /*   let style = {
    fontSize: 40 + "px",
    display: "inline",
  }; */

  let styleRefresh = {
    fontSize: 20 + "px",
    display: "inline",
  };

  async function handlePagination(e) {
    const wantedPage = e.target.value; //strony sa od 0
    const skip = wantedPage - currentPage;
    let cursor;
    //setCurrentPage(wantedPage);
    if (wantedPage < currentPage) {
      cursor = orders[0].id;
    }
    if (wantedPage > currentPage) {
      cursor = orders[orders.length - 1].id;
    }
    setPayload({
      perPage,
      skip,
      cursor,
      refresh: false,
      wantedPage: wantedPage, //w ten sposob przekaze nr strony, i pozniej mozna strone ustawic w .then po udanym fetchu
    });
  }

  async function handleRefresh() {
    if (orders === undefined) return;
    setPayload({
      perPage,
      skip: 1,
      cursor: orders[0].id,
      refresh: true,
      wantedPage: currentPage,
    });
  }

  useEffect(() => {
    setLoading(true);
    const controller = new AbortController();
    async function allOrders() {
      const result = await axios({
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        data: payload,
        signal: controller.signal,
        method: "POST",
        withCredentials: true,
        url: "http://localhost:8000/user/allOrders",
      })
        .then((response) => response.data.data)
        .then((data) => {
          setOrders(data.allOrders);
          setTotalPages(data.totalPages);
          setCurrentPage(data.wantedPage);
          setLoading(false);
          setErrorMessage("");
          return data;
        })
        .catch((error) => {
          if (error?.message === "canceled") {
            console.log("canceled");
            return undefined;
          }
          setLoading(false);
          if (!error?.response) {
            setErrorMessage("Nie udało połączyć się z serwerem, spróbuj odświeżyć stronę");
            return undefined;
          }
          setErrorMessage(error?.response?.data?.message);
          if (error?.response?.data?.logout) navigate.current("/logout");
          return error;
        });
      return result;
    }

    allOrders();

    return () => {
      controller.abort();
    };
  }, [payload]);

  if (authState.role !== "customer") return <Navigate to="/" />;

  if (loading) return <ProgressBar animated now={100} />;

  if (errorMessage !== "")
    return (
      <Container>
        <div className="mt-4" />
        <h1 className="text-danger">{errorMessage}</h1>
      </Container>
    );

  return (
    <Container>
      <p></p>
      <h1>
        Twoje aktywne zamówienia{" "}
        <Button variant="success" onClick={handleRefresh} disabled={orders === undefined}>
          <div style={styleRefresh}>Odśwież</div>
        </Button>
      </h1>
      <div className="mt-5"> </div>

      {orders !== undefined && (
        <>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Stan zamówienia</th>
                <th>Komentarz</th>
                <th>Suma</th>
                <th>Produkty</th>
                <th>Data złożenia</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                return <OrderComponent key={order.id} order={order} />;
              })}
            </tbody>
          </Table>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Pagination totalPages={totalPages} value={currentPage} showFirstLast={false} atBeginEnd="3" aroundCurrent={3} onChange={(e) => handlePagination(e)} />
          </div>
        </>
      )}
      {orders === undefined && (
        <>
          <hr />
          <h1>Jeśli złożysz zamówienie pojawi się ono tutaj!</h1>
        </>
      )}
    </Container>
  );
}
