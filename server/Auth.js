const { PrismaClient } = require(".prisma/client");
const prisma = new PrismaClient();
const createError = require("http-errors");
require("dotenv").config();
const bcrypt = require("bcrypt");

class Auth {
  static async register(data) {
    const { name, email, street, town, postCode, telephone, password } = data;

    const user = await prisma.customer.findUnique({
      where: {
        email: email,
      },
    });
    if (user) throw createError.Unauthorized("Podany adres email znajduje się już w bazie danych");

    const worker = await prisma.worker.findUnique({
      where: {
        username: email,
      },
    });
    if (worker) throw createError.Unauthorized("Podany adres email znajduje się już w bazie danych");

    const checkTel = await prisma.customer.findUnique({
      where: {
        telephone: telephone,
      },
    });
    if (checkTel) throw createError.Unauthorized("Podany nr. telefonu znajduje się już w bazie danych");

    const hashedPassword = await this.hashPassword(password);
    const userData = { name: name, street: street, town: town, postCode: postCode, email: email, telephone: telephone, password: hashedPassword };
    await prisma.customer.create({ data: userData });
  }

  static async login(data) {
    const { email, password } = data;
    let role = "";
    if (email === undefined || password === undefined) throw createError.Unauthorized("Podaj email i hasło");
    if (typeof email !== "string") throw createError.Unauthorized("Email musi być stringiem");
    if (typeof password !== "string") throw createError.Unauthorized("Hasło musi być stringiem");

    if ([...email].length < 3) throw createError.Unauthorized("Zbyt krótki email");
    if ([...password].length < 8) throw createError.Unauthorized("Zbyt krótkie hasło");

    const worker = await prisma.worker.findUnique({
      where: {
        username: email,
      },
    });
    const customer = await prisma.customer.findUnique({
      where: {
        email: email,
      },
    });

    if (worker) {
      const checkWorkerPassword = bcrypt.compareSync(password, worker.password);
      if (checkWorkerPassword) {
        if (!worker.isActive) throw createError.Unauthorized("Nieprawidłowy email lub hasło");

        role = "worker";
        delete worker.password;
        return {
          ...worker,
          role,
        };
      }
    }

    if (customer) {
      const checkCustomerPassword = bcrypt.compareSync(password, customer.password);
      if (checkCustomerPassword) {
        role = "customer";
        delete customer.password;
        return {
          ...customer,
          role,
        };
      }
    }

    throw createError.Unauthorized("Nieprawidłowy email lub hasło");
  }

  static async isAlreadyInSession(req, data) {
    const { email, username } = data;
    const sessions = await req.sessionStore.all((error, sessions) => {
      if (error) throw createError.Unauthorized("Problem z sesją");
      return sessions;
    });
    if (Object.keys(sessions).length === 0) return false;

    let userType;
    if (username) userType = "username";
    else if (email) userType = "email";
    const arr = Object.values(sessions);
    let found = false;
    for (let i = 0; i < arr.length && !found; i++) {
      if (arr[i].data[userType]) {
        if (arr[i].data[userType] === data[userType]) {
          found = true;
        }
      }
    }
    return found;
  }

  static async createWorker(req) {
    const { username, password, name, canEditMenu, canEditWorkers, isAdmin, isActive } = req.body;
    const updaterIsAdmin = req.session.data.isAdmin;

    if (!updaterIsAdmin) {
      if (isAdmin || canEditWorkers || canEditMenu) {
        throw createError.Unauthorized("Nie posiadasz wymaganych praw");
      }
    }

    const check = await prisma.worker.findUnique({
      where: {
        username: username,
      },
    });
    if (check) throw createError.Unauthorized("Nieprawidłowy login lub hasło");

    const customer = await prisma.customer.findUnique({
      where: {
        email: username,
      },
    });
    if (customer) throw createError.Unauthorized("Nieprawidłowy login lub hasło");

    const hashedPassword = await this.hashPassword(password);

    await prisma.worker.create({
      data: {
        username: username,
        password: hashedPassword,
        name: name,
        isActive: isActive,
        canEditMenu: updaterIsAdmin ? canEditMenu : false,
        canEditWorkers: updaterIsAdmin ? canEditWorkers : false,
        isAdmin: updaterIsAdmin ? isAdmin : false,
      },
    });
  }

