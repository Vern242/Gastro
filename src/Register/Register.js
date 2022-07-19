import React, { useState, useContext, useRef, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Button, Container, Form, Col, Row, InputGroup, Alert, ProgressBar } from "react-bootstrap";
import { Formik } from "formik";
import * as yup from "yup";
import axios from "axios";
import { Navigate, useNavigate } from "react-router-dom";
import { AuthContext } from "../GlobalState";

let pass = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[`!@#$%^&*])(?=.{8,})");
let postReg = new RegExp("([0-9]{2}[-][0-9]{3})");
let teleReg = new RegExp("(^([0-9]{3}([\\s]|[-])){2}[0-9]{3}$)");

const schema = yup.object().shape({
  name: yup.string().required("Podaj imie"),
  email: yup.string().email("Podaj mail w formacie mail@domena.pl").required("Podaj adres email"),
  password: yup.string().required("Podaj hasło").matches(pass, "Hasło musi zawierać 8 znaków, 1 dużą literę, 1 małą literę, 1 numer i 1 znak specjalny"),
  passwordConfirmation: yup
    .string()
    .required("Potwierdź hasło")
    .oneOf([yup.ref("password"), null], "Hasła muszą sie zgadzać"),
  street: yup.string().required("Podaj nazwę ulicy"),
  town: yup.string().required("Podaj nazwę miasta"),
  postCode: yup.string().required("Podaj kod pocztowy").max(6, "Zbyt dużo znaków, podaj kod w formacie 00-000").min(6, "Minimum 6 cyfr, podaj kod w formacie 00-000").matches(postReg, "Podaj kod w formacie 00-000"),
  telephone: yup.string().required("Podaj numer swojego telefonu").min(11, "Format: 000-000-000 lub 000 000 000").max(11, "Numer jest zbyt długi").matches(teleReg, "Numer podany w złym formacie"),
  terms: yup.bool().required().oneOf([true], "Musisz zgodzić się aby utworzyć konto"),
});

export default function Register() {
  const [authState] = useContext(AuthContext);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useRef(useNavigate());
  const [payload, setPayload] = useState();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const first = useRef(true);

  let style = {
    fontSize: 40 + "px",
    display: "inline",
  };

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    async function fetchRegister() {
      const result = await axios({
        method: "POST",
        data: payload,
        signal: controller.signal,
        withCredentials: true,
        url: "http://localhost:8000/register",
      })
        .then((response) => {
          setSent(true);
          setLoading(false);
          return response.data;
        })
        .catch((error) => {
          if (error?.message === "canceled") {
            return undefined;
          }
          setLoading(false);
          if (!error?.response) {
            setErrorMessage("Nie udało połączyć się z serwerem.");
            return undefined;
          }
          setErrorMessage(error?.response?.data?.message);
          return error;
        });
      return result;
    }
    fetchRegister();

    return () => {
      controller.abort();
    };
  }, [payload]);

  function handleSubmit(e) {
    setPayload(e);
  }

  if (authState.role !== "") return <Navigate to="/" />;

  if (loading) return <ProgressBar animated now={100} />;

  if (sent) {
    return (
      <Container>
        <p></p>
        <div className="mt-5" />
        <h1 className="text-center">Konto zostało utworzone pomyślnie!</h1>
        <div className="mt-5" />
        <div className="text-center">
          <Button onClick={() => navigate.current("/login")}>
            <div style={style}>Ok</div>
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Formik
        validationSchema={schema}
        onSubmit={(e) => handleSubmit(e)}
        initialValues={{
          name: "",
          email: "",
          password: "",
          passwordConfirmation: "",
          street: "",
          town: "",
          postCode: "",
          telephone: "",
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
                  <Form.Control type="text" placeholder="Email" name="email" value={values.email} onChange={handleChange} onBlur={handleBlur} isInvalid={!!errors.email} isValid={touched.email && !errors.email} />
                  <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                </InputGroup>
              </Form.Group>
            </Row>
            <Row className="mb-3">
              <Form.Group as={Col} md="4" controlId="validationFormik03">
                <Form.Label>Hasło</Form.Label>
                <InputGroup hasValidation>
                  <Form.Control type="password" placeholder="Hasło" name="password" value={values.password} onChange={handleChange} onBlur={handleBlur} isInvalid={!!errors.password} isValid={touched.password && !errors.password} />
                  <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                </InputGroup>
              </Form.Group>
              <Form.Group as={Col} md="4" controlId="validationFormik04">
                <Form.Label>Potwierdź hasło</Form.Label>
                <InputGroup hasValidation>
                  <Form.Control type="password" placeholder="Hasło" name="passwordConfirmation" value={values.passwordConfirmation} onChange={handleChange} onBlur={handleBlur} isInvalid={!!errors.passwordConfirmation} isValid={touched.passwordConfirmation && !errors.passwordConfirmation} />
                  <Form.Control.Feedback type="invalid">{errors.passwordConfirmation}</Form.Control.Feedback>
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
            <Form.Group className="mb-3">
              <Form.Check required name="terms" label="Zgadzam się na przetwarzanie moich danych osobowych przez Gastro" onChange={handleChange} onBlur={handleBlur} isInvalid={!!errors.terms} feedback={errors.terms} feedbackType="invalid" id="validationFormik0" />
            </Form.Group>
            <Button type="submit" disabled={Object.keys(errors).length !== 0 && !isValid}>
              Utwórz konto
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
