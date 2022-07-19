const express = require("express");
const cors = require("cors");
const session = require("express-session");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const createError = require("http-errors");
const { PrismaClient } = require(".prisma/client");
const prisma = new PrismaClient();
const controller = require("./AuthController");
const validate = require("./Validate");

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,

    store: new PrismaSessionStore(prisma, {
      ttl: 1000 * 60 * 30,
      checkPeriod: 1000 * 60 * 5,
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
    cookie: {
      maxAge: 1800000,
      secure: false,
      httpOnly: true,
      sameSite: "strict",
    },
  })
);

function requireAuth(req, res, next) {
  if (!req.session?.data) return res.status(401).json({ message: "Brak sesji", logout: true });

  next();
}

function requireCustomer(req, res, next) {
  if (!req.session?.data?.email) return res.status(401).json({ message: "Musisz być klientem" });

  next();
}

function requireOpenRestaurant(req, res, next) {
  const status = controller.isRestaurantOpen();
  if (!status) return res.status(401).json({ message: "Nie można składać zamówień, gdy restauracja jest zamknięta" });

  next();
}

function requireWorker(req, res, next) {
  if (!req.session?.data?.username) return res.status(401).json({ message: "Nie posiadasz wymaganych uprawnień" });
  if (!req.session?.data?.isActive) return res.status(401).json({ message: "Nie posiadasz wymaganych uprawnień" });

  next();
}

function MenuRights(req, res, next) {
  if (!(req.session?.data?.canEditMenu || req.session?.data?.isAdmin)) return res.status(401).json({ message: "Nie posiadasz wymaganych uprawnień" });

  next();
}

function ManageRights(req, res, next) {
  if (!(req.session?.data?.canEditWorkers || req.session?.data?.isAdmin)) return res.status(401).json({ message: "Nie posiadasz wymaganych uprawnień" });

  next();
}

function AdminRights(req, res, next) {
  if (!req.session?.data?.isAdmin) return res.status(401).json({ message: "Nie posiadasz wymaganych uprawnień" });

  next();
}

app.get("/startup", controller.startUp);
// ------------------- logowanie
app.post("/register", validate.validateCustomer, controller.register);
app.post("/login", controller.login);
app.get("/check", controller.check);
app.get("/logout", controller.logout);
// -------------------- akcje klienta
app.use("/user/", requireAuth, requireCustomer);
// --------------------
app.post("/user/createOrder", requireOpenRestaurant, controller.newOrder);
app.post("/user/verifyOrder", controller.verifyOrder);
app.post("/user/changePassword", validate.validatePassword, controller.changePassword);
app.post("/user/changeSettings", validate.validateCustomer, controller.changeSettings);
app.post("/user/allOrders", controller.allCustomersOrders);
// -----------------------------------------------  akcje pracownika / administratora
app.use("/worker/", requireAuth, requireWorker);
// ---------------------- zarzadzanie zamowieniami
app.post("/worker/orders/read", controller.getOrders);
app.post("/worker/orders/update", controller.updateOrder);
// ---------------------- zarzadzanie pracownikami
app.post("/worker/read", ManageRights, controller.getWorkers);
app.post("/worker/create", ManageRights, validate.validateWorker, controller.createWorker);
app.post("/worker/update", ManageRights, controller.updateWorker);
// ---------------------- zmiana hasła pracownika
app.post("/worker/updatePassword", validate.validatePassword, controller.changeWorkerPassword);
// ------------------------------------------------ zarzadzanie menu
app.use("/items/", requireAuth, requireWorker, MenuRights);
// ---------------------- zarzadzanie kategoriami
app.post("/items/category/create", controller.createCategory);
app.post("/items/category/update", controller.updateCategory);
app.post("/items/category/delete", controller.deleteCategory);
// ---------------------- zarzadzanie produktami
app.post("/items/product/create", controller.createProduct);
app.post("/items/product/update", controller.updateProduct);
app.post("/items/product/delete", controller.deleteProduct);
// ------------------------------------------------ czas otwarcia
app.get("/times/read", controller.getTimes);
app.post("/times/update", requireAuth, requireWorker, AdminRights, controller.updateTime);
// -----------------------
app.get("/menu", async function (req, res, next) {
  const products = await prisma.product.findMany();
  const categories = await prisma.category.findMany();
  if (!(products && categories)) {
    next(createError.Unauthorized("Nie udało się pobrać menu"));
  } else {
    res.send({
      products: products,
      categories: categories,
    });
  }
});

app.use(async (req, res, next) => {
  next(createError.NotFound("Route not Found"));
});
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    status: false,
    message: err.message,
    logout: err.logout,
  });
});

app.listen(8000, function () {
  console.log("Example app listening on port 8000!");
});
