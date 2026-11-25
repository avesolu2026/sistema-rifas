const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

async function verificarAdmin(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect('/admin/login');
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    res.clearCookie('token');
    return res.redirect('/admin/login');
  }

  try {
    // Se comprueba que el usuario exista y que su sesión no haya sido cerrada
    // por un cambio de contraseña (las sesiones viejas no traen "tv", cuentan como 0)
    const admin = await Admin.obtenerPorId(payload.id);
    const versionDeLaSesion = payload.tv || 0;

    if (!admin || (admin.token_version || 0) !== versionDeLaSesion) {
      res.clearCookie('token');
      return res.redirect('/admin/login');
    }

    req.admin = payload;
    next();
  } catch (error) {
    console.error('Error al verificar la sesión del admin:', error);
    return res.status(500).send('Error al verificar la sesión. Intenta de nuevo en un momento.');
  }
}

module.exports = verificarAdmin;