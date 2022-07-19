import { AuthContext } from "../../GlobalState";
import React, { useEffect, useContext, useState, useRef, useCallback } from "react";
import { Button, Form } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function WorkerComponent(data) {
  const { canEditMenu, canEditWorkers, isActive, isAdmin, name, username, id } = data.data;
  const [authState] = useContext(AuthContext);
  const [active, setActive] = data.active;
  const setEdit = useRef(setActive);
  const update = useRef(data.update);
  const first = useRef(true);

  const [errorMessage, setErrorMessage] = useState("");
  const [payload, setPayload] = useState();
  const navigate = useRef(useNavigate());

  const [cem, setCem] = useState(canEditMenu || false);
  const [cew, setCew] = useState(canEditWorkers || false);
  const [admin, setAdmin] = useState(isAdmin || false);
  const [ia, setIa] = useState(isActive);

  //tylko admin moze zarzadzac menedzerami
  //menedzer nie widzi adminow i menedzerow
  //admin widzi wszystko
  //manager nie moze dodawac menedzerow / adminow - tych pól nie powienien wcale widziec
  //manager moze dodawac normalnych pracownikow (przechodzenie przez zamowienia) i ich edytować

  const changeActive = useCallback(() => {
    setEdit.current((active) => (active === id ? -1 : id));
    setErrorMessage("");
  }, [id]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const controller = new AbortController();

    async function updateWorker() {
      const result = await axios({
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        data: payload,
        signal: controller.signal,
        method: "POST",
        withCredentials: true,
        url: "http://localhost:8000/worker/update",
      })
        .then((res) => {
          changeActive();
          update.current();
          return res;
        })
        .catch((error) => {
          if (error?.message === "canceled") {
            return undefined;
          }
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
    console.log("Component updates..");
    updateWorker();

    return () => {
      console.log("Component unmounting..");
      controller.abort();
    };
  }, [changeActive, payload]);

  function submit() {
    if (validate()) {
      setPayload({
        id,
        canEditMenu: cem,
        canEditWorkers: cew,
        isAdmin: admin,
        isActive: ia,
      });
    }
  }

  function validate() {
    if (!(canEditMenu !== cem || canEditWorkers !== cew || isAdmin !== admin || isActive !== ia)) {
      setErrorMessage("Dane nie uległy zmianie");
      return false;
    }
    setErrorMessage("");
    return true;
  }

  function handle(type, val) {
    if (type === "cem") setCem(val === "true");
    if (type === "cew") setCew(val === "true");
    if (type === "admin") setAdmin(val === "true");
    if (type === "ia") setIa(val === "true");
  }

  return (
    <>
      {active !== id && (
        <tr>
          <td>
            <Button onClick={changeActive}>Edytuj</Button>
          </td>
          <td>{id}</td>
          <td>{username}</td>
          <td>{name}</td>
          {authState.isAdmin && (
            <>
              <td>{canEditMenu ? "Tak" : "Nie"}</td>
              <td>{canEditWorkers ? "Tak" : "Nie"}</td>
              <td>{isAdmin ? "Tak" : "Nie"}</td>
            </>
          )}
          <td>{isActive ? "Aktywne" : "Nieaktywne"}</td>
        </tr>
      )}
      {active === id && (
        <>
          <tr>
            <td>
              <Button onClick={changeActive}>Zamknij</Button>
            </td>
            <td>{id}</td>
            <td>{username}</td>
            <td>{name}</td>
            {authState.isAdmin && (
              <>
                <td>
                  <Form.Select name="canEditMenu" onChange={(e) => handle("cem", e.target.value)} value={cem} disabled={!authState.isAdmin}>
                    <option value={false}>Nie</option>
                    <option value={true}>Tak</option>
                  </Form.Select>
                </td>
                <td>
                  <Form.Select name="canEditWorkers" onChange={(e) => handle("cew", e.target.value)} value={cew} disabled={!authState.isAdmin}>
                    <option value={false}>Nie</option>
                    <option value={true}>Tak</option>
                  </Form.Select>
                </td>
                <td>
                  <Form.Select name="isAdmin" onChange={(e) => handle("admin", e.target.value)} value={admin} disabled={!authState.isAdmin}>
                    <option value={false}>Nie</option>
                    <option value={true}>Tak</option>
                  </Form.Select>
                </td>
              </>
            )}
            <td>
              <Form.Select name="isActive" onChange={(e) => handle("ia", e.target.value)} value={ia}>
                <option value={false}>Nieaktywne</option>
                <option value={true}>Aktywne</option>
              </Form.Select>
            </td>
          </tr>
          <tr>
            <td colSpan={8}>
              <div className="text-center">
                <div className="text-danger">{errorMessage}</div>
              </div>
              <div className="mt-2" />
              <div className="text-center">
                <Button variant="success" onClick={submit}>
                  Potwierdź zmianę
                </Button>
              </div>
            </td>
          </tr>
        </>
      )}
    </>
  );
}
