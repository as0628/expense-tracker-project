const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const auth = require("../middleware/auth");


router.post("/order", auth, orderController.createPaymentOrder);
router.post("/status", auth, orderController.verifyPayment);
router.get("/payment-status/:orderId", orderController.getPaymentStatusById);

module.exports = router;