  static async updateWorker(req) {
    const { canEditMenu, canEditWorkers, isAdmin, isActive, id } = req.body;
    if (req.session.data.id === id) throw createError.Unauthorized("Nie możesz edytować własnych uprawnień");
    const updaterIsAdmin = req.session.data.isAdmin;

    if (typeof canEditMenu !== "boolean") throw createError.Unauthorized("Nieprawidłowe dane");
    if (typeof canEditWorkers !== "boolean") throw createError.Unauthorized("Nieprawidłowe dane");
    if (typeof isAdmin !== "boolean") throw createError.Unauthorized("Nieprawidłowe dane");
    if (typeof isActive !== "boolean") throw createError.Unauthorized("Nieprawidłowe dane");

    const exists = await prisma.worker.findUnique({
      where: {
        id: id,
      },
    });
    if (!exists) throw createError.Unauthorized("Podany pracownik nie istnieje");

    if (exists.isAdmin || exists.canEditWorkers || exists.canEditMenu) {
      if (!updaterIsAdmin) {
        throw createError.Unauthorized("Nie posiadasz wymaganych uprawnień");
      }
    }

    const update = await prisma.worker.update({
      where: {
        id: id,
      },
      data: {
        canEditMenu: updaterIsAdmin ? canEditMenu : exists.canEditMenu,
        canEditWorkers: updaterIsAdmin ? canEditWorkers : exists.canEditWorkers,
        isAdmin: updaterIsAdmin ? isAdmin : exists.isAdmin,
        isActive,
      },
    });
    delete update.password;
    return update;
  }

  static async getWorkers(req) {
    const { perPage, cursor } = req.body;
    const updaterIsAdmin = req.session.data?.isAdmin;
    const updaterUsername = req.session.data?.username;

    if (!perPage) throw createError.Unauthorized("Podaj wszystkie wymagane informacje");
    if (typeof perPage !== "number") throw createError.Unauthorized("perPage musi być numerem");
    if (perPage < 1) throw createError.Unauthorized("perPage musi być numerem dodatnim, większym od 0");

    if (cursor) {
      if (typeof cursor !== "number") throw createError.Unauthorized("cursor musi być numerem");
      if (cursor < 1) throw createError.Unauthorized("cursor musi być numerem dodatnim, niezerowym");
    }

    let workers = [];
    try {
      if (cursor) {
        workers = await prisma.worker.findMany({
          skip: 1,
          take: perPage,
          cursor: {
            id: cursor,
          },
          where: {
            username: {
              not: updaterUsername,
            },
            //tutaj sprawdzam czy zglaszajacy jest adminem, jesli tak to zwracam wszystkich pracownikow
            //jesli nie to zwracam tylko tych ktorzy maja false w 3 polach - menu/workers/admin
            AND: [
              {
                OR: [{ canEditMenu: updaterIsAdmin ? true : false }, { canEditMenu: updaterIsAdmin ? false : false }],
              },
              {
                OR: [{ canEditWorkers: updaterIsAdmin ? true : false }, { canEditWorkers: updaterIsAdmin ? false : false }],
              },
              {
                OR: [{ isAdmin: updaterIsAdmin ? true : false }, { isAdmin: updaterIsAdmin ? false : false }],
              },
            ],
          },
          select: {
            id: true,
            username: true,
            name: true,
            isActive: true,
            canEditMenu: updaterIsAdmin,
            canEditWorkers: updaterIsAdmin,
            isAdmin: updaterIsAdmin,
          },
        });
      } else {
        workers = await prisma.worker.findMany({
          take: perPage,
          where: {
            username: {
              not: updaterUsername,
            },
            AND: [
              {
                OR: [{ canEditMenu: updaterIsAdmin ? true : false }, { canEditMenu: updaterIsAdmin ? false : false }],
              },
              {
                OR: [{ canEditWorkers: updaterIsAdmin ? true : false }, { canEditWorkers: updaterIsAdmin ? false : false }],
              },
              {
                OR: [{ isAdmin: updaterIsAdmin ? true : false }, { isAdmin: updaterIsAdmin ? false : false }],
              },
            ],
          },
          select: {
            id: true,
            username: true,
            name: true,
            isActive: true,
            canEditMenu: updaterIsAdmin,
            canEditWorkers: updaterIsAdmin,
            isAdmin: updaterIsAdmin,
          },
        });
      }
    } catch (e) {
      throw createError.Unauthorized("Nie udało sie pobrać wyników, odśwież stronę i spróbuj ponownie");
    }

    return workers;
  }

