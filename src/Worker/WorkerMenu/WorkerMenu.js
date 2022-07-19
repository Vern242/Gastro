import React, { useEffect, useState, useContext } from "react";
import { Button, Container, ProgressBar } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { Navigate, useNavigate } from "react-router-dom";
import CategoryComponent from "./CategoryComponent";
import { AuthContext } from "../../GlobalState";

export default function WorkerMenu() {
  const [authState] = useContext(AuthContext);
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [update, setUpdate] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentCategory, setCurrentCategory] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchMenu() {
      setLoading(true);
      const result = await axios({
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "GET",
        signal: controller.signal,
        withCredentials: true,
        url: "http://localhost:8000/menu",
      })
        .then((response) => response.data)
        .then((data) => {
          setProducts(data.products);
          setCategories(data.categories);
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
          return error;
        });

      return result;
    }
    fetchMenu();

    return () => {
      controller.abort();
    };
  }, [update]);

  function flipUpdate() {
    setUpdate((update) => !update);
    //make show on next update? pass true or false value for showP ?
  }

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

  if (!(authState.canEditMenu || authState.isAdmin)) return <Navigate to={"/menu"} />;

  if (loading) return <ProgressBar animated now={100} />;

  if (errorMessage !== "")
    return (
      <Container>
        <h1>{errorMessage}</h1>
      </Container>
    );

  return (
    <Container>
      <p></p>
      <Button onClick={() => navigate("/menu")} variant="success">
        <h2>Menu</h2>
      </Button>
      <hr />
      {categories.map((cat) => {
        return (
          <React.Fragment key={`Select_Button${cat.id}`}>
            {" "}
            <Button onClick={() => setCurrentCategory(cat.id)}>{cat.categoryName}</Button>
          </React.Fragment>
        );
      })}
      <hr />
      <p></p>
      {categories.map((category) => {
        return <CategoryComponent key={category.id} id={category.id} productsInCat={prodInCat(category)} update={flipUpdate} categoryName={category.categoryName} categoryDescription={category.categoryDescription} currentCategory={currentCategory} />;
      })}
      <CategoryComponent update={flipUpdate} addNewCategory={true} />
    </Container>
  );
}
