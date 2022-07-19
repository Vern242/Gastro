import { Container, Row, Col, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from ".././GlobalState";
import Helper from "../Helper";

export default function Home() {
  const [authState] = useContext(AuthContext);
  const navigate = useNavigate();

  const getDayHourAndMinutes = (time, index) => {
    const { start, end } = time; //czas otwarcia i zamkniecia w danym dniu (time)
    const helper = [];
    const offset = authState.offset; //offset z serwera, niezaleznie od lokacji wyswietlenia bedzie ten sam czas wyswietlony
    const o = Helper.getOffset(offset); //offset w minutach zamieniany na liste [godziny, minuty] offsetu
    const s = new Date(start);
    const e = new Date(end);

    let shdiff = 0; // gdy minuty przeskakuja powyzej 59 lub ponizej 0 : odejmij lub dodaj zmiane od godziny
    let ehdiff = 0; // tylko dla offsetow gdzie minuty !== 0

    let sh = s.getUTCHours() - o[0];
    let eh = e.getUTCHours() - o[0];

    let sm = s.getUTCMinutes() - o[1];
    if (sm < 0) {
      sm += 60;
      shdiff = -1;
    }
    if (sm > 59) {
      sm -= 60;
      shdiff = 1;
    }
    let em = e.getUTCMinutes() - o[1];
    if (em < 0) {
      em += 60;
      ehdiff = -1;
    }
    if (em > 59) {
      em -= 60;
      ehdiff = 1;
    }

    if (sh > eh) return authState.times[index].day + ": Nieczynne";

    helper.push(sh + shdiff);
    helper.push(sm);
    helper.push(eh + ehdiff);
    helper.push(em);
    //zamien liczby od 0 - 9 na 00 - 09 - dla czytelności
    const r = helper.map((number) => {
      return number < 10 ? ("0" + number).slice(-2) : number;
    });

    return authState.times[index].day + ": " + r[0] + ":" + r[1] + " - " + r[2] + ":" + r[3];
  };

  return (
    <>
      <div className="mt-5"></div>
      <Container>
        <Row>
          <Col>
            <Row>
              <h1>Dane adresowe</h1>
              <h3>ul. Polska 1</h3>
              <h3>11-123 Wrocław</h3>
              <p></p>
            </Row>
            <Row>
              <h1>Dane kontaktowe</h1>
              <h3>+48 111 222 333</h3>
              <h3>gastro@mail.pl</h3>
            </Row>
          </Col>
          <Col>
            <h1>Godziny otwarcia</h1>
            {authState.times.length !== 0 &&
              authState.times.map((time, index) => {
                return <h3 key={`czas:${index}`}>{getDayHourAndMinutes(time, index)}</h3>;
              })}
            {authState.times.length === 0 && <h3 className="mt-3">Nie udało się pobrać godzin otwarcia, odśwież stronę</h3>}
          </Col>
        </Row>
        <div className="mt-5"></div>
        <Row>
          <h1>
            Sprawdź nasze{" "}
            <Button onClick={() => navigate("/menu")} variant="success">
              <h2>Menu</h2>
            </Button>
          </h1>
        </Row>
      </Container>
    </>
  );
}
