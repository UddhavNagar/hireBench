const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.match(/^image\/(png|jpeg|jpg)$/)) {
    return cb(new Error("Only PNG and JPG images allowed"));
  }
  cb(null, true);
};

module.exports = multer({ storage, fileFilter });
