// const express = require("express");
// const router = express.Router();
// const { 
//   forgotPassword, 
//   resetPasswordForm, 
//   resetPasswordSubmit 
// } = require("../controllers/passwordController");

// router.post("/forgotpassword", forgotPassword);
// router.get("/resetpassword/:id", resetPasswordForm);
// router.post("/resetpassword/:id", resetPasswordSubmit);

// module.exports = router;
const express = require("express");
const router = express.Router();

const { resetPasswordForm, resetPasswordSubmit } = require("../controllers/passwordController");

// Route to show reset password page
router.get("/resetpassword/:id", resetPasswordForm);

// Route to handle reset password submission
router.post("/resetpassword/:id", resetPasswordSubmit);

module.exports = router;

