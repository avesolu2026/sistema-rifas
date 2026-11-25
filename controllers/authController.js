const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Crea la sesión (cookie) del admin con la versión actual de su contraseña
function iniciarSesion(res, admin, version) {
  const token = jwt.sign(
    { id: admin.id, usuario: admin.usuario, tv: version },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    maxAge: 8 * 60 * 60 * 1000
  });
}

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

      iniciarSesion(res, admin, admin.token_version || 0);

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
  },

  mostrarCambiarPassword(req, res) {
    res.render('admin/cambiar-password', {
      title: 'Cambiar contraseña',
      error: null,
      exito: null
    });
  },

  async cambiarPassword(req, res) {
    const vista = (error, exito) =>
      res.render('admin/cambiar-password', { title: 'Cambiar contraseña', error, exito });

    try {
      const { passwordActual, passwordNueva, confirmarPassword } = req.body;

      const adminId = req.admin && req.admin.id;
      if (!adminId) return res.redirect('/admin/login');

      const admin = await Admin.obtenerPorId(adminId);
      if (!admin) return res.redirect('/admin/login');

      if (!passwordActual || !passwordNueva || !confirmarPassword) {
        return vista('Completa todos los campos', null);
      }

      const coincideActual = await bcrypt.compare(passwordActual, admin.password_hash);
      if (!coincideActual) {
        return vista('La contraseña actual no es correcta', null);
      }

      if (passwordNueva.length < 8) {
        return vista('La nueva contraseña debe tener al menos 8 caracteres', null);
      }

      if (passwordNueva !== confirmarPassword) {
        return vista('La nueva contraseña y su confirmación no coinciden', null);
      }

      if (passwordNueva === passwordActual) {
        return vista('La nueva contraseña debe ser diferente a la actual', null);
      }

      // Cambia la contraseña y cierra todas las demás sesiones abiertas
      const nuevaVersion = await Admin.cambiarPassword(adminId, passwordNueva);

      // Quien la cambió sigue adentro con una sesión nueva
      iniciarSesion(res, admin, nuevaVersion);

      return vista(null, 'Contraseña actualizada. Las demás sesiones abiertas se cerraron.');
    } catch (error) {
      console.error(error);
      res.status(500).send('Error al cambiar la contraseña: ' + error.message);
    }
  }
};

module.exports = authController;