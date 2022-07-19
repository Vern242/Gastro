import { Navbar, Nav, Container, Badge } from "react-bootstrap";
import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../GlobalState";
import { Link } from "react-router-dom";
import Cart from "../User/ShoppingCart/Cart";
import Helper from "../Helper";

export default function NavbarComp() {
  const [authState] = useContext(AuthContext);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const verifyTime = Helper.isRestaurantOpenNow(authState.times);
    setOpen(verifyTime);
  }, [authState.times]);

  return (
    <Navbar bg="dark" expand="lg" variant="dark">
      <Container>
        <Navbar.Brand as={Link} to="/">
          Gastro
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {authState.role !== "worker" ? (
              <>
                <Nav.Link as={Link} to="/menu">
                  Menu
                </Nav.Link>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/admin/orders">
                  Zamówienia
                </Nav.Link>
                {authState.canEditMenu || authState.isAdmin ? (
                  <Nav.Link as={Link} to="/admin/menu">
                    Menu
                  </Nav.Link>
                ) : (
                  <Nav.Link as={Link} to="/menu">
                    Menu
                  </Nav.Link>
                )}
                {(authState.canEditWorkers || authState.isAdmin) && (
                  <Nav.Link as={Link} to="/admin/manage">
                    Pracownicy
                  </Nav.Link>
                )}
                {authState.isAdmin && (
                  <Nav.Link as={Link} to="/admin/times">
                    Czasy otwarcia
                  </Nav.Link>
                )}
              </>
            )}
          </Nav>
          <Nav className="me-auto">
            {!open && (
              <Nav.Link disabled>
                <Badge pill bg="danger">
                  Restauracja nieczynna
                </Badge>
              </Nav.Link>
            )}
            {open && (
              <Nav.Link disabled>
                <Badge pill bg="success">
                  Restauracja otwarta
                </Badge>
              </Nav.Link>
            )}
          </Nav>
          <Nav className="d-flex">
            {authState.role !== "worker" && <Cart />}
            {authState.role === "" ? (
              <>
                <Nav.Link as={Link} to="/login">
                  Logowanie
                </Nav.Link>
                <Nav.Link as={Link} to="/register">
                  Rejestracja
                </Nav.Link>
              </>
            ) : (
              <>
                {authState.role === "worker" ? (
                  <Nav.Link as={Link} to="/admin/settings">
                    Ustawienia
                  </Nav.Link>
                ) : (
                  <>
                    <Nav.Link as={Link} to="/panel/orders">
                      Zamówienia
                    </Nav.Link>
                    <Nav.Link as={Link} to="/panel/settings">
                      Konto
                    </Nav.Link>
                  </>
                )}
                <Nav.Link as={Link} to="/logout">
                  Wyloguj
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
