import React, { useEffect, useState, useRef } from "react";
import { Table, Container, ProgressBar } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import WorkerOrderComponent from "./WorkerOrderComponent";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Pagination from "@vlsergey/react-bootstrap-pagination";

export default function WorkerTab({ variant }) {
  const [active, setActive] = useState(-1); //element o jakim id jest teraz w edycji, tylko 1 na danej stronie

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useRef(useNavigate());

  const [orders, setOrders] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const perPage = 5; //ile wyników na strone
  const order = getOrder();
  const [payload, setPayload] = useState({ perPage, filter: variant, order });

  useEffect(() => {
    console.log("WorkerTab use effect..");
    const controller = new AbortController();
    async function getOrders() {
      setLoading(true);
      const result = await axios({
        method: "POST",
        data: payload,
        signal: controller.signal,
        withCredentials: true,
        url: "http://localhost:8000/worker/orders/read",
      })
        .then((res) => res.data.data)
        .then((data) => {
          setErrorMessage("");
          setOrders(data.allOrders);
          setTotalPages(data.totalPages);
          setActive(-1); //wylacz edycje po wyslaniu
          setLoading(false);
          return data.allOrders;
        })
        .catch((error) => {
          if (error?.message === "canceled") {
            console.log("canceled");
            return undefined;
          }
          setLoading(false);
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

    getOrders();

    return () => {
      controller.abort();
      console.log("WorkerTab aborted");
    };
  }, [payload]);

  function update(data) {
    const { skip, cursor, reload } = data;

    setPayload({
      perPage: perPage, // ile wyników na strone
      skip: skip, //oznacza w jakim kierunku przeskakujemy, z strony 3 -> 4 : skip = 1 ; z strony 4 -> 3 : skip = -1
      cursor: cursor, //kursor do paginacji (id elementu poczatkowego)
      filter: variant, //typ zamówienia
      reload: reload, //wyniki wlacznie z kursorem?, np. gdy oswiezamy wyniki z danej strony
      order: order,
    });
  }

  function getOrder() {
    if (variant === "accepted" || variant === "started") return "asc";
    if (variant === "finished" || variant === "rejected") return "desc";
  }

  function handlePagination(e) {
    let cursor;
    const wantedPage = e.target.value;
    const skip = wantedPage - currentPage;
    setCurrentPage(wantedPage);
    if (wantedPage < currentPage) cursor = orders[0].id;
    if (wantedPage > currentPage) cursor = orders[orders.length - 1].id;
    update({ skip, cursor });
  }

  function reloadWithCursor(index) {
    //index ktory updatujemy (zamowienie ktore przechodzi do innego tabu), przeladowac wyniki
    //skip 1 -> bierzemy wartosci w prawo od indeksu, -1 w lewo
    const skip = 1;
    const reload = true;
    //pierwsza strona? zwroc poczatek wynikow, ignoruj kursor
    if (currentPage === 0) {
      console.log("reload with cursor: 1");
      update({ skip, reload });
      return;
    }
    //ostatnia strona z tylko 1 wynikiem? zwroc poczatek wynikow, ignoruj kursor
    if (currentPage === totalPages - 1) {
      if (orders.length === 1) {
        console.log("reload with cursor: 2");
        setCurrentPage(0);
        update({ skip, reload });
        return;
      }
    }
    //zmien kursor na pierwsze zamowienie od gory, ktore nie jest indexem (nie przechodzi na inny tab)
    for (let i = 0; i < orders.length; i++) {
      if (index !== i) {
        console.log("reload with cursor: 3");
        const cursor = orders[i].id;
        console.log("cursor: " + cursor);
        update({ skip, reload, cursor });
        return;
      }
    }
  }

  if (loading) return <ProgressBar animated now={100} />;

  if (errorMessage !== "") {
    return (
      <Container>
        <h1 className="text-danger">{errorMessage}</h1>
      </Container>
    );
  }

  return (
    <>
      <p></p>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>id</th>
            <th>Akcje</th>
            <th>Adres</th>
            <th>Stan zamówienia</th>
            <th>Komentarz</th>
            <th>Suma</th>
            <th>Produkty</th>
            <th>Data złożenia</th>
            {(variant === "finished" || variant === "rejected") && <th>Edycje</th>}
          </tr>
        </thead>
        <tbody>
          {orders.length > 0 &&
            orders.map((order, index) => {
              return <WorkerOrderComponent key={order.id} variant={variant} order={order} use={[active, setActive]} reload={reloadWithCursor} index={index} />;
            })}
        </tbody>
      </Table>
      {orders.length < 1 && <h1>Brak zamówień</h1>}
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
  );
}
