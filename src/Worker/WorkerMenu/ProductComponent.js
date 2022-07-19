import React, { useEffect, useState, useRef, useCallback } from "react";
import { Button, InputGroup, FormControl } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function ProductComponent(data) {
  const { product, addNewProduct, categoryName, addId } = data;
  const { productName, productPrice, productDescription, id } = product || {}; // undefined zwraca blad, pusty obiekt nie zwraca bledu
  const [currentProduct, setCurrentProduct] = data.currentProduct || [];
  const setCurr = useRef(setCurrentProduct);
  const update = useRef(data.update);
  const [name, setName] = useState(productName || "");
  const [price, setPrice] = useState(parseFloat(productPrice || 1).toFixed(2));
  const [description, setDescription] = useState(productDescription || "");
  const [errorMessage, setErrorMessage] = useState("");
  const [payload, setPayload] = useState();
  const first = useRef(true);
  const navigate = useRef(useNavigate());
  let compId = id || addId;

  const flipEdit = useCallback(() => {
    setCurr.current((curr) => (curr === compId ? 0 : compId));
    setErrorMessage("");
  }, [compId]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const controller = new AbortController();

    async function postProduct() {
      const result = await axios({
        method: "POST",
        data: payload,
        signal: controller.signal,
        withCredentials: true,
        url: "http://localhost:8000/items/product/" + payload.type,
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
    postProduct();

    return () => {
      controller.abort();
    };
  }, [flipEdit, payload]);

  async function deleteProduct() {
    setPayload({
      id: id,
      categoryName: categoryName,
      productName: name,
      productPrice: parseFloat(price).toFixed(2),
      productDescription: description,
      type: "delete",
    });
  }

  async function updateProduct() {
    setPayload({
      id: id,
      categoryName: categoryName,
      productName: name,
      productPrice: parseFloat(price).toFixed(2),
      productDescription: description,
      type: "update",
    });
  }

  async function createProduct() {
    setPayload({
      id: id,
      categoryName: categoryName,
      productName: name,
      productPrice: parseFloat(price).toFixed(2),
      productDescription: description,
      type: "create",
    });
  }

  if (addNewProduct) {
    return (
      <tr>
        {currentProduct === compId ? (
          <td colSpan={4}>
            <InputGroup className="mb-3">
              <Button onClick={flipEdit} variant="warning">
                Anuluj
              </Button>
              <InputGroup.Text id={`produkt:${name}`}>
                Nazwa <br /> produktu
              </InputGroup.Text>
              <FormControl value={name} placeholder={"Nazwa produktu"} onChange={(e) => setName(e.target.value)} />
              <InputGroup.Text id={`cena:${name}`}>
                Cena <br /> za sztukę
              </InputGroup.Text>
              <FormControl value={price} placeholder={"Cena produktu"} onChange={(e) => setPrice(e.target.value)} />
              <InputGroup.Text id={`opis:${name}`}>Opis</InputGroup.Text>
              <FormControl as="textarea" value={description} placeholder={"Opis produktu"} onChange={(e) => setDescription(e.target.value)} />
              <Button variant="success" onClick={createProduct} disabled={!([...name].length > 1 && parseFloat(price) > 0)}>
                Utwórz nowy produkt
              </Button>
            </InputGroup>
            {errorMessage !== "" && <div className="text-danger">{errorMessage}</div>}
          </td>
        ) : (
          <td colSpan={4}>
            <Button onClick={flipEdit} variant="success">
              Utwórz nowy produkt
            </Button>
          </td>
        )}
      </tr>
    );
  }

  return (
    <tr>
      {currentProduct === compId ? (
        <td colSpan={4}>
          <InputGroup className="mb-3">
            <Button onClick={flipEdit}>
              Zakończ <br /> edycję
            </Button>
            <InputGroup.Text id={`produkt:${name}`}>
              Nazwa <br /> produktu
            </InputGroup.Text>
            <FormControl value={name} onChange={(e) => setName(e.target.value)} />
            <InputGroup.Text id={`cena:${name}`}>
              Cena <br /> za sztukę
            </InputGroup.Text>
            <FormControl value={price} onChange={(e) => setPrice(e.target.value)} />
            <InputGroup.Text id={`opis:${name}`}>Opis</InputGroup.Text>
            <FormControl as="textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
            <Button variant="warning" onClick={updateProduct} disabled={!([...name].length > 1 && parseFloat(price) > 0)}>
              Zmień
            </Button>
            <Button variant="danger" onClick={deleteProduct}>
              Usuń
            </Button>
          </InputGroup>
        </td>
      ) : (
        <>
          <td>
            <Button onClick={flipEdit}>Edytuj</Button>
            <br />
          </td>
          <td>{name}</td>
          <td>{price}</td>
          <td>{description}</td>
        </>
      )}
    </tr>
  );
}