  static async fillStatus() {
    const names = [{ name: "started" }, { name: "accepted" }, { name: "rejected" }, { name: "finished" }];
    const exists = await prisma.orderStatus.findMany();
    if (exists.length > 0) return true;

    const status = await prisma.orderStatus.createMany({
      data: names,
    });

    return status;
  }

  static async fillAdmin() {
    const adminPass = process.env.adminPassword;
    let admin = {};
    const data = {
      username: "admin",
      password: adminPass,
      name: "admin",
      canEditMenu: true,
      canEditWorkers: true,
      isActive: true,
      isAdmin: true,
    };
    const exists = prisma.worker.findUnique({
      where: {
        username: "admin",
      },
    });
    if (!exists) {
      admin = await this.createWorker(data);
    }

    return admin;
  }

  static async getTimes() {
    const times = await prisma.operationTimes.findMany();
    const offset = new Date().getTimezoneOffset();

    return { times, offset };
  }

  static async updateTime(req) {
    const { day, startHours, startMinutes, endHours, endMinutes } = req.body;
    if (day === undefined || startHours === undefined || startMinutes === undefined || endHours === undefined || endMinutes === undefined) throw createError.Unauthorized("Brak wszystkich danych");

    //-----------------------------  weryfikacja danych
    const HR = new RegExp("^(([0-1][0-9])|(2[0-3])|[0-9])$"); // 0 to 9 or 00 to 23
    const MR = new RegExp("^(([0-5][0-9])|[0-9])$"); // 0 to 9 or 00 to 59

    // czas zapisywany w UTC

    if (!HR.test(startHours)) throw createError.Unauthorized("Nieprawidłowe dane");
    if (!HR.test(endHours)) throw createError.Unauthorized("Nieprawidłowe dane");
    if (!MR.test(startMinutes)) throw createError.Unauthorized("Nieprawidłowe dane");
    if (!MR.test(endMinutes)) throw createError.Unauthorized("Nieprawidłowe dane");

    const start = new Date();
    start.setUTCHours(parseInt(startHours), startMinutes, 0);
    const end = new Date();
    end.setUTCHours(parseInt(endHours), endMinutes, 0);

    // ----------------------------

    try {
      const time = await prisma.operationTimes.findUnique({
        where: {
          day: day,
        },
      });
      if (!time) throw createError.Unauthorized("Nieprawidłowy dzień");
    } catch (e) {
      throw createError.Unauthorized("Nieprawidłowy dzień");
    }

    const updateTime = await prisma.operationTimes.update({
      where: {
        day: day,
      },
      data: {
        start: start,
        end: end,
      },
    });

    return updateTime;
  }

  static async fillDays() {
    //nie ma znaczenia, zapisywane tylko godziny/minuty/sek/ms w UTC
    const date = new Date(Date.UTC(2022, 3, 4, 12, 12, 0, 0)); // poniedzialek zawsze
    const day = date.getDate(); // ktory dzien miesiaca 1-31
    const data = [
      {
        day: "Poniedziałek",
        start: 0,
        end: 0,
      },
      {
        day: "Wtorek",
        start: 0,
        end: 0,
      },
      {
        day: "Środa",
        start: 0,
        end: 0,
      },
      {
        day: "Czwartek",
        start: 0,
        end: 0,
      },
      {
        day: "Piątek",
        start: 0,
        end: 0,
      },
      {
        day: "Sobota",
        start: 0,
        end: 0,
      },
      {
        day: "Niedziela",
        start: 0,
        end: 0,
      },
    ];

    for (let i = 0; i < 7; i++) {
      // dodajemy od 0 do 6, czyli daty maja ustawiony poniedzialek - niedziela na kazdym dniu w UTC
      date.setDate(day + i);
      data[i].start = date;
      data[i].end = date;
    } //daty sa do zmiany przez admina po pierwszym wstawieniu

    // czas oprocz godzin nie jest zapisywany w bazie danych wiec to nie ma znaczenia...

    const exists = await prisma.operationTimes.findMany();

    if (exists.length > 0) return "failed";

    const days = await prisma.operationTimes.createMany({
      data: data,
    });

    return days;
  }

