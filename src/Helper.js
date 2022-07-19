/**
 * Klasa pomocnicza
 *
 *
 *
 */
class Helper {
  /**
   * Zwraca offset w formacie [godziny, minuty]
   *
   */
  static getOffset(offsetInMinutes) {
    if (offsetInMinutes === 0) return [0, 0];

    let ceilDiff = 0;
    const minuteOffset = offsetInMinutes % 60;
    if (minuteOffset > 0) ceilDiff -= 1; //zobacz po poprawie w HOME czy jeszcze potrzebne
    //math ceil ignoruje(zaokragla do góry czyli -1.5 w góre to -1) liczby ujemne, np. -30 minut to [0, -30]
    //natomiast w dodatnich zaokragla nam np. 30 minut na [1, 30] zamiast [0, 30]
    //tutaj odejmujemy to niechciane zaokraglanie (TYLKO w liczbach dodatnich)
    const offset = Math.ceil(offsetInMinutes / 60) + ceilDiff;

    return [offset, minuteOffset];
  }
  /**
   * Zwraca false jeśli restauracja jest zamknięta, lub jeśli nie udało się pobrać czasów
   * zwraca true jeśli walidacja się powiodła
   *
   * @param {Array} authState.times - Array
   */
  static isRestaurantOpenNow(times) {
    if (times.length === 0 || times === undefined) {
      return false;
    }
    //sprawdzamy roznice w UTC, brak offsetu aby utrzymac sie w granicy poszczegolnego dnia: nie wyskoczyc z poniedzialku na wtorek przez offset np. +6 godzin
    const d = new Date();
    let dh = d.getUTCHours();
    let dm = d.getUTCMinutes();
    let day;
    if (d.getUTCDay() === 0) day = 6;
    else if (d.getUTCDay() !== 0) day = d.getUTCDay() - 1; // 0 - niedziela, 1- poniedzialek..  -1 aby dostosować do mojej listy
    const time = times[day];
    const s = new Date(time.start);
    const e = new Date(time.end);

    let sh = s.getUTCHours();
    let sm = s.getUTCMinutes();
    let eh = e.getUTCHours();
    let em = e.getUTCMinutes();

    const currentTimeInMinutes = dh * 60 + dm;
    const startingTimeInMinutes = sh * 60 + sm;
    const endingTimeInMinutes = eh * 60 + em;

    /* console.log("dzien: " + time.day);
    console.log("teraz: " + currentTimeInMinutes);
    console.log("OD: " + startingTimeInMinutes);
    console.log("DO: " + endingTimeInMinutes); */

    if (currentTimeInMinutes >= startingTimeInMinutes && currentTimeInMinutes < endingTimeInMinutes) {
      return true;
    }
    return false;
  }
  /**
   * Zapisuje do Session storage lub dodaje quantity
   *
   * @param {Object} object - obiekt
   */
  static addSession(object) {
    const { productName } = object;
    if (!productName) return;
    try {
      let exists = sessionStorage.getItem(productName);
      if (exists) {
        let obj = JSON.parse(exists);
        let quantity = obj.quantity;
        sessionStorage.setItem(productName, JSON.stringify({ ...object, quantity: quantity + 1 }));
        return;
      }
      sessionStorage.setItem(productName, JSON.stringify({ ...object, quantity: 1 }));
    } catch (e) {
      console.log(e);
    }
  }
  /**
   * Odejmuje albo usuwa obiekt z Session storage
   *
   * @param {Object} object - obiekt
   */
  static reduceSession(object) {
    const { productName } = object;
    if (!productName) return;
    try {
      let exists = sessionStorage.getItem(productName);
      if (exists) {
        let obj = JSON.parse(exists);
        let quantity = obj.quantity;
        if (quantity > 1) {
          sessionStorage.setItem(productName, JSON.stringify({ ...object, quantity: quantity - 1 }));
        } else if (quantity === 1) {
          sessionStorage.removeItem(productName);
        }
        return;
      }
    } catch (e) {
      console.log(e);
    }
  }
  /**
   * Usuwa obiekt zapisany w session storage
   *
   * @param {Object} object - obiekt
   */
  static removeFromSession(object) {
    const { productName } = object;
    if (!productName) return;
    try {
      let exists = sessionStorage.getItem(productName);
      if (exists) {
        sessionStorage.removeItem(productName);
      }
    } catch (e) {
      console.log(e);
    }
  }
  /**
   * Wczytuje wszystkie produkty z Session storage do pamieci tymczasowej contextu
   *
   * @param {Function} setAuthState - Funkcja setContext
   */
  static loadFromSession(setAuthState) {
    let l = sessionStorage.length;
    let arr = [];
    for (let i = l - 1; i >= 0; i--) {
      //iterujemy od tylu do przodu, poniewaz usuniecie keya z przodu przenosi wszystkie pozostale klucze do przodu
      //i sprawia ze pozniejsze odwolania ida w nulle i nie kasuja pozniejszych pozycji
      let k = sessionStorage.key(i);
      let item = sessionStorage.getItem(k);
      try {
        let obj = JSON.parse(item);
        if (!obj) throw new Error();
        const { id, productName, productPrice, categoryName, quantity } = obj;
        if (productName !== k) throw new Error(); //aby powstrzymać wstrzykiwanie tych samych obiektów
        if (!id || !productName || !productPrice || !categoryName || !quantity) {
          throw new Error();
        } else {
          arr.push(obj);
        }
      } catch (error) {
        //kasuje wszystko co nie posiada wymaganych pól
        sessionStorage.removeItem(k);
        console.log(error);
      }
    }
    setAuthState((authState) => ({ ...authState, items: arr }));
  }
  /**
   * Kasuje wszystko co znajduje się w Session Storage
   *
   *
   */
  static emptySessionStorage() {
    sessionStorage.clear();
  }
  /**
   * Zapisuje produkty do Session storage
   *
   * @param {Array<Product>} items - Lista obiektów product
   */
  static setSessionStorage(items) {
    items.forEach((item) => {
      let productName = item.productName;
      if (productName) sessionStorage.setItem(productName, JSON.stringify({ ...item }));
    });
  }
}

export default Helper;
