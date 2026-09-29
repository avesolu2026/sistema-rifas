const Rifa = require('../models/Rifa');
const Numero = require('../models/Numero');
const db = require('../config/db');
const Orden = require('../models/Orden');
const ExcelJS = require('exceljs');

const rifaController = {
  mostrarFormularioCrear(req, res) {
    res.render('admin/crear-rifa', { title: 'Crear nueva rifa', error: null });
  },

  async crearRifa(req, res) {
    try {
      const { titulo, subtitulo, detalle_corto, descripcion, total_numeros, precio_numero, fecha_sorteo, digitos_boleta, loteria, nota_importante } = req.body;
      const totalNum = parseInt(total_numeros);
      const digitos = parseInt(digitos_boleta);

      const maxPosible = Math.pow(10, digitos);
      if (totalNum > maxPosible) {
        return res.render('admin/crear-rifa', {
          title: 'Crear nueva rifa',
          error: `Con ${digitos} dígitos solo caben hasta ${maxPosible} números. Elige más dígitos o reduce el total.`
        });
      }

      let paquetesSeleccionados = req.body.paquetes || [];
      if (!Array.isArray(paquetesSeleccionados)) {
        paquetesSeleccionados = [paquetesSeleccionados];
      }
      const paquetesNums = paquetesSeleccionados.map(Number).sort((a, b) => a - b);

      const imagenes = req.files ? req.files.map(f => '/uploads/' + f.filename) : [];

      const rifaId = await Rifa.crear({
        titulo,
        subtitulo,
        detalle_corto,
        descripcion,
        premio_imagenes: imagenes,
        total_numeros: totalNum,
        precio_numero: parseFloat(precio_numero),
        fecha_sorteo,
        digitos_boleta: digitos,
        paquetes: paquetesNums,
        loteria,
        nota_importante
      });

      await Numero.generarNumeros(rifaId, totalNum, digitos);

      res.redirect('/admin/rifas');
    } catch (error) {
      console.error(error);
      res.status(500).send('Error al crear la rifa: ' + error.message);
    }
  },

  async listarRifas(req, res) {
    const rifas = await Rifa.obtenerTodas();

    const [[{ activas }]] = await db.query(
      `SELECT COUNT(*) AS activas FROM rifas WHERE estado = 'activa'`
    );
    const [[{ vendidos }]] = await db.query(
      `SELECT COUNT(*) AS vendidos FROM numeros WHERE estado IN ('vendido','reservado')`
    );
    const [[{ recaudado }]] = await db.query(
      `SELECT COALESCE(SUM(valor_total),0) AS recaudado FROM ordenes WHERE estado = 'aprobado'`
    );
    const [[{ pendientes }]] = await db.query(
      `SELECT COUNT(*) AS pendientes FROM ordenes WHERE estado = 'pendiente'`
    );

    res.render('admin/rifas', {
      title: 'Mis rifas',
      rifas,
      stats: { activas, vendidos, recaudado, pendientes }
    });
  },

  async mostrarFormularioEditar(req, res) {
    const rifa = await Rifa.obtenerPorId(req.params.id);
    if (!rifa) return res.status(404).send('Rifa no encontrada');
    res.render('admin/editar-rifa', { title: 'Editar rifa', rifa, error: null });
  },

  async actualizarRifa(req, res) {
    try {
      const { titulo, subtitulo, detalle_corto, descripcion, total_numeros, precio_numero, fecha_sorteo, loteria, nota_importante } = req.body;
      const nuevoTotal = parseInt(total_numeros);

      const rifaActual = await Rifa.obtenerPorId(req.params.id);
      if (!rifaActual) return res.status(404).send('Rifa no encontrada');

      const totalActual = rifaActual.total_numeros;
      const digitos = rifaActual.digitos_boleta || 4;

      const maxPosible = Math.pow(10, digitos);
      if (nuevoTotal > maxPosible) {
        return res.render('admin/editar-rifa', {
          title: 'Editar rifa',
          rifa: rifaActual,
          error: `Esta rifa usa ${digitos} dígitos, así que solo caben hasta ${maxPosible} números.`
        });
      }

      await Rifa.actualizar(req.params.id, {
        titulo,
        subtitulo,
        detalle_corto,
        descripcion,
        total_numeros: nuevoTotal,
        precio_numero: parseFloat(precio_numero),
        fecha_sorteo,
        loteria,
        nota_importante
      });

      if (nuevoTotal > totalActual) {
        await Numero.aumentarNumeros(req.params.id, totalActual, nuevoTotal, digitos);
      } else if (nuevoTotal < totalActual) {
        console.warn(`Se intentó reducir números de ${totalActual} a ${nuevoTotal} en rifa ${req.params.id} — no se eliminaron números existentes por seguridad.`);
      }

      if (req.files && req.files.length > 0) {
        const nuevasImagenes = req.files.map(f => '/uploads/' + f.filename);
        await Rifa.agregarImagenes(req.params.id, nuevasImagenes);
      }

      res.redirect('/admin/rifas');
    } catch (error) {
      console.error(error);
      res.status(500).send('Error al actualizar la rifa: ' + error.message);
    }
  },

  async eliminarRifa(req, res) {
    try {
      await Rifa.eliminar(req.params.id);
      res.redirect('/admin/rifas');
    } catch (error) {
      console.error(error);
      res.status(500).send('Error al eliminar la rifa: ' + error.message);
    }
  },

  async mostrarEstadisticas(req, res) {
    const rifa = await Rifa.obtenerPorId(req.params.id);
    if (!rifa) return res.status(404).send('Rifa no encontrada');

    const stats = await Rifa.obtenerEstadisticas(req.params.id);
    const ordenes = await Orden.obtenerPorRifa(req.params.id);

    for (const orden of ordenes) {
      orden.numeros = await Numero.obtenerPorOrden(orden.id);
    }

    res.render('admin/estadisticas-rifa', {
      title: 'Estadísticas — ' + rifa.titulo,
      rifa,
      stats,
      ordenes
    });
  },

  async exportarExcel(req, res) {
    try {
      const rifa = await Rifa.obtenerPorId(req.params.id);
      if (!rifa) return res.status(404).send('Rifa no encontrada');

      const todasOrdenes = await Orden.obtenerPorRifa(req.params.id);
      const aprobadas = todasOrdenes.filter(o => o.estado === 'aprobado');

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Ventas');

      sheet.columns = [
        { header: 'Comprador', key: 'nombre', width: 25 },
        { header: 'Teléfono', key: 'telefono', width: 15 },
        { header: 'Correo', key: 'correo', width: 25 },
        { header: 'Cantidad de números', key: 'cantidad_numeros', width: 18 },
        { header: 'Total pagado', key: 'valor_total', width: 15 },
        { header: 'Fecha', key: 'creado_en', width: 20 }
      ];

      sheet.getRow(1).font = { bold: true };

      aprobadas.forEach(o => {
        sheet.addRow({
          nombre: o.nombre,
          telefono: o.telefono,
          correo: o.correo,
          cantidad_numeros: o.cantidad_numeros,
          valor_total: Number(o.valor_total),
          creado_en: new Date(o.creado_en).toLocaleDateString('es-CO')
        });
      });

      const nombreArchivo = `ventas-${rifa.titulo.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error(error);
      res.status(500).send('Error al exportar: ' + error.message);
    }
  },

  async mostrarNumeros(req, res) {
    const rifa = await Rifa.obtenerPorId(req.params.id);
    if (!rifa) return res.status(404).send('Rifa no encontrada');

    const numeros = await Numero.obtenerTodosPorRifa(req.params.id);

    res.render('admin/numeros-rifa', {
      title: 'Números — ' + rifa.titulo,
      rifa,
      numeros
    });
  },

  async marcarNumeros(req, res) {
    try {
      const rifaId = req.params.id;
      const { estado, nombre_reserva } = req.body;
      let lista = req.body.numeros || [];
      if (!Array.isArray(lista)) lista = [lista];

      await Numero.marcarManual(rifaId, lista, estado, nombre_reserva);

      res.redirect('/admin/rifas/' + rifaId + '/numeros');
    } catch (error) {
      console.error(error);
      res.status(500).send('Error al marcar números: ' + error.message);
    }
  }
};

module.exports = rifaController;