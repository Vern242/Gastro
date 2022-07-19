import React, { useState, useContext, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Button, Container, Form, Col, Row, Alert, InputGroup, ProgressBar } from "react-bootstrap";
import axios from "axios";
import { AuthContext } from "../GlobalState";
import { Navigate } from "react-router-dom";
import { Formik } from "formik";
import * as yup from "yup";

const schema = yup.object().shape({
  email: yup.string().required("Podaj adres email").min(3, "Zbyt krótki email"),
  password: yup.string().required("Podaj hasło").min(8, "Hasło musi zawierać 8 znaków"),
});

export default function Login() {
  const [authState, setAuthState] = useContext(AuthContext);
  const setState = useRef(setAuthState);
  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [payload, setPayload] = useState();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const controller = new AbortController();
    async function fetchLogin() {
      setLoading(true);
      const result = await axios({
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
        data: payload,
        signal: controller.signal,
        withCredentials: true,
        url: "http://localhost:8000/login",
      })
        .then((response) => response.data)
        .then((data) => {
          setState.current((authState) => ({ ...authState, ...data.data }));
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
          return error;
        });
      return result;
    }
    fetchLogin();
    console.log("login use effect");

    return () => {
      controller.abort();
      console.log("Login dispatch..");
    };
  }, [payload]); //jesli payload jest taki sam, nie wysle ponownie fetcha, tylko jesli propsy sie zmienia

  async function handleSubmit(e) {
    setPayload(e);
  }

  if (authState.role !== "") return <Navigate to="/" />;

  if (loading) return <ProgressBar animated now={100} />;

  return (
    <Container>
      <Formik
        validationSchema={schema}
        onSubmit={(e) => handleSubmit(e)}
        initialValues={{
          email: "",
          password: "",
        }}
      >
        {({ handleSubmit, handleChange, handleBlur, values, touched, isValid, errors, isSubmitting }) => (
          <Form onSubmit={handleSubmit} className="mt-3">
            <div className="mt-3" />
            <Row className="mb-3">
              <Form.Group as={Col} md="4" controlId="validationFormik00">
                <Form.Label>Adres email</Form.Label>
                <InputGroup hasValidation>
                  <Form.Control type="text" placeholder="Podaj email" name="email" value={values.email} onChange={handleChange} onBlur={handleBlur} isInvalid={!!errors.email} isValid={touched.email && !errors.email} />
                  <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                </InputGroup>
              </Form.Group>
            </Row>
            <Row className="mb-3">
              <Form.Group as={Col} md="4" controlId="validationFormik01">
                <Form.Label>Hasło</Form.Label>
                <InputGroup hasValidation>
                  <Form.Control type="password" placeholder="Hasło" name="password" value={values.password} onChange={handleChange} onBlur={handleBlur} isInvalid={!!errors.password} isValid={touched.password && !errors.password} />
                  <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                </InputGroup>
              </Form.Group>
            </Row>
            <Button type="submit" disabled={Object.keys(errors).length !== 0 && !isValid}>
              Zaloguj
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
    </Container>
  );
}
