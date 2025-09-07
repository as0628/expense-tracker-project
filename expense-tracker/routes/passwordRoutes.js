const express = require("express");
const router = express.Router();
const { 
  forgotPassword, 
  resetPasswordForm, 
  resetPasswordSubmit 
} = require("../controllers/passwordController");

router.post("/forgotpassword", forgotPassword);
router.get("/resetpassword/:id", resetPasswordForm);
router.post("/resetpassword/:id", resetPasswordSubmit);

module.exports = router;
