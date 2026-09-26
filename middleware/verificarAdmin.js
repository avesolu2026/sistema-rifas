const jwt = require('jsonwebtoken');

function verificarAdmin(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect('/admin/login');
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = payload;
    next();
  } catch (error) {
    res.clearCookie('token');
    return res.redirect('/admin/login');
  }
}

module.exports = verificarAdmin;