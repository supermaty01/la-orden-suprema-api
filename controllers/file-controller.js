const multer = require('multer');

exports.uploadFile = (fileName) => {
  return (req, res, next) => {
    try {
      const storage = multer.memoryStorage();
      const upload = multer({ storage });
      upload.single(fileName)(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          res.status(400).json({ message: err.message });
        } else if (err) {
          res.status(400).json({ message: err.message });
        } else {
          req.file = req.file || {};
          next();
        }
      });
    } catch (error) {
      res.status(400).json({ message: error.errors[0].message });
    }
  }
}