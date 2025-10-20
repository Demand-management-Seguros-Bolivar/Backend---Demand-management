const express = require("express");
const poRoutes = require("./routes/poRoutes");
const loginRoutes = require("./routes/loginRoutes");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require('cookie-parser');

const app = express();

// 1️⃣ Middlewares básicos
app.use(express.json());
app.use(morgan('dev'));
app.use(cookieParser()); // ✅ siempre antes de las rutas

// 2️⃣ CORS configurado para permitir cookies
app.use(cors({
  origin: "http://localhost:4200", // Angular
  credentials: true,               // ✅ importante
  methods: "GET,POST,PUT,DELETE"
}));

// 3️⃣ Rutas
app.use("/api", poRoutes);
app.use("/api", loginRoutes);

module.exports = app;
