const yup = require("yup");

let pass = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[`!@#$%^&*])(?=.{8,})");
let postReg = new RegExp("([0-9]{2}[-][0-9]{3})");
let teleReg = new RegExp("(^([0-9]{3}([\\s]|[-])){2}[0-9]{3}$)");

const customerSchema = yup.object().shape({
  name: yup.string().required("Podaj imie"),
  email: yup.string().email("Podaj mail w formacie mail@domena.pl").required("Podaj adres email"),
  password: yup.string().required("Podaj hasło").matches(pass, "Hasło musi zawierać 8 znaków, 1 dużą literę, 1 małą literę, 1 numer i 1 znak specjalny"),
  passwordConfirmation: yup
    .string()
    .required("Potwierdź hasło")
    .oneOf([yup.ref("password"), null], "Hasła muszą sie zgadzać"),
  street: yup.string().required("Podaj nazwę ulicy"),
  town: yup.string().required("Podaj nazwę miasta"),
  postCode: yup.string().required("Podaj kod pocztowy").max(6, "Zbyt dużo znaków, podaj kod w formacie 00-000").min(6, "Minimum 6 cyfr, podaj kod w formacie 00-000").matches(postReg, "Podaj kod w formacie 00-000"),
  telephone: yup.string().required("Podaj numer swojego telefonu").min(11, "Format: 000-000-000 lub 000 000 000").max(11, "Numer jest zbyt długi").matches(teleReg, "Numer podany w złym formacie"),
  terms: yup.bool().required().oneOf([true], "Musisz zaakceptować warunki"),
});

const workerSchema = yup.object().shape({
  username: yup.string().min(4, "Podaj przynajmniej 4 znaki").required("Podaj login"),
  name: yup.string().required("Podaj imie i nazwisko"),
  password: yup.string().required("Podaj hasło").matches(pass, "Hasło musi zawierać 8 znaków, 1 dużą literę, 1 małą literę, 1 numer i 1 znak specjalny"),
  passwordConfirmation: yup
    .string()
    .required("Potwierdź hasło")
    .oneOf([yup.ref("password"), null], "Hasła muszą sie zgadzać"),
  canEditMenu: yup.bool().required(),
  canEditWorkers: yup.bool().required(),
  isAdmin: yup.bool().required(),
  isActive: yup.bool().required(),
  terms: yup.bool().required().oneOf([true], "Musisz zgodzić się aby utworzyć konto"),
});

const passwordSchema = yup.object().shape({
  password: yup.string().required("Podaj hasło").matches(pass, "Hasło musi zawierać 8 znaków, 1 dużą literę, 1 małą literę, 1 numer i 1 znak specjalny"),
  newPasswordConfirmation: yup
    .string()
    .required("Potwierdź hasło")
    .oneOf([yup.ref("newPassword"), null], "Hasła muszą sie zgadzać"),
  newPassword: yup.string().required("Podaj hasło").matches(pass, "Hasło musi zawierać 8 znaków, 1 dużą literę, 1 małą literę, 1 numer i 1 znak specjalny"),
  terms: yup.bool().required().oneOf([true], "Musisz potwierdzić aby zmienić hasło"),
});

class Validate {
  static async validateWorker(req, res, next) {
    try {
      await workerSchema.validate({
        ...req.body,
      });
      return next();
    } catch (err) {
      return res.status(401).json({ type: err.name, message: err.message });
    }
  }

  static validateCustomer = async (req, res, next) => {
    try {
      await customerSchema.validate({
        ...req.body,
      });
      return next();
    } catch (err) {
      return res.status(401).json({ type: err.name, message: err.message });
    }
  };

  static validatePassword = async (req, res, next) => {
    await passwordSchema
      .validate({
        ...req.body,
      })
      .then(() => {
        return next();
      })
      .catch((err) => {
        return res.status(401).json({ type: err.name, message: err.message });
      });
  };
}

module.exports = Validate;
