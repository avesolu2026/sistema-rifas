const db = require('../config/db');

const Numero = {
  async generarNumeros(rifa_id, total_numeros, digitos) {
    const valores = [];
    for (let i = 1; i <= total_numeros; i++) {
      const numeroFormateado = String(i).padStart(digitos, '0');
      valores.push([rifa_id, numeroFormateado]);
    }
    await db.query('INSERT INTO numeros (rifa_id, numero) VALUES ?', [valores]);
  },

  async aumentarNumeros(rifa_id, totalActual, nuevoTotal, digitos) {
    const valoresNuevos = [];
    for (let i = totalActual + 1; i <= nuevoTotal; i++) {
      const numeroFormateado = String(i).padStart(digitos, '0');
      valoresNuevos.push([rifa_id, numeroFormateado]);
    }

    if (valoresNuevos.length > 0) {
      await db.query('INSERT INTO numeros (rifa_id, numero) VALUES ?', [valoresNuevos]);
    }
  },

  async contarDisponibles(rifa_id) {
    const [rows] = await db.query(
      "SELECT COUNT(*) AS disponibles FROM numeros WHERE rifa_id = ? AND estado = 'disponible'",
      [rifa_id]
    );
    return rows[0].disponibles;
  },

  async asignarAleatorios(rifa_id, cantidad, orden_id) {
    const [disponibles] = await db.query(
      `SELECT id FROM numeros WHERE rifa_id = ? AND estado = 'disponible' ORDER BY RAND() LIMIT ?`,
      [rifa_id, cantidad]
    );

    if (disponibles.length < cantidad) {
      throw new Error('No hay suficientes números disponibles');
    }

    const ids = disponibles.map(n => n.id);

    await db.query(
      `UPDATE numeros SET estado = 'reservado', orden_id = ? WHERE id IN (?)`,
      [orden_id, ids]
    );

    const [numerosAsignados] = await db.query(
      `SELECT numero FROM numeros WHERE id IN (?)`,
      [ids]
    );
    return numerosAsignados.map(n => n.numero);
  },

  async obtenerPorOrden(orden_id) {
    const [rows] = await db.query(
      `SELECT numero FROM numeros WHERE orden_id = ? ORDER BY numero`,
      [orden_id]
    );
    return rows.map(r => r.numero);
  },

  async buscarPorCorreo(rifa_id, correo) {
    const [rows] = await db.query(
      `SELECT n.numero, o.estado AS estado_orden
       FROM numeros n
       JOIN ordenes o ON n.orden_id = o.id
       JOIN compradores c ON o.comprador_id = c.id
       WHERE n.rifa_id = ? AND c.correo = ?
       ORDER BY n.numero`,
      [rifa_id, correo]
    );
    return rows;
  },

  async marcarVendidos(orden_id) {
    await db.query(
      `UPDATE numeros SET estado = 'vendido' WHERE orden_id = ?`,
      [orden_id]
    );
  },

  async liberar(orden_id) {
    await db.query(
      `UPDATE numeros SET estado = 'disponible', orden_id = NULL WHERE orden_id = ?`,
      [orden_id]
    );
  },

  async obtenerTodosPorRifa(rifa_id) {
    const [rows] = await db.query(
      `SELECT numero, estado, reservado_para FROM numeros WHERE rifa_id = ? ORDER BY numero`,
      [rifa_id]
    );
    return rows;
  },

  async asignarManual(rifa_id, numeros, orden_id, nombre) {
    await db.query(
      `UPDATE numeros SET estado = 'reservado', orden_id = ?, reservado_para = ? WHERE rifa_id = ? AND numero IN (?) AND estado != 'vendido'`,
      [orden_id, nombre || null, rifa_id, numeros]
    );
  },

  async liberarManual(rifa_id, numeros) {
    await db.query(
      `UPDATE numeros SET estado = 'disponible', orden_id = NULL, reservado_para = NULL WHERE rifa_id = ? AND numero IN (?) AND estado != 'vendido'`,
      [rifa_id, numeros]
    );
  }
};

module.exports = Numero;