  static async allCustomersOrders(req) {
    const id = req?.session?.data?.id;
    if (!id) throw createError.Unauthorized("Brak sesji");

    const perPage = req.body?.perPage;
    if (!perPage) throw createError.Unauthorized("Nie ma podanej ilości wyników");

    const currentPage = req.body?.currentPage;
    if (!currentPage) {
      if (currentPage !== 0) throw createError.Unauthorized("Nie ma podanego numeru strony");
    }

    const start = currentPage * perPage;

    const count = await prisma.order.count({
      where: {
        customerId: id,
      },
    });
    if (count < 1) return [];

    const totalPages = Math.ceil(count / perPage);

    const allOrders = await prisma.order.findMany({
      skip: start,
      take: perPage,
      where: {
        customerId: id,
      },
      orderBy: {
        id: "desc",
      },
      select: {
        //id: true,
        comment: true,
        totalPrice: true,
        OrderStatus: true,
        OrderProducts: {
          select: {
            productQuantity: true,
            Product: {
              include: {
                Category: {
                  select: { categoryName: true },
                },
              },
            },
          },
        },
        date: true,
      },
    });

    return { allOrders, totalPages };
  }

  static async cursorCustomersOrders(req) {
    const id = req.session.data?.id;
    if (!id) throw createError.Unauthorized("Brak sesji");

    //sprawdzamy czy pole zostalo podane i jest wymagane (perPage, skip)
    //jesli podane sprawdz czy jest prawidlowe - dobry typ i dobra wartosc

    const perPage = req.body?.perPage;
    if (perPage === undefined) throw createError.Unauthorized("Brak podanego pola perPage"); //teoretycznie niepotrzebne, typeof da undefined i nie bedzie rowne z number
    if (typeof perPage !== "number") throw createError.Unauthorized("perPage musi być numerem");
    if (perPage < 1) throw createError.Unauthorized("perPage musi być numerem dodatnim");

    const skip = req.body?.skip;
    if (skip === undefined) throw createError.Unauthorized("Brak podanego pola skip");
    if (typeof skip !== "number") throw createError.Unauthorized("skip musi być numerem");

    let cursor = req.body.cursor;
    if (cursor !== undefined) {
      if (typeof cursor !== "number") throw createError.Unauthorized("cursor musi być numerem");
      if (cursor < 1) throw createError.Unauthorized("cursor musi być numerem dodatnim");
    }

    const refresh = req.body.refresh;
    if (refresh !== undefined) {
      if (typeof refresh !== "boolean") throw createError.Unauthorized("refresh musi być booleanem");
    }

    const wantedPage = req.body.wantedPage;
    if (wantedPage !== undefined) {
      if (typeof wantedPage !== "number") throw createError.Unauthorized("wantedPage musi być numerem");
      if (wantedPage < 0) throw createError.Unauthorized("wantedPage musi być numerem dodatnim");
    }

    const direction = skip > 0 ? true : false;
    const times = Math.abs(skip);

    const count = await prisma.order.count({
      where: {
        customerId: id,
      },
    });
    if (count < 1) return [];

    const totalPages = Math.ceil(count / perPage);
    if (wantedPage > totalPages - 1) throw createError.Unauthorized("wantedPage musi być mniejsze od liczby wszystkich stron");

    try {
      if (cursor) {
        let allOrders = [];
        for (let i = 0; i < times; i++) {
          allOrders = await prisma.order.findMany({
            skip: refresh ? 0 : 1,
            take: direction ? perPage : -perPage,
            cursor: {
              id: cursor,
            },
            where: {
              customerId: id,
            },
            orderBy: {
              id: "desc",
            },
            select: {
              id: true,
              comment: true,
              totalPrice: true,
              OrderStatus: true,
              OrderProducts: {
                select: {
                  productQuantity: true,
                  Product: {
                    include: {
                      Category: {
                        select: { categoryName: true },
                      },
                    },
                  },
                },
              },
              date: true,
            },
          });
          if (direction) cursor = allOrders[allOrders.length - 1].id;
          if (!direction) cursor = allOrders[0].id;
        }

        return { allOrders, totalPages, wantedPage };
      } else {
        const allOrders = await prisma.order.findMany({
          take: perPage,
          where: {
            customerId: id,
          },
          orderBy: {
            id: "desc",
          },
          select: {
            id: true,
            comment: true,
            totalPrice: true,
            OrderStatus: true,
            OrderProducts: {
              select: {
                productQuantity: true,
                Product: {
                  include: {
                    Category: {
                      select: { categoryName: true },
                    },
                  },
                },
              },
            },
            date: true,
          },
        });

        return { allOrders, totalPages, wantedPage: 0 };
      }
    } catch (error) {
      //jesli wystapi blad prismy - czyli jakis numer nie istnieje
      //lub nasz cursor wychodzi poza zakres wynikow
      //custom error aby uzytkownik nie widzial komunikatu prismy
      throw createError.Unauthorized("Nie udało sie pobrać wyników, odśwież stronę i spróbuj ponownie");
    }
  }

