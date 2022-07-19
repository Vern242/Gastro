import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useContext } from "react";
import { AuthContext } from "../GlobalState";
import Item from "./Item";
import { Alert, Button, Col, Container, Navbar, ProgressBar, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Helper from "../Helper";

export default function Menu() {
  const [authState] = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [desc, setDesc] = useState("");
  const [disabled, setDisabled] = useState(false);

  const [alert, setAlert] = useState(false);
  const first = useRef(true);

  const [show, setShow] = useState(false);
  const [orderList, setOrderList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useRef(useNavigate());

  let style = {
    fontSize: 30 + "px",
    display: "inline",
  };

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!alert) {
      return;
    }
    const timeout = setTimeout(() => setAlert(false), 250);
    return () => {
      clearTimeout(timeout);
    };
  }, [alert]);

  const verifyTime = useCallback(() => {
    const isOpen = Helper.isRestaurantOpenNow(authState.times);
    setDisabled(!isOpen);
    return isOpen;
  }, [authState.times]);

  useEffect(() => {
    setDisabled(!verifyTime());
  }, [verifyTime]);

  /* useEffect(() => {
    const d = new Date();
    const difference = d.getSeconds();
    let interval;

    const timeout = setTimeout(() => {
      setDisabled(!verifyTime());
      interval = setInterval(() => {
        setDisabled(!verifyTime());
      }, 60000);
    }, 60000 - difference * 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [verifyTime]); 
    sprawdzanie czasu co minute 
  */

  useEffect(() => {
    console.log("get menu..");
    const controller = new AbortController();
    async function fetchMenu() {
      const result = await axios({
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        method: "GET",
        withCredentials: true,
        url: "http://localhost:8000/menu",
      })
        .then((response) => response.data)
        .then((data) => {
          console.log("Menu fetched");
          setProducts(data.products);
          setCategories(data.categories);
          setLoading(false);
          return data;
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

    fetchMenu();

    return () => {
      console.log("Abort Menu");
      controller.abort();
    };
  }, []);

  function prodInCat(category) {
    const array = [];
    products.forEach((element) => {
      if (category.id === element.categoryId) {
        const helper = { ...element, categoryName: category.categoryName };
        array.push(helper);
      }
    });
    return array;
  }

  function showProducts(cat) {
    const products = prodInCat(cat);
    setDesc(cat.categoryDescription);
    setOrderList(products);
    setShow(true);
  }

  if (errorMessage !== "")
    return (
      <Container>
        <p></p>
        <div className="mt-5" />
        <h1 className="text-center">Nie udało połączyć się z serwerem</h1>
      </Container>
    );

  if (loading) return <ProgressBar animated now={100} />;

  return (
    <Container>
      <p></p>
      <Row>
        {categories.map((cat, index) => {
          return (
            <Col md="auto" key={"category" + index}>
              <Button variant="dark" onClick={() => showProducts(cat)}>
                <h2>{cat.categoryName}</h2>
              </Button>
              <> </>
            </Col>
          );
        })}
        <Col></Col>
        <Col>
          <div className="mt-3"></div>
          {(authState.canEditMenu || authState.isAdmin) && (
            <Button variant="success" onClick={() => navigate.current("/admin/menu")}>
              <div style={style}>Powróc do edycji menu</div>
            </Button>
          )}
        </Col>
      </Row>
      <p></p>
      {show && <h3 className="text-muted">{desc}</h3>}
      <p className="mt-5"> </p>
      {show ? (
        orderList.map((product, index) => {
          return (
            <React.Fragment key={"menuItem" + index}>
              <hr />
              <Item product={product} key={"item" + index} categoryName={product.categoryName} disabled={disabled} verify={verifyTime} alert={setAlert} />
              {index === orderList.length - 1 && <hr />}
            </React.Fragment>
          );
        })
      ) : (
        <h2>Wybierz kategorię</h2>
      )}
      <Navbar className="justify-content-end" fixed="top" style={{ marginRight: 20, marginTop: 70, pointerEvents: "none" }}>
        <Alert show={alert} variant="success">
          <h2>Dodano do koszyka!</h2>
        </Alert>
      </Navbar>
    </Container>
  );
}
