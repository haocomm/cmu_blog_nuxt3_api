const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const express = require('express');
const multer = require('multer');
const { run } = require('../config/worker');
const db = require('../models');
const Image = db.Image;

const passport = require('../config/passport');
const multerFunction = require('../config/multer');

const router = express.Router();

const onUpload = (req, res, next) => {
  const upload = multerFunction.single('upload');
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return send({
        error: {
          message: err.message,
        },
      });
    } else if (err) {
      return res.send({
        error: {
          message: err.message,
        },
      });
    }
    next();
  });
};
const checkRole = (req, res, next) => {
  if (['admin', 'specialist'].includes(req.user.role)) {
    next();
  } else {
    return res.status(403).json({
      message: 'Forbidden.',
    });
  }
};

router.post('/upload-img/', passport.authenticate('bearer', { session: false }), checkRole, onUpload, async (req, res, next) => {
  if (req.file) {
    const { filename } = req.file;
    const newFilename = filename.replace(/\.[^/.]+$/, '');
    const newPath = path.join(req.file.destination, `${newFilename}.webp`);
    await sharp(req.file.path).webp().toFile(newPath);
    fs.unlinkSync(req.file.path);
    await Image.create({
      filename: `${newFilename}.webp`,
      active: true,
    });
    return res.send({
      url: `${process.env.API_URL}${newPath.replace('static', '')}`,
    });
  }
  return res.status(400).json({
    message: 'Bad request',
  });
});

router.get('/remove-image', async (req, res, next) => {
  try {
    await run();
    return res.status(200).json({
      message: 'success',
    });
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
