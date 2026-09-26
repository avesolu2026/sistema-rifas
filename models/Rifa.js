const db = require('../config/db');

const Rifa = {
  async crear({ titulo, descripcion, premio_imagenes, total_numeros, precio_numero, fecha_sorteo, digitos_boleta, paquetes }) {
    const [result] = await db.query(
      `INSERT INTO rifas (titulo, descripcion, premio_imagenes, total_numeros, precio_numero, fecha_sorteo, digitos_boleta, paquetes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [titulo, descripcion, JSON.stringify(premio_imagenes), total_numeros, precio_numero, fecha_sorteo, digitos_boleta, JSON.stringify(paquetes)]
    );
    return result.insertId;
  },

  async obtenerTodas() {
    const [rows] = await db.query('SELECT * FROM rifas ORDER BY creado_en DESC');
    return rows;
  },

  async obtenerPorId(id) {
    const [rows] = await db.query('SELECT * FROM rifas WHERE id = ?', [id]);
    return rows[0];
  },

  async actualizar(id, { titulo, descripcion, total_numeros, precio_numero, fecha_sorteo }) {
    await db.query(
      `UPDATE rifas SET titulo = ?, descripcion = ?, total_numeros = ?, precio_numero = ?, fecha_sorteo = ?
       WHERE id = ?`,
      [titulo, descripcion, total_numeros, precio_numero, fecha_sorteo, id]
    );
  },

  async agregarImagenes(id, nuevasImagenes) {
    const rifa = await this.obtenerPorId(id);
    const actuales = JSON.parse(rifa.premio_imagenes || '[]');
    const todas = [...actuales, ...nuevasImagenes];

    await db.query(
      `UPDATE rifas SET premio_imagenes = ? WHERE id = ?`,
      [JSON.stringify(todas), id]
    );
  },

  async eliminar(id) {
    await db.query('DELETE FROM numeros WHERE rifa_id = ?', [id]);
    await db.query('DELETE FROM ordenes WHERE rifa_id = ?', [id]);
    await db.query('DELETE FROM rifas WHERE id = ?', [id]);
  },

  async obtenerEstadisticas(id) {
    const [[datos]] = await db.query(
      `SELECT
         r.total_numeros,
         (SELECT COUNT(*) FROM numeros WHERE rifa_id = r.id AND estado = 'vendido') AS vendidos,
         (SELECT COUNT(*) FROM numeros WHERE rifa_id = r.id AND estado = 'reservado') AS reservados,
         (SELECT COUNT(*) FROM numeros WHERE rifa_id = r.id AND estado = 'disponible') AS disponibles,
         (SELECT COALESCE(SUM(valor_total),0) FROM ordenes WHERE rifa_id = r.id AND estado = 'aprobado') AS recaudado,
         (SELECT COUNT(*) FROM ordenes WHERE rifa_id = r.id AND estado = 'aprobado') AS ordenes_aprobadas,
         (SELECT COUNT(*) FROM ordenes WHERE rifa_id = r.id AND estado = 'pendiente') AS ordenes_pendientes
       FROM rifas r WHERE r.id = ?`,
      [id]
    );
    return datos;
  }
};

module.exports = Rifa;