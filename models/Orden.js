const db = require('../config/db');

const Orden = {
  async crear({ rifa_id, comprador_id, cantidad_numeros, valor_total }) {
    const [result] = await db.query(
      `INSERT INTO ordenes (rifa_id, comprador_id, cantidad_numeros, valor_total)
       VALUES (?, ?, ?, ?)`,
      [rifa_id, comprador_id, cantidad_numeros, valor_total]
    );
    return result.insertId;
  },

  async guardarComprobante(orden_id, rutaComprobante) {
    await db.query(
      `UPDATE ordenes SET comprobante_pago = ? WHERE id = ?`,
      [rutaComprobante, orden_id]
    );
  },

  async obtenerPorId(id) {
    const [rows] = await db.query(`SELECT * FROM ordenes WHERE id = ?`, [id]);
    return rows[0];
  },

  async actualizarEstado(id, estado) {
    await db.query(`UPDATE ordenes SET estado = ? WHERE id = ?`, [estado, id]);
  },

  async obtenerConComprador(id) {
    const [rows] = await db.query(
      `SELECT ordenes.*, compradores.nombre, compradores.telefono, compradores.correo
       FROM ordenes
       JOIN compradores ON ordenes.comprador_id = compradores.id
       WHERE ordenes.id = ?`,
      [id]
    );
    return rows[0];
  },
  async listarPendientes() {
    const [rows] = await db.query(
      `SELECT ordenes.*, compradores.nombre, compradores.telefono, compradores.correo,
              rifas.titulo AS rifa_titulo
       FROM ordenes
       JOIN compradores ON ordenes.comprador_id = compradores.id
       JOIN rifas ON ordenes.rifa_id = rifas.id
       WHERE ordenes.estado = 'pendiente'
       ORDER BY ordenes.creado_en DESC`
    );
    return rows;
  },
  

  async obtenerPorRifa(rifa_id) {
    const [rows] = await db.query(
      `SELECT o.*, c.nombre, c.telefono, c.correo
       FROM ordenes o
       JOIN compradores c ON o.comprador_id = c.id
       WHERE o.rifa_id = ?
       ORDER BY o.creado_en DESC`,
      [rifa_id]
    );
    return rows;
  },
  
};

module.exports = Orden;