import { AuthContext } from "../../GlobalState";
import React, { useContext } from "react";
import { Button, Stack } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import Helper from "../../Helper";

export default function CartItem(data) {
  const { categoryName, productName, quantity, productPrice, id } = data.item;
  const product = data.item;
  const [authState, setAuthState] = useContext(AuthContext);

  function addQuantity() {
    let helper = authState.items;
    let found = false;

    for (let i = 0; i < helper.length && !found; i++) {
      if (helper[i].id === id) {
        helper[i].quantity += 1;
        setAuthState((authState) => ({ ...authState, items: helper }));
        Helper.addSession(product);
        found = true;
      }
    }
  }

  function reduceQuantity() {
    let helper = authState.items;
    let found = false;

    for (let i = 0; i < helper.length && !found; i++) {
      if (helper[i].id === id) {
        if (helper[i].quantity > 1) {
          helper[i].quantity -= 1;
          setAuthState((authState) => ({ ...authState, items: helper }));
          Helper.reduceSession(product);
          found = true;
        } else if (helper[i].quantity === 1) {
          helper.splice(i, 1);
          setAuthState((authState) => ({ ...authState, items: helper }));
          Helper.reduceSession(product); //moze byc helper[i] zamiast product - to samo, tylko wtedy trzeba zmienić kolejność, przed splicem
          found = true;
        }
      }
    }
  }

  function removeItem() {
    let helper = authState.items;
    let found = false;

    for (let i = 0; i < helper.length && !found; i++) {
      if (helper[i].id === id) {
        helper.splice(i, 1);
        setAuthState((authState) => ({ ...authState, items: helper }));
        Helper.removeFromSession(product);
        found = true;
      }
    }
  }

  return (
    <>
      <Stack direction="horizontal" gap={3}>
        {categoryName}: {productName} {parseFloat(productPrice).toFixed(2)} zł
        <div className="ms-auto">
          <Button onClick={reduceQuantity}>-</Button>
        </div>
        <div>{quantity}</div>
        <Button onClick={addQuantity}>+</Button>
        <Button variant="warning" onClick={removeItem}>
          Usuń
        </Button>
      </Stack>
      <hr />
    </>
  );
}
