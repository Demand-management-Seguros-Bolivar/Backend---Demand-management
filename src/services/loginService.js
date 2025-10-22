// src/services/bookService.js
const { logout } = require("../controllers/loginController");
const loginModel = require("../models/loginModel");

const loginService = {
  validateLogin: (token,res) => loginModel.validateLogin(token,res),
  checkSession: (token,res) => loginModel.checkSession(token,res),
  logout: (req,res) => loginModel.logout(req,res),
  verificateRol: (token,res) => loginModel.verificateRol(token,res),

};

module.exports = loginService;