  static async getOrders(req) {
    const id = req.session.data?.id;
    if (!id) throw createError.Unauthorized("Brak sesji");

    const perPage = req.body?.perPage;
    if (!perPage) throw createError.Unauthorized("Nie ma podanej ilości wyników");

    const filter = req.body?.filter;
    if (!filter) throw createError.Unauthorized("Brak podanego typu zamówień");

    const order = req.body?.order;
    if (order !== "asc" && order !== "desc") throw createError.Unauthorized("Nieprawidłowa kolejność wyświetlania wyników: asc lub desc");

    const reload = req.body?.reload;

    let cursor = req.body?.cursor;

    const skip = req.body?.skip;
    const direction = skip > 0 ? true : false;
    const times = Math.abs(skip);

    const count = await prisma.order.count({
      where: {
        OrderStatus: {
          name: filter,
        },
      },
    });
    if (count < 1) return [];

    const totalPages = Math.ceil(count / perPage);

    try {
      if (cursor) {
        let allOrders = [];
        for (let i = 0; i < times; i++) {
          allOrders = await prisma.order.findMany({
            skip: reload ? 0 : 1,
            take: direction ? perPage : -perPage,
            cursor: {
              id: cursor,
            },
            where: {
              OrderStatus: {
                name: filter,
              },
            },
            orderBy: {
              id: order,
            },
            select: {
              id: true,
              comment: true,
              totalPrice: true,
              OrderStatus: {
                select: {
                  name: true,
                },
              },
              Change: {
                select: {
                  id: true,
                  description: true,
                },
              },
              Customer: {
                select: {
                  name: true,
                  street: true,
                  town: true,
                  postCode: true,
                  email: true,
                  telephone: true,
                },
              },
              OrderProducts: {
                select: {
                  productQuantity: true,
                  Product: {
                    include: {
                      Category: {
                        select: { categoryName: true },
                      },
                    },
                  },
                },
              },
              date: true,
            },
          });
          if (direction) cursor = allOrders[allOrders.length - 1].id;
          if (!direction) cursor = allOrders[0].id;
        }
        return { allOrders, totalPages };
      } else {
        const allOrders = await prisma.order.findMany({
          take: perPage,
          where: {
            OrderStatus: {
              name: filter,
            },
          },
          orderBy: {
            id: order,
          },
          select: {
            id: true,
            comment: true,
            totalPrice: true,
            OrderStatus: {
              select: {
                name: true,
              },
            },
            Change: {
              select: {
                id: true,
                description: true,
              },
            },
            Customer: {
              select: {
                name: true,
                street: true,
                town: true,
                postCode: true,
                email: true,
                telephone: true,
              },
            },
            OrderProducts: {
              select: {
                productQuantity: true,
                Product: {
                  include: {
                    Category: {
                      select: { categoryName: true },
                    },
                  },
                },
              },
            },
            date: true,
          },
        });

        return { allOrders, totalPages };
      }
    } catch (error) {
      throw createError.Unauthorized("Nie udało sie pobrać wyników, odśwież stronę i spróbuj ponownie");
    }
  }

