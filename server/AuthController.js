const auth = require("./Auth");
const createError = require("http-errors");
const { PrismaClient } = require(".prisma/client");
const prisma = new PrismaClient();

class authController {
  static async register(req, res, next) {
    try {
      await auth.register(req.body);
      res.status(200).json({
        message: "Utworzono konto",
      });
    } catch (e) {
      next(createError(e.statusCode, e.message));
    }
  }

  static async createWorker(req, res, next) {
    try {
      await auth.createWorker(req);
      res.status(200).json({
        message: "Utworzono konto pracownika",
      });
    } catch (e) {
      next(createError(e.statusCode, e.message));
    }
  }

  static async updateWorker(req, res, next) {
    try {
      await auth.updateWorker(req);
      res.status(200).json({
        message: "Uaktualniono konto pracownika",
      });
    } catch (e) {
      next(createError(e.statusCode, e.message));
    }
  }

  static async check(req, res, next) {
    try {
      if (!req.session.data) throw createError.Unauthorized("No session");
      const email = req.session.data?.email;
      const username = req.session.data?.username;
      if (!(email || username)) throw createError.Unauthorized("No session");

      if (email) {
        const user = await prisma.customer.findUnique({
          where: {
            email: email,
          },
        });
        if (!user) throw createError.Unauthorized("Nieprawidłowe informacje");
      }
      if (username) {
        const worker = await prisma.worker.findUnique({
          where: {
            username: username,
          },
        });
        if (!worker) throw createError.Unauthorized("Nieprawidłowe informacje");
      }

      res.status(200).json({
        data: req.session.data,
      });
    } catch (e) {
      next(createError(e.statusCode, e.message));
    }
  }

  static logout = async (req, res, next) => {
    try {
      if (req.session.data) {
        res.clearCookie("connect.sid");
        req.session.destroy((err) => {
          if (err) {
            next(createError(err.statusCode, err.message));
          }
        });
      }
      res.status(200).json({
        message: "Logged out successfully",
      });
    } catch (e) {
      next(createError(e.statusCode, e.message));
    }
  };

  static changePassword = async (req, res, next) => {
    try {
      const { password, newPassword } = req.body;
      const email = req.session?.data?.email;
      if (!email) throw createError.Unauthorized("Brak sesji, zaloguj się na nowo");
      await auth.login({ email, password });

      const hashedPassword = await auth.hashPassword(newPassword);
      const updatedUser = await prisma.customer.update({
        where: {
          email: email,
        },
        data: { password: hashedPassword },
      });
      if (!updatedUser) throw createError.Unauthorized("Nie udało się zaktualizować hasła");

      res.status(200).json({
        message: "Hasło zostało zmienione!",
      });
    } catch (e) {
      next(createError(e.statusCode, e.message));
    }
  };

  static changeSettings = async (req, res, next) => {
    try {
      const { name, email, password, street, town, postCode, telephone } = req.body;
      const sessionEmail = req.session?.data?.email;
      const role = "customer";
      const data = { name, street, town, postCode, telephone };
      if (email !== sessionEmail) throw createError.Unauthorized("Niedozwolone");

      const user = await auth.login({ email, password });
      const checkIfTelephoneTaken = await prisma.customer.findUnique({
        where: {
          telephone: telephone,
        },
      });
      if (checkIfTelephoneTaken) {
        if (user.email !== checkIfTelephoneTaken.email) throw createError.Unauthorized("Ten nr. telefonu istnieje już w bazie");

        if (user.email === checkIfTelephoneTaken.email) {
          const updatedUserData = await prisma.customer.update({
            where: {
              email: email,
            },
            data: data,
          });
          delete updatedUserData.password;

          req.session.data = { ...updatedUserData, role: role };
          res.status(200).json({
            data: { ...updatedUserData, role: role },
          });
        }
      }
      if (!checkIfTelephoneTaken) {
        const updatedUserData = await prisma.customer.update({
          where: {
            email: email,
          },
          data: data,
        });
        delete updatedUserData.password;

        req.session.data = { ...updatedUserData, role: role };
        res.status(200).json({
          data: { ...updatedUserData, role: role },
        });
      }
    } catch (e) {
      next(createError(e.statusCode, e.message));
    }
  };

  static async login(req, res, next) {
    try {
      const data = await auth.login(req.body);
      let alreadyLoggedIn;
      if (data) {
        alreadyLoggedIn = await auth.isAlreadyInSession(req, data);
        if (alreadyLoggedIn) {
          throw createError.Unauthorized("Konto jest już zalogowane");
        } else {
          req.session.data = data;
        }
      }
      res.status(200).json({
        status: true,
        message: "Account login successful",
        data,
      });
    } catch (e) {
      next(createError(e.statusCode, e.message));
    }
  }

