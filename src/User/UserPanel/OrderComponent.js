import React, { useState, useEffect, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

export default function OrderComponent(data) {
  const { OrderStatus, comment, totalPrice, OrderProducts, date } = data.order;
  const [status, setStatus] = useState("");
  const [t, setT] = useState([]);

  const checkName = useCallback(() => {
    if (OrderStatus) {
      const x = OrderStatus.name;
      if (x === "started") return "Czeka na potwierdzenie";
      if (x === "accepted") return "Przyjęte";
      if (x === "rejected") return "Odrzucone";
      if (x === "finished") return "Wysłane";
    }
  }, [OrderStatus]);

  const formatDate = useCallback(() => {
    const output = [];
    const d = new Date(date);
    output.push(d.getDate());
    output.push(d.getMonth() + 1);
    output.push(d.getFullYear());
    output.push(d.getHours());
    output.push(d.getMinutes());
    output.push(d.getSeconds());
    return output.map((number) => {
      return number < 10 ? ("0" + number).slice(-2) : number;
    });
  }, [date]);

  useEffect(() => {
    setT(formatDate());
    setStatus(checkName());
  }, [checkName, formatDate]);

  return (
    <tr>
      <td>{status}</td>
      <td>{comment}</td>
      <td>{totalPrice.toFixed(2)} zł</td>
      <td>
        {OrderProducts.map((OrderProduct) => {
          return (
            <div key={"order" + date + "prod" + OrderProduct.Product.id}>
              {OrderProduct.Product.Category.categoryName}: {OrderProduct.Product.productName} x {OrderProduct.productQuantity}
            </div>
          );
        })}
      </td>
      <td>
        {t[0]}.{t[1]}.{t[2]} {t[3]}:{t[4]}:{t[5]}
      </td>
    </tr>
  );
}
