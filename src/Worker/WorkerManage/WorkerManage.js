import { AuthContext } from "../../GlobalState";
import React, { useEffect, useContext, useState, useRef } from "react";
import { Button, Container, Table, ProgressBar } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { Navigate, useNavigate } from "react-router-dom";
import WorkerCreate from "./WorkerCreate";
import WorkerComponent from "./WorkerComponent";

export default function WorkerManage() {
  const [authState] = useContext(AuthContext);
  const [errorMessage, setErrorMessage] = useState("");
  const [active, setActive] = useState(-1);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadedAll, setLoadedAll] = useState(false);
  const navigate = useRef(useNavigate());
  const perPage = 4;
  const totalResults = useRef(0);

  const [payload, setPayload] = useState({
    perPage: perPage,
  });

  //mozna dodac drugi tab z kontami nieaktywnymi

  useEffect(() => {
    const controller = new AbortController();

    async function fetchWorkers() {
      const result = await axios({
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
        data: payload,
        signal: controller.signal,
        withCredentials: true,
        url: "http://localhost:8000/worker/read",
      })
        .then((response) => response.data)
        .then((data) => {
          if (data.data.length < payload.perPage) setLoadedAll(true);
          setWorkers((w) => [...w, ...data.data]);
          totalResults.current += payload.perPage;
          setLoading(false);
          return data;
        })
        .catch((error) => {
          if (error?.message === "canceled") {
            return undefined;
          }
          setLoading(false);
          if (!error?.response) {
            setErrorMessage("Nie udało połączyć się z serwerem");
            return undefined;
          }
          setErrorMessage(error?.response?.data?.message);
          if (error?.response?.data?.logout) navigate.current("/logout");
          return error;
        });
      return result;
    }
    console.log("Main fetching workers..");
    fetchWorkers();

    return () => {
      console.log("Main aborting fetch..");
      controller.abort();
    };
  }, [payload]);

  function update() {
    const results = totalResults.current; //pobieram ilosc wynikow wyswietlonych na stronie TERAZ
    totalResults.current = 0; //resetuje licznik wynikow
    setWorkers([]); //czyszcze liste przed fetchem
    setPayload({ perPage: results }); //wysylam żądanie o tyle wynikow ile bylo poprzednio, totalResults zostanie zwiekszone w fetchu o tyle
  }

  function loadMore() {
    const w = workers;
    const cursor = w[w.length - 1].id;
    setPayload({ perPage, cursor });
  }

  if (!(authState.canEditWorkers || authState.isAdmin)) return <Navigate to={"/"} />;

  if (loading) return <ProgressBar animated now={100} />;

  if (errorMessage !== "")
    return (
      <Container>
        <h1>{errorMessage}</h1>
      </Container>
    );

  return (
    <>
      <p></p>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Akcje</th>
            <th>id</th>
            <th>Login</th>
            <th>Imie i nazwisko</th>
            {authState.isAdmin && (
              <>
                <th>Moze edytować menu</th>
                <th>Moze edytować pracowników</th>
                <th>Prawa admina</th>
              </>
            )}
            <th>Stan konta</th>
          </tr>
        </thead>
        <tbody>
          {workers.map((worker) => {
            return <WorkerComponent key={worker.id} data={worker} active={[active, setActive]} update={update} />;
          })}
        </tbody>
      </Table>
      <div className="text-center">
        <WorkerCreate update={loadMore} />

        {!loadedAll && (
          <>
            <hr />
            <Button onClick={loadMore}>Pokaż więcej..</Button>
          </>
        )}
      </div>
    </>
  );
}
