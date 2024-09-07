const express = require("express");
const router = express.Router();
const { verifyToken } = require("../shared/auth");

router.get("/", (req, res) => {
  console.log("GET request to the homepage");
  res.send("GET request to the homepage");
});

router.get("/protected", verifyToken, (req, res) => {
  console.log("GET request to the protected route");
  res.send("GET request to the protected route");
});


module.exports = router;