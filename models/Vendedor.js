const crypto = require('crypto');
const db = require('../config/db');

const Vendedor = {
  // Busca un vendedor activo de esa rifa por el código de su link
  async obtenerPorCodigo(rifa_id, codigo) {
    if (!codigo) return null;
    const [rows] = await db.query(
      'SELECT * FROM vendedores WHERE rifa_id = ? AND codigo = ? AND activo = 1',
      [rifa_id, String(codigo)]
    );
    return rows[0] || null;
  },

  // Guarda quién trajo la orden y marca sus números con ese vendedor
  async atribuirOrden(orden_id, vendedor_id) {
    await db.query('UPDATE ordenes SET vendedor_id = ? WHERE id = ?', [vendedor_id, orden_id]);
    await db.query('UPDATE numeros SET vendedor_id = ? WHERE orden_id = ?', [vendedor_id, orden_id]);
  },

  async crear({ rifa_id, nombre, telefono, color }) {
    const codigo = crypto.randomBytes(5).toString('hex').toUpperCase();
    const [result] = await db.query(
      'INSERT INTO vendedores (rifa_id, nombre, telefono, color, codigo) VALUES (?, ?, ?, ?, ?)',
      [rifa_id, nombre, telefono || null, color, codigo]
    );
    return result.insertId;
  },

  async obtenerPorId(id) {
    const [rows] = await db.query('SELECT * FROM vendedores WHERE id = ?', [id]);
    return rows[0];
  },

  // Lista los vendedores de una rifa con cuántos números vendió cada uno
  async listarConResumen(rifa_id) {
    const [rows] = await db.query(
      `SELECT v.*,
        (SELECT COUNT(*) FROM numeros n WHERE n.vendedor_id = v.id AND n.estado = 'vendido') AS vendidos,
        (SELECT COUNT(*) FROM numeros n WHERE n.vendedor_id = v.id AND n.estado = 'reservado') AS pendientes
       FROM vendedores v
       WHERE v.rifa_id = ?
       ORDER BY v.creado_en`,
      [rifa_id]
    );
    return rows;
  },

  async cambiarActivo(id, activo) {
    await db.query('UPDATE vendedores SET activo = ? WHERE id = ?', [activo ? 1 : 0, id]);
  }
};

module.exports = Vendedor;