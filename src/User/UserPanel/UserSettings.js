import React, { useState, useContext, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Button, Container, Form, Col, Row, InputGroup, Alert, ProgressBar } from "react-bootstrap";
import { Formik } from "formik";
import * as yup from "yup";
import axios from "axios";
import { AuthContext } from "../../GlobalState";
import { useNavigate, Navigate } from "react-router-dom";

let pass = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[`!@#$%^&*])(?=.{8,})");
let postReg = new RegExp("([0-9]{2}[-][0-9]{3})");
let teleReg = new RegExp("(^([0-9]{3}([\\s]|[-])){2}[0-9]{3}$)");

const schema = yup.object().shape({
  name: yup.string().required("Podaj imie"),
  email: yup.string().email("Podaj mail w formacie mail@domena.pl").required("Podaj adres email"),
  password: yup.string().required("Podaj hasło").matches(pass, "Hasło musi zawierać 8 znaków, 1 dużą literę, 1 małą literę, 1 numer i 1 znak specjalny"),
  street: yup.string().required("Podaj nazwę ulicy"),
  town: yup.string().required("Podaj nazwę miasta"),
  postCode: yup.string().required("Podaj kod pocztowy").max(6, "Zbyt dużo znaków, podaj kod w formacie 00-000").min(6, "Minimum 6 cyfr, podaj kod w formacie 00-000").matches(postReg, "Podaj kod w formacie 00-000"),
  telephone: yup.string().required("Podaj numer swojego telefonu").min(11, "Format: 000-000-000 lub 000 000 000").max(11, "Numer jest zbyt długi").matches(teleReg, "Numer podany w złym formacie"),
  terms: yup.bool().required().oneOf([true], "Musisz potwierdzić aby zmienić dane"),
});

export default function UserSettings() {
  const [authState, setAuthState] = useContext(AuthContext);
  const setState = useRef(setAuthState);
  const [errorMessage, setErrorMessage] = useState("");
  const [payload, setPayload] = useState();
  const [sent, setSent] = useState("");
  const [loading, setLoading] = useState(false);
  const first = useRef(true);
  const navigate = useRef(useNavigate());

  let style = {
    fontSize: 40 + "px",
    display: "inline",
  };

  async function handleSubmit(e) {
    const { password } = e;
    setPayload({ ...e, passwordConfirmation: password });
  }

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const controller = new AbortController();

    async function changeSettings() {
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
        url: "http://localhost:8000/user/changeSettings",
      })
        .then((response) => response.data)
        .then((data) => {
          setState.current((authState) => ({ ...authState, ...data.data }));
          setSent("Dane zostały zmienione pomyślnie!");
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

    changeSettings();

    return () => {
      controller.abort();
    };
  }, [payload]);

  if (authState.role !== "customer") return <Navigate to="/" />;

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
      <Button variant="dark" onClick={() => navigate.current("/panel/settings")}>
        <h2>Zmień dane</h2>
      </Button>
      <> </>
      <Button variant="dark" onClick={() => navigate.current("/panel/pass")}>
        <h2>Zmień hasło</h2>
      </Button>
      <div className="mt-5" />
      {loading && <ProgressBar animated now={100} />}
      {!loading && (
        <Formik
          validationSchema={schema}
          onSubmit={async (values, { setFieldValue }) => {
            await handleSubmit(values);
            if (sent !== "") {
              setFieldValue("password", "");
              setFieldValue("terms", false);
            }
          }}
          initialValues={{
            name: authState.name,
            email: authState.email,
            password: "",
            street: authState.street,
            town: authState.town,
            postCode: authState.postCode,
            telephone: authState.telephone,
            terms: false,
          }}
        >
          {({ handleSubmit, handleChange, handleBlur, values, touched, isValid, errors, isSubmitting }) => (
            <Form onSubmit={handleSubmit} className="mt-3">
              <Row className="mb-3">
                <Form.Group as={Col} md="4" controlId="validationFormik01">
                  <Form.Label>Imie</Form.Label>
                  <InputGroup hasValidation>
                    <Form.Control type="text" placeholder="Imie" name="name" value={values.name} onChange={handleChange} onBlur={handleBlur} isInvalid={!!errors.name} isValid={touched.name && !errors.name} />
                    <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>
                <Form.Group as={Col} md="4" controlId="validationFormik02">
                  <Form.Label>Email</Form.Label>
                  <InputGroup hasValidation>
                    <Form.Control type="text" placeholder="Email" name="email" value={values.email} disabled onChange={handleChange} isInvalid={!!errors.email} isValid={touched.email && !errors.email} />
                    <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>
              </Row>
              <Row className="mb-3">
                <Form.Group as={Col} md="4" controlId="validationFormik05">
                  <Form.Label>Ulica</Form.Label>
                  <Form.Control type="text" placeholder="Ulica" name="street" value={values.street} onChange={handleChange} onBlur={handleBlur} isInvalid={!!errors.street} isValid={touched.street && !errors.street} />
                  <Form.Control.Feedback type="invalid">{errors.street}</Form.Control.Feedback>
                </Form.Group>
                <Form.Group as={Col} md="4" controlId="validationFormik06">
                  <Form.Label>Miejscowość</Form.Label>
                  <Form.Control type="text" placeholder="Miejscowość" name="town" value={values.town} onChange={handleChange} onBlur={handleBlur} isInvalid={!!errors.town} isValid={touched.town && !errors.town} />
                  <Form.Control.Feedback type="invalid">{errors.town}</Form.Control.Feedback>
                </Form.Group>
              </Row>
              <Row className="mb-3">
                <Form.Group as={Col} md="4" controlId="validationFormik07">
                  <Form.Label>Kod pocztowy</Form.Label>
                  <Form.Control type="text" placeholder="Kod pocztowy" name="postCode" value={values.postCode} onChange={handleChange} onBlur={handleBlur} isInvalid={!!errors.postCode} isValid={touched.postCode && !errors.postCode} />
                  <Form.Control.Feedback type="invalid">{errors.postCode}</Form.Control.Feedback>
                </Form.Group>
                <Form.Group as={Col} md="4" controlId="validationFormik08">
                  <Form.Label>Nr. telefonu</Form.Label>
                  <Form.Control type="text" placeholder="Nr. telefonu" name="telephone" value={values.telephone} onChange={handleChange} onBlur={handleBlur} isInvalid={!!errors.telephone} isValid={touched.telephone && !errors.telephone} />
                  <Form.Control.Feedback type="invalid">{errors.telephone}</Form.Control.Feedback>
                </Form.Group>
              </Row>
              <Row className="mb-3">
                <Form.Group as={Col} md="4" controlId="validationFormik09">
                  <Form.Label>Podaj aktualne hasło</Form.Label>
                  <InputGroup hasValidation>
                    <Form.Control type="password" placeholder="Hasło" name="password" value={values.password} onChange={handleChange} onBlur={handleBlur} autoComplete="new-password" isInvalid={!!errors.password} isValid={touched.password && !errors.password} />
                    <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>
              </Row>
              <Form.Group className="mb-3">
                <Form.Check required name="terms" label="Potwierdzam " onChange={handleChange} onBlur={handleBlur} isInvalid={!!errors.terms} feedback={errors.terms} feedbackType="invalid" id="validationFormik0" />
              </Form.Group>
              <Button type="submit" disabled={Object.keys(errors).length !== 0 && !isValid}>
                Zmień dane
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
