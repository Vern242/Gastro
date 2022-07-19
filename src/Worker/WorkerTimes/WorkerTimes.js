import React, { useEffect, useState, useRef, useContext } from "react";
import { Table, Container, ProgressBar } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { Navigate, useNavigate } from "react-router-dom";
import WorkerTimeComponent from "./WorkerTimeComponent";
import { AuthContext } from "../../GlobalState";

export default function WorkerTimes() {
  const [authState] = useContext(AuthContext);
  const [times, setTimes] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [x, setX] = useState(false);
  const [focus, setFocus] = useState(-1);
  const [loading, setLoading] = useState(true);
  const navigate = useRef(useNavigate());

  useEffect(() => {
    console.log("Main use effect..");
    const controller = new AbortController();
    async function getTimes() {
      setLoading(true);
      const result = await axios({
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        method: "GET",
        withCredentials: true,
        url: "http://localhost:8000/times/read",
      })
        .then((res) => res.data.data)
        .then((data) => {
          console.log("Main fetched..");
          setTimes(data.times);
          setLoading(false);
          return data;
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
    getTimes();

    return () => {
      controller.abort();
      console.log("Main dispatch..");
    };
  }, [x]);

  function update() {
    setX((x) => !x);
  }

  if (!authState.isAdmin) return <Navigate to={"/"} />;

  if (loading) return <ProgressBar animated now={100} />;

  if (errorMessage !== "")
    return (
      <Container>
        <h1 className="mt-2">{errorMessage ? errorMessage : <div>Nie udało się połączyć z serwerem, spróbuj odświeżyć stronę</div>}</h1>
      </Container>
    );

  return (
    <Container>
      <p></p>
      <Table striped bordered hover>
        <thead>
          <tr>
            <td>Akcja</td>
            <td>Dzień</td>
            <td>Czas otwarcia</td>
            <td>Czas zamknięcia</td>
            {focus !== -1 && <td>Akcja</td>}
          </tr>
        </thead>
        <tbody>
          {times.length > 0 &&
            times.map((time, index) => {
              return <WorkerTimeComponent key={index} data={time} update={update} focus={[focus, setFocus]} cid={index} />;
            })}
        </tbody>
      </Table>
    </Container>
  );
}
