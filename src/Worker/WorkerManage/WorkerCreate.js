import React, { useEffect, useRef, useState, useContext } from "react";
import { Button, Container, Row, Col, Form, InputGroup, Modal } from "react-bootstrap";
import { Formik } from "formik";
import { AuthContext } from "../../GlobalState";
import * as yup from "yup";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

let pass = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[`!@#$%^&*])(?=.{8,})");

const schema = yup.object().shape({
  username: yup.string().min(4, "Podaj przynajmniej 4 znaki").required("Podaj login"),
  name: yup.string().required("Podaj imie i nazwisko"),
  password: yup.string().required("Podaj hasło").matches(pass, "Hasło musi zawierać 8 znaków, 1 dużą literę, 1 małą literę, 1 numer i 1 znak specjalny"),
  passwordConfirmation: yup
    .string()
    .required("Potwierdź hasło")
    .oneOf([yup.ref("password"), null], "Hasła muszą sie zgadzać"),
  canEditMenu: yup.bool().required(),
  canEditWorkers: yup.bool().required(),
  isAdmin: yup.bool().required(),
  isActive: yup.bool().required(),
  terms: yup.bool().required().oneOf([true], "Musisz zgodzić się aby utworzyć konto"),
});

export default function WorkerCreate(data) {
  const [authState] = useContext(AuthContext);
  const changingUpdate = data.update;
  const update = useRef(changingUpdate);
  const start = useRef(true);
  const [payload, setPayload] = useState();
  const [sw, setSw] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useRef(useNavigate());

  function flip() {
    setSw((sw) => !sw);
    setErrorMessage("");
  }

  useEffect(() => {
    //funkcja zmienia sie za kazdym razem gdy wyswietleni sa nowi pracownicy
    //nie chcemy za kazdym razem gdy ona sie zmienia wysylac fetcha - czyli uzywac changingUpdate zamiast update
    //za kazdym razem wiec jak sie zmienia, my dostosowujemy nasza funkcje aby byla taka sama
    update.current = changingUpdate;
  }, [changingUpdate]);

  useEffect(() => {
    if (start.current) {
      start.current = false;
      return;
    }
    const controller = new AbortController();

    async function createWorker() {
      const result = await axios({
        method: "POST",
        data: payload,
        signal: controller.signal,
        withCredentials: true,
        url: "http://localhost:8000/worker/create",
      })
        .then((response) => {
          flip();
          update.current();
          return response.data;
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
    createWorker();

    return () => {
      controller.abort();
    };
  }, [payload]);

  async function handleSubmit(e) {
    setPayload(formatData(e));
  }

  function formatData(data) {
    data.canEditMenu = data.canEditMenu.toString() === "true";
    data.canEditWorkers = data.canEditWorkers.toString() === "true";
    data.isAdmin = data.isAdmin.toString() === "true";
    return data;
  }

  return (
    <Container>
      <Button onClick={flip}>Dodaj pracownika</Button>
      <Modal show={sw} backdrop="static" keyboard={false}>
        <Modal.Header>
          <Modal.Title>Tworzenie pracownika</Modal.Title>
        </Modal.Header>
        <Formik
          validationSchema={schema}
          onSubmit={(e) => handleSubmit(e)}
          initialValues={{
            username: "",
            name: "",
            password: "",
            passwordConfirmation: "",
            canEditMenu: false,
            canEditWorkers: false,
            isAdmin: false,
            isActive: true,
            terms: false,
          }}
        >
          {({ handleSubmit, handleChange, handleBlur, values, touched, isValid, errors }) => (
            <Form onSubmit={handleSubmit}>
              <Modal.Body>
                <Row className="mb-3">
                  <Form.Group as={Col} controlId="validationFormik01">
                    <Form.Label>Login</Form.Label>
                    <InputGroup hasValidation>
                      <Form.Control type="text" placeholder="Login" name="username" value={values.username} onChange={handleChange} onBlur={handleBlur} isInvalid={!!errors.username} isValid={touched.username && !errors.username} />
                      <Form.Control.Feedback type="invalid">{errors.username}</Form.Control.Feedback>
                    </InputGroup>
                  </Form.Group>
                  <Form.Group as={Col} controlId="validationFormik02">
                    <Form.Label>Imie i nazwisko</Form.Label>
                    <InputGroup hasValidation>
                      <Form.Control type="text" placeholder="Imie i nazwisko" name="name" value={values.name} onChange={handleChange} onBlur={handleBlur} isInvalid={!!errors.name} isValid={touched.name && !errors.name} />
                      <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                    </InputGroup>
                  </Form.Group>
                </Row>
                <Row className="mb-3">
                  <Form.Group as={Col} controlId="validationFormik03">
                    <Form.Label>Hasło</Form.Label>
                    <InputGroup hasValidation>
                      <Form.Control type="password" placeholder="Hasło" name="password" value={values.password} onChange={handleChange} onBlur={handleBlur} isInvalid={!!errors.password} isValid={touched.password && !errors.password} />
                      <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                    </InputGroup>
                  </Form.Group>
                  <Form.Group as={Col} controlId="validationFormik04">
                    <Form.Label>Potwierdź hasło</Form.Label>
                    <InputGroup hasValidation>
                      <Form.Control type="password" placeholder="Hasło" name="passwordConfirmation" value={values.passwordConfirmation} onChange={handleChange} onBlur={handleBlur} isInvalid={!!errors.passwordConfirmation} isValid={touched.passwordConfirmation && !errors.passwordConfirmation} />
                      <Form.Control.Feedback type="invalid">{errors.passwordConfirmation}</Form.Control.Feedback>
                    </InputGroup>
                  </Form.Group>
                </Row>
                <Form.Group as={Row} className="mb-3" controlId="validationFormik05">
                  <Form.Label column>Może edytować menu</Form.Label>
                  <Col>
                    <Form.Select name="canEditMenu" onChange={handleChange} onBlur={handleBlur} value={values.canEditMenu} disabled={!authState.isAdmin}>
                      <option value={false}>Nie</option>
                      <option value={true}>Tak</option>
                    </Form.Select>
                  </Col>
                </Form.Group>
                <Form.Group as={Row} className="mb-3" controlId="validationFormik06">
                  <Form.Label column>Może zarządzać pracownikami</Form.Label>
                  <Col>
                    <Form.Select name="canEditWorkers" onChange={handleChange} onBlur={handleBlur} value={values.canEditWorkers} disabled={!authState.isAdmin}>
                      <option value={false}>Nie</option>
                      <option value={true}>Tak</option>
                    </Form.Select>
                  </Col>
                </Form.Group>
                <Form.Group as={Row} className="mb-3" controlId="validationFormik07">
                  <Form.Label column>Uprawnienia administratora</Form.Label>
                  <Col>
                    <Form.Select name="isAdmin" onChange={handleChange} onBlur={handleBlur} value={values.isAdmin} disabled={!authState.isAdmin}>
                      <option value={false}>Nie</option>
                      <option value={true}>Tak</option>
                    </Form.Select>
                  </Col>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Check required name="terms" label="Potwierdzam utworzenie nowego użytkownika" onChange={handleChange} onBlur={handleBlur} isInvalid={!!errors.terms} feedback={errors.terms} feedbackType="invalid" id="validationFormik0" />
                </Form.Group>
                {errorMessage !== "" && <div className="text-danger">{errorMessage}</div>}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={flip}>
                  Anuluj
                </Button>{" "}
                <Button type="submit" disabled={!(Object.keys(errors).length === 0 && isValid)}>
                  Utwórz konto
                </Button>
              </Modal.Footer>
            </Form>
          )}
        </Formik>
      </Modal>
    </Container>
  );
}
