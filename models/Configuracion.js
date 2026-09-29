const db = require('../config/db');

module.exports = {
  async obtener() {
    const [rows] = await db.query('SELECT * FROM configuracion WHERE id = 1');
    return rows[0] || { whatsapp: null };
  },

  async actualizar(whatsapp) {
    await db.query('UPDATE configuracion SET whatsapp = ? WHERE id = 1', [whatsapp]);
  }
};