  static async allCustomersOrders(req, res, next) {
    try {
      //const orders = await auth.allCustomersOrders(req);
      const orders = await auth.cursorCustomersOrders(req);
      res.status(200).json({
        message: "All active orders by user",
        data: orders,
      });
    } catch (e) {
      next(createError(e.statusCode, e.message));
    }
  }

  static async startUp(req, res, next) {
    try {
      await auth.fillStatus();
      await auth.fillAdmin();
      await auth.fillDays();
    } catch (e) {
      next(createError(e.statusCode, e.message));
    }
  }

  static async getTimes(req, res, next) {
    try {
      const times = await auth.getTimes();
      res.status(200).json({
        message: "Czasy otwarcia",
        data: times,
      });
    } catch (e) {
      next(createError(e.statusCode, e.message));
    }
  }

  static async updateTime(req, res, next) {
    try {
      const time = await auth.updateTime(req);
      res.status(200).json({
        message: "Zaktualizowano dzień",
        data: time,
      });
    } catch (e) {
      next(createError(e.statusCode, e.message));
    }
  }

  static async getWorkers(req, res, next) {
    try {
      const workers = await auth.getWorkers(req);
      res.status(200).json({
        message: "Pracownicy",
        data: workers,
      });
    } catch (e) {
      next(createError(e.statusCode, e.message));
    }
  }

  static async getOrders(req, res, next) {
    try {
      const orders = await auth.getOrders(req);
      res.status(200).json({
        message: "Zamówienia",
        data: orders,
      });
    } catch (e) {
      next(createError(e.statusCode, e.message));
    }
  }

  static async updateOrder(req, res, next) {
    try {
      const order = await auth.updateOrder(req);
      res.status(200).json({
        message: "Zamówienia",
        data: order,
      });
    } catch (e) {
      next(createError(e.statusCode, e.message));
    }
  }

  static async createCategory(req, res, next) {
    try {
      const category = await auth.createCategory(req.body);
      res.status(200).json({
        message: "Pomyślnie utworzono kategorię",
        data: category,
      });
    } catch (e) {
      next(createError(e.statusCode, e.message));
    }
  }

  static async updateCategory(req, res, next) {
    try {
      const category = await auth.updateCategory(req.body);
      res.status(200).json({
        message: "Pomyślnie zmieniono kategorię",
        data: category,
      });
    } catch (e) {
      next(createError(e.statusCode, e.message));
    }
  }

  static async deleteCategory(req, res, next) {
    try {
      const category = await auth.deleteCategory(req.body);
      res.status(200).json({
        message: "Pomyślnie usunięto kategorię",
        data: category,
      });
    } catch (e) {
      next(createError(e.statusCode, e.message));
    }
  }

  static async createProduct(req, res, next) {
    try {
      const product = await auth.createProduct(req.body);
      res.status(200).json({
        message: "Pomyślnie utworzono produkt",
        data: product,
      });
    } catch (e) {
      next(createError(e.statusCode, e.message));
    }
  }

  static async updateProduct(req, res, next) {
    try {
      const product = await auth.updateProduct(req.body);
      res.status(200).json({
        message: "Pomyślnie utworzono produkt",
        data: product,
      });
    } catch (e) {
      next(createError(e.statusCode, e.message));
    }
  }

  static async deleteProduct(req, res, next) {
    try {
      const product = await auth.deleteProduct(req.body);
      res.status(200).json({
        message: "Pomyślnie usunięto produkt",
        data: product,
      });
    } catch (e) {
      next(createError(e.statusCode, e.message));
    }
  }

  static async newOrder(req, res, next) {
    try {
      const newOrder = await auth.createOrder(req);
      res.status(200).json({
        message: "Utworzono nowe zamówienie",
        order: newOrder,
      });
    } catch (e) {
      next(createError(e.statusCode, e.message));
    }
  }

  static async verifyOrder(req, res, next) {
    try {
      const order = await auth.verifyOrder(req);
      res.status(200).json({
        message: "Potwierdzone produkty",
        order: order, //zwróc wszystkie zwalidowane produkty
      });
    } catch (e) {
      next(createError(e.statusCode, e.message)); //jesli wszystkie produkty są nieprawidlowe
    }
  }

  static async isRestaurantOpen(req, res, next) {
    try {
      return await auth.isRestaurantOpen();
    } catch (e) {
      next(createError(e.statusCode, e.message));
    }
  }

  static async changeWorkerPassword(req, res, next) {
    try {
      await auth.changeWorkerPassword(req);
      res.status(200).json({
        message: "Hasło zostało zmienione!",
      });
    } catch (e) {
      next(createError(e.statusCode, e.message));
    }
  }
}
module.exports = authController;
