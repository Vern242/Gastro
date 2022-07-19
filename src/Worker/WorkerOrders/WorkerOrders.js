import React from "react";
import { Tabs, Tab } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import WorkerTab from "./WorkerTab";

export default function WorkerOrders() {
  return (
    <Tabs defaultActiveKey={1} fill mountOnEnter unmountOnExit>
      <Tab eventKey={1} title={"W trakcie"}>
        <WorkerTab key={1} variant={"accepted"} />
      </Tab>
      <Tab eventKey={2} title={"Nowe"}>
        <WorkerTab key={2} variant={"started"} />
      </Tab>
      <Tab eventKey={3} title={"Zakończone"}>
        <WorkerTab key={3} variant={"finished"} />
      </Tab>
      <Tab eventKey={4} title={"Odrzucone"}>
        <WorkerTab key={4} variant={"rejected"} />
      </Tab>
    </Tabs>
  );
}