  static async updateOrder(req) {
    const { OrderStatusName, id } = req.body;
    const workerId = req.session.data.id;
    const worker = await prisma.worker.findUnique({
      where: {
        id: workerId,
      },
      select: {
        id: true,
        username: true,
      },
    });
    if (!worker) throw createError.Unauthorized("Pracownik nie istnieje");

    if (isNaN(id)) throw createError.Unauthorized("ID zamówienia musi być numerem");

    const parsedId = parseInt(id);

    const exists = await prisma.order.findUnique({
      where: {
        id: parsedId,
      },
      select: {
        OrderStatus: true,
      },
    });
    if (!exists) throw createError.Unauthorized("Zamówienie nie istnieje");

    const x = exists.OrderStatus.name;
    if (x === "finished" || x === "rejected") throw createError.Unauthorized("Zamówienie jest zakończone");

    const OrdStat = await prisma.orderStatus.findUnique({
      where: {
        name: OrderStatusName,
      },
    });
    if (!OrdStat) throw createError.Unauthorized("Nieprawidłowa nazwa statusu");

    let description1;
    if (OrderStatusName === "accepted") description1 = "Przyjęte przez: ";
    if (OrderStatusName === "rejected") description1 = "Odrzucone przez: ";
    if (OrderStatusName === "finished") description1 = "Wysłane przez: ";

    const updated = await prisma.order.update({
      where: {
        id: parsedId,
      },
      data: {
        orderStatusId: OrdStat.id,
        Change: {
          create: {
            workerId: worker.id,
            description: description1 + worker.username,
          },
        },
      },
    });

    return updated;
  }

  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    return hashed;
  }

  static async createChange(orderId, workerId, description) {
    if ([...description].length < 1) throw createError.Unauthorized("Opis nie może być pusty");

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });
    if (!order) throw createError.Unauthorized("Brak zamówienia o podanym id");

    const worker = await prisma.worker.findUnique({
      where: {
        id: workerId,
      },
    });

    if (!worker) throw createError.Unauthorized("Brak pracownika o podanym id");
    const change = await prisma.change.create({
      where: {
        orderId: orderId,
        workerId: workerId,
        description: description,
      },
    });

    return change;
  }

  static async createOrder(req) {
    const { comment } = req.body;
    const items = await this.verifyOrder(req);

    if (req.body?.items?.length !== items.length) throw createError.Unauthorized("Błędne produkty w koszyku");

    const isWorker = req.session?.data?.username;
    if (isWorker) throw createError.Unauthorized("Pracownicy nie mogą składać zamówień");

    const id = req.session?.data?.id;
    if (!id) throw createError.Unauthorized("Upłynęła Ci sesja");

    if (comment) {
      //komentarz nie jest wymagany
      if (typeof comment !== "string") throw createError.Unauthorized("Komentarz musi być stringiem");
    }

    let totalPrice = 0;

    for (let i = 0; i < items.length; i++) {
      totalPrice += items[i].productPrice * items[i].quantity;
    }

    if (totalPrice < 1) throw createError.Unauthorized("Błąd z przeliczaniem ceny zamówienia");

    const date = new Date();
    //szuka stanu poczatkowego zamówienia
    const x = await prisma.OrderStatus.findUnique({
      where: {
        name: "started",
      },
    });

    if (!x) throw createError.Unauthorized("Brak początkowego stanu zamówień");

    const OrderProducts = items.map((item) => {
      return { productId: item.id, productQuantity: item.quantity };
    });

    const createOrder = await prisma.order.create({
      data: {
        customerId: id,
        comment: comment,
        totalPrice: totalPrice,
        date: date,
        orderStatusId: x.id,
        OrderProducts: {
          createMany: {
            data: OrderProducts,
          },
        },
      },
    });
    if (!createOrder) throw createError.Unauthorized("Nie udało się utworzyć zamówienia");

    return createOrder;
  }

  static async verifyOrder(req) {
    const { items } = req.body;
    if (!items || items?.length === 0) throw createError.Unauthorized("Brak podanych produktów");

    let ids = [];
    let idsAndQuantities = [];
    for (let i = 0; i < items.length; i++) {
      let id = items[i].id ? items[i].id : 0;
      let quantity = items[i].quantity ? items[i].quantity : 1;
      if (id !== 0) {
        ids.push(id);
        idsAndQuantities.push({ id: id, quantity: quantity });
      }
    }

    if (ids.length !== new Set(ids).size) {
      // set moze miec tylko unikalne wartości, porównaj czy tyle samo elementów
      throw createError.Unauthorized("Produkty nie mogą się powtarzać w zamówieniu");
    }

    const productsInCart = await prisma.product.findMany({
      where: {
        id: { in: ids },
      },
      select: {
        id: true,
        productName: true,
        productPrice: true,
        Category: {
          select: {
            categoryName: true,
          },
        },
      },
    });

    if (!productsInCart) throw createError.Unauthorized("Produkty nie istnieją na serwerze, spróbuj ponownie lub skontaktuj się z restauracją.");

    const result = productsInCart.map((product) => {
      let quantity = 1;
      let done = false;
      for (let i = 0; i < idsAndQuantities.length && !done; i++) {
        if (product.id === idsAndQuantities[i].id) {
          quantity = idsAndQuantities[i].quantity;
          done = true;
        }
      }

      return {
        id: product.id,
        productName: product.productName,
        categoryName: product.Category.categoryName,
        productPrice: product.productPrice,
        quantity: quantity,
      };
    });
    return result;
  }

  static async createCategory(data) {
    const { categoryName, categoryDescription } = data;
    if ([...categoryName].length < 1) {
      throw createError.Unauthorized("Zbyt krótka nazwa kategorii");
    }

    const checkIfNameTaken = await prisma.category.findUnique({
      where: {
        categoryName: categoryName,
      },
    });
    if (checkIfNameTaken) throw createError.Unauthorized("Nazwa jest już zajęta");

    const category = await prisma.category.create({
      data: {
        categoryName: categoryName,
        categoryDescription: categoryDescription,
      },
    });
    if (!category) throw createError.Unauthorized("Nie udało się utworzyć kategorii");

    return category;
  }

  static async updateCategory(data) {
    const { categoryName, categoryDescription, id } = data;
    if ([...categoryName].length < 1) {
      throw createError.Unauthorized("Zbyt krótka nazwa kategorii");
    }
    const category = await prisma.category.findUnique({
      where: {
        id: id,
      },
    });
    if (!category) throw createError.Unauthorized("Kategoria nie istnieje");

    if (category.categoryName !== categoryName) {
      const checkIfNameTaken = await prisma.category.findUnique({
        where: {
          categoryName: categoryName,
        },
      });
      if (checkIfNameTaken) throw createError.Unauthorized("Nazwa jest już zajęta");
    }

    const updatedCategory = await prisma.category.update({
      where: {
        id: id,
      },
      data: {
        categoryName: categoryName,
        categoryDescription: categoryDescription,
      },
    });
    if (!updatedCategory) throw createError.Unauthorized("Nie udało się zmienić kategorii");

    return updatedCategory;
  }

  static async deleteCategory(data) {
    const { id } = data;

    const category = await prisma.category.findUnique({
      where: {
        id: id,
      },
    });
    if (!category) throw createError.Unauthorized("Podana kategoria nie istnieje");

    const hasProducts = await prisma.category.findUnique({
      where: {
        id: id,
      },
      select: {
        Product: true,
      },
    });
    if (hasProducts.Product.length > 0) throw createError.Unauthorized("Można usuwać tylko puste kategorie");

    const result = await prisma.category.delete({
      where: {
        id: id,
      },
    });
    if (!result) throw createError.Unauthorized("Nie udało się usunąć kategorii");

    return result;
  }

  static async createProduct(data) {
    const { productName, productDescription, productPrice, categoryName } = data;
    const adjustedPrice = parseFloat(parseFloat(productPrice).toFixed(2));
    if ([...productName].length < 1) {
      throw createError.Unauthorized("Zbyt krótka nazwa produktu");
    }
    if (adjustedPrice < 1) {
      throw createError.Unauthorized("Zbyt niska cena");
    }
    const category = await prisma.category.findUnique({
      where: {
        categoryName: categoryName,
      },
    });
    if (!category) throw createError.Unauthorized("Kategoria nie istnieje");

    const checkIfNameTaken = await prisma.product.findUnique({
      where: {
        productName: productName,
      },
    });
    if (checkIfNameTaken) throw createError.Unauthorized("Nazwa jest już zajęta");

    const product = await prisma.product.create({
      data: {
        categoryId: category.id,
        productName: productName,
        productPrice: adjustedPrice,
        productDescription: productDescription,
      },
    });
    if (!product) throw createError.Unauthorized("Nie udało się utworzyć kategorii");

    return product;
  }

  static async updateProduct(data) {
    const { productName, productDescription, productPrice, id } = data;
    const adjustedPrice = parseFloat(parseFloat(productPrice).toFixed(2));

    if ([...productName].length < 1) {
      throw createError.Unauthorized("Zbyt krótka nazwa produktu");
    }
    if (adjustedPrice < 1) {
      throw createError.Unauthorized("Zbyt niska cena");
    }

    const product = await prisma.product.findUnique({
      where: {
        id: id,
      },
    });
    if (!product) throw createError.Unauthorized("Produkt nie istnieje");

    if (product.productName !== productName) {
      const checkIfNameTaken = await prisma.product.findUnique({
        where: {
          productName: productName,
        },
      });
      if (checkIfNameTaken) throw createError.Unauthorized("Nazwa jest już zajęta");
    }

    const updatedProduct = await prisma.product.update({
      where: {
        id: id,
      },
      data: {
        productPrice: adjustedPrice,
        productName: productName,
        productDescription: productDescription,
      },
    });
    if (!updatedProduct) throw createError.Unauthorized("Nie udało się zmienić kategorii");

    return updatedProduct;
  }

  static async deleteProduct(data) {
    const { id } = data;

    const product = await prisma.product.findUnique({
      where: {
        id: id,
      },
    });
    if (!product) throw createError.Unauthorized("Podany produkt nie istnieje");

    const result = await prisma.product.delete({
      where: {
        id: id,
      },
    });
    if (!result) throw createError.Unauthorized("Nie udało się usunąć produktu");

    return result;
  }

  static async isRestaurantOpen() {
    const d = new Date();
    const day = d.getUTCDay();
    const daysInDatabase = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];
    const time = await prisma.operationTimes.findUnique({
      where: {
        day: daysInDatabase[day],
      },
    });
    if (!time) return false;

    const s = new Date(time.start);
    const e = new Date(time.end);

    const sh = s.getUTCHours();
    const sm = s.getUTCMinutes();

    const eh = e.getUTCHours();
    const em = e.getUTCMinutes();
    // 0 - 1439
    const currTimeInMinutes = 60 * d.getUTCHours() + d.getUTCMinutes(); //latwiejsze przeliczanie, omijamy przechodzenie godzin
    const openingTime = 60 * sh + sm;
    const closingTime = 60 * eh + em;

    if (currTimeInMinutes >= openingTime && currTimeInMinutes < closingTime) return true;
    return false;
  }

  static async changeWorkerPassword(req) {
    const { password, newPassword } = req.body;
    const username = req.session?.data?.username;
    //sprawdzam czy haslo poprawne, jesli nie to wyrzuca blad
    await this.login({ email: username, password });

    const hashedPassword = await this.hashPassword(newPassword);
    const updatedUser = await prisma.worker.update({
      where: {
        username,
      },
      data: { password: hashedPassword },
    });
    if (!updatedUser) throw createError.Unauthorized("Nie udało się zaktualizować hasła");
  }
}

module.exports = Auth;
