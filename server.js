require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const cookieParser = require('cookie-parser');
const rifaRoutes = require('./routes/rifaRoutes');
const compraRoutes = require('./routes/compraRoutes');
const adminOrdenRoutes = require('./routes/adminOrdenRoutes');
const authRoutes = require('./routes/authRoutes');
const configRoutes = require('./routes/configRoutes');

const app = express();
app.set('trust proxy', 1);

// Configuración de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'partials/layout');

// Middlewares (deben ir ANTES de las rutas)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.use('/', rifaRoutes);
app.use('/', compraRoutes);
app.use('/', adminOrdenRoutes);
app.use('/', authRoutes);
app.use('/', configRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.render('index', { title: 'Sistema de Rifas' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});