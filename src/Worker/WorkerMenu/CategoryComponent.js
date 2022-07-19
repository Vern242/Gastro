import React, { useEffect, useState, useRef, useCallback } from "react";
import { Button, Container, Table, InputGroup, FormControl } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import ProductComponent from "./ProductComponent";
import { useNavigate } from "react-router-dom";

export default function CategoryComponent(data) {
  const { addNewCategory, categoryName, categoryDescription, id, productsInCat } = data;
  const currentCategory = data.currentCategory || 0;
  const update = useRef(data.update);
  const [category, setCategory] = useState(categoryName || "");
  const [description, setDescription] = useState(categoryDescription || "");
  const [edit, setEdit] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentProduct, setCurrentProduct] = useState(0);
  const [payload, setPayload] = useState();
  const first = useRef(true);
  const navigate = useRef(useNavigate());

  useEffect(() => {
    //przy kazdej zmianie kategorii zdejmnij stan edytowalny z pól wszystkich kategorii, ala unmount clear
    //niestety to sie odpala w kazdej kategorii, nie tylko w tej ktora byla aktywna
    setCurrentProduct(0);
  }, [currentCategory]);

  const flipEdit = useCallback(() => {
    setEdit((edit) => !edit);
    setErrorMessage("");
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const controller = new AbortController();
    async function postCategory() {
      const result = await axios({
        method: "POST",
        data: payload,
        signal: controller.signal,
        withCredentials: true,
        url: "http://localhost:8000/items/category/" + payload.type,
      })
        .then((response) => {
          flipEdit();
          update.current();
          return response.data;
        })
        .catch((error) => {
          if (error?.message === "canceled") {
            console.log("canceled");
            return undefined;
          }
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
    postCategory();

    return () => {
      controller.abort();
    };
  }, [flipEdit, payload]);

  async function createCategory() {
    setPayload({
      id: id,
      categoryName: category,
      categoryDescription: description,
      type: "create",
    });
  }

  async function deleteCategory() {
    setPayload({
      id: id,
      categoryName: category,
      categoryDescription: description,
      type: "delete",
    });
  }

  async function updateCategory() {
    setPayload({
      id: id,
      categoryName: category,
      categoryDescription: description,
      type: "update",
    });
  }

  function flipUpdate() {
    update.current();
  }

  if (addNewCategory) {
    return (
      <Container>
        {edit === true ? (
          <>
            <InputGroup className="mb-3">
              <Button onClick={flipEdit} variant="warning">
                Anuluj
              </Button>
              <InputGroup.Text id={`kategoria:${category}`}>
                Nazwa <br /> kategorii
              </InputGroup.Text>
              <FormControl value={category} onChange={(e) => setCategory(e.target.value)} />
              <InputGroup.Text id={`opis:${category}`}>Opis</InputGroup.Text>
              <FormControl as="textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
              <Button variant="success" onClick={createCategory} disabled={[...category].length < 1}>
                Utwórz nową kategorię
              </Button>
            </InputGroup>
            {errorMessage !== "" && <div className="text-danger">{errorMessage}</div>}
            <hr />
          </>
        ) : (
          <>
            <h1>
              <Button onClick={flipEdit} variant="success">
                Dodaj nową kategorię
              </Button>
            </h1>
            <hr />
          </>
        )}
      </Container>
    );
  }

  if (currentCategory !== id) return <div></div>;

  return (
    <Container>
      {edit === true ? (
        <>
          <InputGroup className="mb-3">
            <Button onClick={flipEdit}>
              Zakończ <br /> edycję
            </Button>
            <InputGroup.Text id={`kategoria:${category}`}>
              Nazwa <br /> kategorii
            </InputGroup.Text>
            <FormControl value={category} onChange={(e) => setCategory(e.target.value)} />
            <InputGroup.Text id={`opis:${category}`}>Opis</InputGroup.Text>
            <FormControl as="textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
            <Button variant="warning" onClick={updateCategory} disabled={[...category].length < 1}>
              Zmień
            </Button>
            {productsInCat.length < 1 && (
              <Button variant="danger" onClick={deleteCategory}>
                Usuń
              </Button>
            )}
          </InputGroup>
          {errorMessage !== "" && <div className="text-danger">{errorMessage}</div>}
          <hr />
        </>
      ) : (
        <>
          <h1>
            {categoryName} <Button onClick={flipEdit}>Edytuj</Button>
          </h1>
          <div>{categoryDescription}</div>
          <hr />
        </>
      )}
      <Container>
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Akcje</th>
              <th>Nazwa produktu</th>
              <th>Cena za sztukę</th>
              <th>Opis</th>
            </tr>
          </thead>
          <tbody>
            {productsInCat.map((product) => {
              return <ProductComponent key={product.id} product={product} update={flipUpdate} categoryName={categoryName} currentProduct={[currentProduct, setCurrentProduct]} />;
            })}
            <ProductComponent update={flipUpdate} addNewProduct={true} categoryName={categoryName} currentProduct={[currentProduct, setCurrentProduct]} addId={-1} />
          </tbody>
        </Table>
      </Container>
    </Container>
  );
}
