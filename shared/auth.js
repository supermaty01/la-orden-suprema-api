const jwt = require("jsonwebtoken");
const { UserRole } = require("./constants");

exports.verifyToken = (req, res, next) => {
  const header = req.header("Authorization") || "";
  const token = header.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Authorization token es requerido." });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    req.role = payload.role;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Authorization token enviado no es válido." });
  }
}

exports.isAdmin = (req, res, next) => {
  this.verifyToken(req, res, () => {
    if (req.role === UserRole.ADMIN) {
      next();
    } else {
      return res.status(403).json({ message: "No cuenta con los permisos requeridos para acceder a esta ruta. Rol ADMIN es requerido." });
    }
  });
}

exports.isAssassin = (req, res, next) => {
  this.verifyToken(req, res, () => {
    if (req.role === UserRole.ASSASSIN) {
      next();
    } else {
      return res.status(403).json({ message: "No cuenta con los permisos requeridos para acceder a esta ruta. Rol ASSASSIN es requerido." });
    }
  });
}

exports.isAuthorized = (req, res, next) => {
  this.verifyToken(req, res, () => {
    if (req.role === UserRole.ADMIN || req.role === UserRole.ASSASSIN) {
      next();
    } else {
      return res.status(403).json({ message: "No cuenta con los permisos requeridos para acceder a esta ruta." });
    }
  });
}
