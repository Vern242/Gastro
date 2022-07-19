import React, { useState, useContext, useRef, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Button, Container, Form, Col, Row, InputGroup, Alert, ProgressBar } from "react-bootstrap";
import { Formik } from "formik";
import * as yup from "yup";
import axios from "axios";
import { AuthContext } from "../../GlobalState";
import { useNavigate, Navigate } from "react-router-dom";

let pass = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[`!@#$%^&*])(?=.{8,})");

const schema = yup.object().shape({
  password: yup.string().required("Podaj hasło").matches(pass, "Hasło musi zawierać 8 znaków, 1 dużą literę, 1 małą literę, 1 numer i 1 znak specjalny"),
  newPasswordConfirmation: yup
    .string()
    .required("Potwierdź hasło")
    .oneOf([yup.ref("newPassword"), null], "Hasła muszą sie zgadzać"),
  newPassword: yup.string().required("Podaj hasło").matches(pass, "Hasło musi zawierać 8 znaków, 1 dużą literę, 1 małą literę, 1 numer i 1 znak specjalny"),
  terms: yup.bool().required().oneOf([true], "Musisz potwierdzić aby zmienić hasło"),
});

export default function WorkerSettings() {
  const [authState] = useContext(AuthContext);
  const [errorMessage, setErrorMessage] = useState("");
  const [sent, setSent] = useState("");
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState();
  const [x, setX] = useState(true);
  const first = useRef(true);
  const navigate = useRef(useNavigate());

  let style = {
    fontSize: 40 + "px",
    display: "inline",
  };

  async function handleSubmit(values) {
    setPayload({ ...values, email: authState.email });
  }

  function showData() {
    setX(true);
  }

  function showChangePass() {
    setX(false);
  }

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const controller = new AbortController();

    async function changePassword() {
      //const pass = "6wFczFLH999W5WY!";    @TEST DATA
      //const newPass = "6wFczFLH999W5WY";
      setLoading(true);
      const result = await axios({
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
        //data: { password: pass, newPassword: newPass, email: authState.email },  @test data
        data: payload,
        signal: controller.signal,
        withCredentials: true,
        url: "http://localhost:8000/worker/updatePassword",
      })
        .then((response) => response.data)
        .then((data) => {
          setSent("Hasło zostało zmienione pomyślnie!");
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
            setErrorMessage("Nie udało połączyć się z serwerem, spróbuj odświeżyć stronę");
            return undefined;
          }
          setErrorMessage(error?.response?.data?.message);
          if (error?.response?.data?.logout) navigate.current("/logout");
          return error;
        });
      return result;
    }

    changePassword();

    return () => {
      controller.abort();
    };
  }, [payload]);

  if (authState.role !== "worker") return <Navigate to="/" />;

  if (sent !== "")
    return (
      <Container>
        <div className="mt-3" />
        <div className="text-center">
          <h1>{sent}</h1>
          <div className="mt-3" />
          <Button onClick={() => setSent("")}>
            <div style={style}>Ok</div>
          </Button>
        </div>
      </Container>
    );

  return (
    <Container>
      <p></p>
      <Button variant="dark" onClick={showData}>
        <h2>Pokaż dane</h2>
      </Button>
      <> </>
      <Button variant="dark" onClick={showChangePass}>
        <h2>Zmień hasło</h2>
      </Button>
      <div className="mt-5" />

      {loading && <ProgressBar animated now={100} />}
      {x && (
        <Row>
          <Form.Group as={Col} md="4" controlId="validationFormik01">
            <Form.Label>Login</Form.Label>
            <InputGroup>
              <Form.Control type="text" placeholder="Email" name="email" value={authState.username} disabled />
            </InputGroup>
          </Form.Group>
          <Form.Group as={Col} md="4" controlId="validationFormik02">
            <Form.Label>Imię i nazwisko</Form.Label>
            <InputGroup>
              <Form.Control type="text" placeholder="ImieNazwisko" name="name" value={authState.name} disabled />
            </InputGroup>
          </Form.Group>
        </Row>
      )}
      {!loading && !x && (
        <Formik
          validationSchema={schema}
          onSubmit={async (values, { setFieldValue }) => {
            await handleSubmit(values);
            if (sent !== "") {
              setFieldValue("password", "");
              setFieldValue("newPassword", "");
              setFieldValue("newPasswordConfirmation", "");
              setFieldValue("terms", false);
            }
          }}
          initialValues={{
            password: "",
            newPasswordConfirmation: "",
            newPassword: "",
            terms: false,
          }}
        >
          {({ handleSubmit, handleChange, handleBlur, values, touched, isValid, errors, isSubmitting }) => (
            <Form onSubmit={handleSubmit} className="mt-3">
              <Row className="mb-3">
                <Form.Group as={Col} md="4" controlId="passFormik03">
                  <Form.Label>Nowe hasło</Form.Label>
                  <InputGroup hasValidation>
                    <Form.Control type="password" placeholder="Nowe hasło" name="newPassword" autoComplete="new-password" value={values.newPassword} onBlur={handleBlur} onChange={handleChange} isInvalid={!!errors.newPassword} isValid={touched.newPassword && !errors.newPassword} />
                    <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>
                <Form.Group as={Col} md="4" controlId="passFormik02">
                  <Form.Label>Potwierdź nowe hasło</Form.Label>
                  <InputGroup hasValidation>
                    <Form.Control
                      type="password"
                      placeholder="Potwierdź nowe hasło"
                      name="newPasswordConfirmation"
                      autoComplete="new-password"
                      value={values.newPasswordConfirmation}
                      onBlur={handleBlur}
                      onChange={handleChange}
                      isInvalid={!!errors.newPasswordConfirmation}
                      isValid={touched.newPasswordConfirmation && !errors.newPasswordConfirmation}
                    />
                    <Form.Control.Feedback type="invalid">{errors.newPasswordConfirmation}</Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>
              </Row>
              <Row className="mb-3">
                <Form.Group as={Col} md="4" controlId="passFormik01">
                  <Form.Label>Hasło</Form.Label>
                  <InputGroup hasValidation>
                    <Form.Control type="password" placeholder="Stare hasło" name="password" autoComplete="new-password" value={values.password} onChange={handleChange} onBlur={handleBlur} isInvalid={!!errors.password} isValid={touched.password && !errors.password} />
                    <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>
              </Row>
              <Form.Group className="mb-3">
                <Form.Check required name="terms" label="Potwierdzam " onChange={handleChange} onBlur={handleBlur} isInvalid={!!errors.terms} feedback={errors.terms} feedbackType="invalid" id="passFormik0" />
              </Form.Group>
              <Button type="submit" disabled={Object.keys(errors).length !== 0 && !isValid}>
                Zmień hasło
              </Button>
              <div className="mt-3"></div>
              {errorMessage !== "" && (
                <Alert variant="danger" dismissible onClose={() => setErrorMessage("")}>
                  {errorMessage}
                </Alert>
              )}
            </Form>
          )}
        </Formik>
      )}
    </Container>
  );
}
