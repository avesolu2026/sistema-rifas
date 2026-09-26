const crypto = require('crypto');

function generarFirmaIntegridad({ referencia, montoEnCentavos, moneda = 'COP' }) {
  const cadena = `${referencia}${montoEnCentavos}${moneda}${process.env.WOMPI_INTEGRITY_SECRET}`;
  return crypto.createHash('sha256').update(cadena).digest('hex');
}

module.exports = { generarFirmaIntegridad };