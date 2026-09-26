const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const authController = {
  mostrarLogin(req, res) {
    res.render('admin/login', { title: 'Iniciar sesión', error: null });
  },

  async procesarLogin(req, res) {
    try {
      const { usuario, password } = req.body;

      const admin = await Admin.obtenerPorUsuario(usuario);
      if (!admin) {
        return res.render('admin/login', { title: 'Iniciar sesión', error: 'Usuario o contraseña incorrectos' });
      }

      const coincide = await bcrypt.compare(password, admin.password_hash);
      if (!coincide) {
        return res.render('admin/login', { title: 'Iniciar sesión', error: 'Usuario o contraseña incorrectos' });
      }

      const token = jwt.sign(
        { id: admin.id, usuario: admin.usuario },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        maxAge: 8 * 60 * 60 * 1000
      });

      res.redirect('/admin/rifas');
    } catch (error) {
      console.error(error);
      res.status(500).send('Error al iniciar sesión: ' + error.message);
    }
  },

  logout(req, res) {
    res.clearCookie('token');
    res.redirect('/admin/login');
  },

  mostrarFormularioCrearUsuario(req, res) {
    res.render('admin/crear-usuario', { title: 'Crear usuario', error: null });
  },

  async crearUsuario(req, res) {
    try {
      const { usuario, password, confirmarPassword } = req.body;

      if (password !== confirmarPassword) {
        return res.render('admin/crear-usuario', { title: 'Crear usuario', error: 'Las contraseñas no coinciden' });
      }

      const existente = await Admin.obtenerPorUsuario(usuario);
      if (existente) {
        return res.render('admin/crear-usuario', { title: 'Crear usuario', error: 'Ese usuario ya existe' });
      }

      await Admin.crear({ usuario, password });

      res.redirect('/admin/rifas');
    } catch (error) {
      console.error(error);
      res.status(500).send('Error al crear usuario: ' + error.message);
    }
  }
};

module.exports = authController;