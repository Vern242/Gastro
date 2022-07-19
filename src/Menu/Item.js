import { useContext } from "react";
import { AuthContext } from "../GlobalState";
import { Button, Container, Row, Col } from "react-bootstrap";
import Helper from "../Helper";

export default function Item({ product, product: { productName, productPrice, productDescription, id }, categoryName, disabled, verify, alert }) {
  const [authState, setAuthState] = useContext(AuthContext);

  function isAlreadyInCart() {
    const length = authState.items.length;
    let status = false;

    for (let i = 0; i < length && !status; i++) {
      if (authState.items[i].id === id) status = true;
    }

    return status;
  }

  function submit() {
    if (!verify()) return;
    const isInCart = isAlreadyInCart();
    Helper.addSession(product);

    if (isInCart) {
      let helper = authState.items;
      for (let i = 0; i < helper.length; i++) {
        if (helper[i].id === id) {
          helper[i].quantity += 1;
          setAuthState((authState) => ({ ...authState, items: helper }));
          alert(true);
          return;
        }
      }
    }
    const newItem = {
      ...product,
      categoryName: categoryName,
      quantity: 1,
    };
    setAuthState((authState) => ({ ...authState, items: [...authState.items, newItem] }));
    alert(true);
  }

  return (
    <>
      <p></p>
      <Container>
        <Row>
          <Col xs={4}>
            <Row>
              <h2>{productName}</h2>
            </Row>
            <Row>{productDescription}</Row>
          </Col>
          <Col md="auto">
            <h2>Cena: {parseFloat(productPrice).toFixed(2)}zł</h2>
          </Col>
          <Col> </Col>
          <Col xs={4}>
            <Button onClick={submit} disabled={disabled}>
              <h2>Dodaj do koszyka</h2>
            </Button>
          </Col>
        </Row>
      </Container>
    </>
  );
}
