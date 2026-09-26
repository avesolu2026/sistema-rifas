const db = require('../config/db');

const Comprador = {
  async crear({ nombre, telefono, correo, ciudad }) {
    const [result] = await db.query(
      `INSERT INTO compradores (nombre, telefono, correo, ciudad) VALUES (?, ?, ?, ?)`,
      [nombre, telefono, correo, ciudad]
    );
    return result.insertId;
  },

  async buscarPorCorreo(correo) {
    const [rows] = await db.query(
      `SELECT * FROM compradores WHERE correo = ?`,
      [correo]
    );
    return rows;
  }
};

module.exports = Comprador;