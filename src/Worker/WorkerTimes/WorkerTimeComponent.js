import React, { useCallback, useEffect, useRef, useState, useContext } from "react";
import { Button, InputGroup, Form } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Helper from "../../Helper";
import { AuthContext } from "../../GlobalState";

export default function WorkerTimeComponent(data) {
  const [authState] = useContext(AuthContext);
  const { day, start, end } = data.data;
  const [focus, setFocus] = data.focus;
  const cid = data.cid;
  const update = useRef(data.update);
  const first = useRef(true);
  const navigate = useRef(useNavigate());

  const [errorMessage, setErrorMessage] = useState("");
  const [payload, setPayload] = useState();

  const [d, setD] = useState("");
  const [sh, setSh] = useState("");
  const [eh, setEh] = useState("");
  const [sm, setSm] = useState("");
  const [em, setEm] = useState("");

  const [shInput, setShInput] = useState("");
  const [ehInput, setEhInput] = useState("");
  const [smInput, setSmInput] = useState("");
  const [emInput, setEmInput] = useState("");

  const width = {
    maxWidth: 55,
  };

  function setInputs(sh, eh, sm, em) {
    setShInput(sh);
    setEhInput(eh);
    setSmInput(sm);
    setEmInput(em);
  }

  useEffect(() => {}, []);

  useEffect(() => {
    console.log("Component: Initial setup");

    function formatDate() {
      const arr = [];
      const s = new Date(start);
      const e = new Date(end);
      const o = Helper.getOffset(authState.offset);

      const sh = s.getUTCHours() - o[0];
      const eh = e.getUTCHours() - o[0];
      const sm = s.getUTCMinutes() - o[1];
      const em = e.getUTCMinutes() - o[1];

      arr.push(sh);
      arr.push(eh);
      arr.push(sm);
      arr.push(em);

      const t = arr.map((number) => {
        return number < 10 ? ("0" + number).slice(-2) : number.toString();
      });

      setD(day);
      setSh(t[0]);
      setEh(t[1]);
      setSm(t[2]);
      setEm(t[3]);
      setInputs(t[0], t[1], t[2], t[3]);
    }
    formatDate();
  }, [day, start, end, authState.offset]);

  const changeFocus = useCallback(() => {
    setFocus((focus) => (focus === cid ? -1 : cid));
    setErrorMessage("");
  }, [cid, setFocus]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    console.log("Component: update function..");
    const controller = new AbortController();
    async function updateTime() {
      const result = await axios({
        method: "POST",
        data: payload,
        signal: controller.signal,
        withCredentials: true,
        url: "http://localhost:8000/times/update",
      })
        .then((response) => {
          console.log("Comp: success");
          setErrorMessage("");
          update.current();
          changeFocus();
          return response.data;
        })
        .catch((error) => {
          console.log("Comp: catch: " + error);
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
    updateTime();

    return () => {
      console.log("Abort WorkerTimeComponent");
      controller.abort();
    };
  }, [changeFocus, payload]);

  function validation() {
    const HR = new RegExp("^(([0-1][0-9])|(2[0-3])|[0-9])$"); // 0 to 9 or 00 to 23
    const MR = new RegExp("^(([0-5][0-9])|[0-9])$"); // 0 to 9 or 00 to 59
    if (shInput === sh && smInput === sm && ehInput === eh && emInput === em) {
      setErrorMessage("Podany dzień ma już ustawiony podany czas");
      return false;
    }

    const o = Helper.getOffset(authState.offset);
    const startHours = parseInt(shInput) + o[0];
    const endHours = parseInt(ehInput) + o[0];

    if (startHours < 0 || startHours > 23) {
      setErrorMessage("Podaj godzinę otwarcia od " + -o[0] + " do 23");
      return false;
    }

    if (endHours < 0 || endHours > 23) {
      setErrorMessage("Podaj godzinę zamknięcia od " + -o[0] + " do 23");
      return false;
    }

    if (!HR.test(shInput) || !HR.test(ehInput)) {
      setErrorMessage("Błędne godziny");
      return false;
    }

    if (!MR.test(smInput) || !MR.test(emInput)) {
      setErrorMessage("Błędne minuty");
      return false;
    }

    return true;
  }

  function submit() {
    const valid = validation();
    if (!valid) {
      return false;
    }
    if (valid) {
      const o = Helper.getOffset(authState.offset);
      console.log(o);
      const startHours = parseInt(shInput) + o[0];
      const endHours = parseInt(ehInput) + o[0];
      const startMinutes = parseInt(smInput) + o[1];
      const endMinutes = parseInt(emInput) + o[1];

      const changes = { day, startHours, startMinutes, endHours, endMinutes };

      setPayload(changes);
    }
  }

  return (
    <>
      <tr>
        {focus !== cid && (
          <>
            <td>
              <Button onClick={changeFocus}>Edytuj</Button>{" "}
            </td>
            <td>{d}</td>
            <td>
              {sh}:{sm}
            </td>
            <td>
              {eh}:{em}
            </td>
          </>
        )}
        {focus === cid && (
          <>
            <td>
              <Button onClick={changeFocus}>Zamknij</Button>
            </td>
            <td>{d}</td>
            <td>
              <InputGroup>
                <Form.Control maxLength={2} style={width} value={shInput} placeholder={"hh"} onChange={(e) => setShInput(e.target.value)} />
                <InputGroup.Text>:</InputGroup.Text>
                <Form.Control maxLength={2} style={width} value={smInput} placeholder={"mm"} onChange={(e) => setSmInput(e.target.value)} />
              </InputGroup>
            </td>
            <td>
              <InputGroup>
                <Form.Control maxLength={2} style={width} value={ehInput} placeholder={"hh"} onChange={(e) => setEhInput(e.target.value)} />
                <InputGroup.Text>:</InputGroup.Text>
                <Form.Control maxLength={2} style={width} value={emInput} placeholder={"mm"} onChange={(e) => setEmInput(e.target.value)} />
              </InputGroup>
            </td>
            <td>
              <Button constiant="success" onClick={submit}>
                Aktualizuj
              </Button>
            </td>
          </>
        )}
      </tr>
      {errorMessage !== "" && (
        <tr>
          <td colSpan={5}>
            <div className="text-center">
              <div className="text-danger">{errorMessage}</div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
