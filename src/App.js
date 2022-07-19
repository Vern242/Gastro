import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "./GlobalState";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import axios from "axios";

import Home from "./Home/Home";
import Login from "./Login/Login";
import Logout from "./Login/Logout";
import SessionEnded from "./Login/SessionEnded";
import NavbarComp from "./NavbarComp/NavbarComp";
import Menu from "./Menu/Menu";

import Register from "./Register/Register";
import Checkout from "./User/ShoppingCart/Checkout";
import UserOrders from "./User/UserPanel/UserOrders";
import UserPasswordChange from "./User/UserPanel/UserPasswordChange";
import UserSettings from "./User/UserPanel/UserSettings";

import WorkerOrders from "./Worker/WorkerOrders/WorkerOrders";
import WorkerMenu from "./Worker/WorkerMenu/WorkerMenu";
import WorkerManage from "./Worker/WorkerManage/WorkerManage";
import WorkerTimes from "./Worker/WorkerTimes/WorkerTimes";
import Helper from "./Helper";
import WorkerSettings from "./Worker/WorkerSettings/WorkerSettings";

export default function App() {
  const [authState, setAuthState] = useContext(AuthContext);
  const setState = useRef(setAuthState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function checkCookies() {
      const result = await axios({
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "GET",
        signal: controller.signal,
        withCredentials: true,
        url: "http://localhost:8000/check",
      })
        .then((response) => response.data)
        .then((data) => {
          setState.current((authState) => ({ ...authState, ...data.data }));
          return data;
        })
        .catch((error) => {
          return error;
        });
      return result;
    }
    checkCookies();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function getTimes() {
      const result = await axios({
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "GET",
        signal: controller.signal,
        withCredentials: true,
        url: "http://localhost:8000/times/read",
      })
        .then((res) => res.data.data)
        .then((data) => {
          setState.current((authState) => ({ ...authState, times: data.times, offset: data.offset }));
          setLoading(false);
          return data;
        })
        .catch((error) => {
          setLoading(false);
          return error;
        });

      return result;
    }
    getTimes();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    Helper.loadFromSession(setState.current);
  }, []);

  if (loading) return <></>;

  return (
    <BrowserRouter>
      <NavbarComp />
      <Routes>
        <Route element={<Home />} path="*" />
        <Route element={<Home />} path="/" />
        <Route element={<Menu />} path="/menu" />
        <Route element={<Login />} path="/login" />
        <Route element={<Register />} path="/register" />
        <Route element={<SessionEnded />} path="/nosession" />
        {authState.role === "customer" && (
          <>
            <Route element={<Checkout />} path="/checkout" />
            <Route element={<UserOrders />} path="/panel/orders" />
            <Route element={<UserPasswordChange />} path="/panel/pass" />
            <Route element={<UserSettings />} path="/panel/settings" />
          </>
        )}
        {authState.role === "worker" && (
          <>
            <Route element={<WorkerSettings />} path="/admin/settings" />
            <Route element={<WorkerOrders />} path="/admin/orders" />
          </>
        )}
        {(authState.canEditMenu || authState.isAdmin) && <Route element={<WorkerMenu />} path="/admin/menu" />}
        {(authState.canEditWorkers || authState.isAdmin) && <Route element={<WorkerManage />} path="/admin/manage" />}
        {authState.isAdmin && <Route element={<WorkerTimes />} path="/admin/times" />}

        {authState.role !== "" && <Route element={<Logout />} path="/logout" />}
      </Routes>
    </BrowserRouter>
  );
}
