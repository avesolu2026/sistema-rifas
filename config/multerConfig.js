const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: (req, file, cb) => {
    const nombreUnico = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, nombreUnico);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB máximo (los videos pesan más que las imágenes)
  fileFilter: (req, file, cb) => {
    const tiposPermitidos = /jpeg|jpg|png|webp|mp4|mov|avi|webm/;
    const extValida = tiposPermitidos.test(path.extname(file.originalname).toLowerCase());
    if (extValida) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpg, png, webp) o videos (mp4, mov, avi, webm)'));
    }
  }
});

module.exports = upload;