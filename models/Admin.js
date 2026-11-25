const db = require('../config/db');
const bcrypt = require('bcryptjs');

const Admin = {
  async obtenerPorUsuario(usuario) {
    const [rows] = await db.query('SELECT * FROM admins WHERE usuario = ?', [usuario]);
    return rows[0];
  },

  async obtenerPorId(id) {
    const [rows] = await db.query('SELECT * FROM admins WHERE id = ?', [id]);
    return rows[0];
  },

  async crear({ usuario, password }) {
    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO admins (usuario, password_hash) VALUES (?, ?)',
      [usuario, passwordHash]
    );
    return result.insertId;
  },

  // Cambia la contraseña y sube la versión: así se cierran las sesiones anteriores.
  // Devuelve la versión nueva.
  async cambiarPassword(id, nuevaPassword) {
    const passwordHash = await bcrypt.hash(nuevaPassword, 10);
    await db.query(
      'UPDATE admins SET password_hash = ?, token_version = token_version + 1 WHERE id = ?',
      [passwordHash, id]
    );
    const [rows] = await db.query('SELECT token_version FROM admins WHERE id = ?', [id]);
    return rows[0].token_version;
  }
};

module.exports = Admin;