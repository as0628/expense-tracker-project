const db = require("../config/db.js"); // db.promise() already exported
const { createOrder, getPaymentStatus } = require("../services/cashfreeService.js");

// ✅ Create payment order
const createPaymentOrder = async (req, res) => {
  try {
    const userId = req.user.id; 
    const orderId = "order_" + Date.now();//generate a unique order id by combining "order_" with the current timestamp
    const amount = 499; // Premium price
    // Create order via Cashfree
    const order = await createOrder(orderId, amount, userId, "9999999999");
    if (!order || !order.payment_session_id) {
      return res.status(500).json({ success: false, error: "Failed to get payment session" });
    }
    // Insert order into DB
    await db.query(
      "INSERT INTO orders (orderId, amount, status, userId) VALUES (?, ?, ?, ?)",
      [orderId, amount, "PENDING", userId]
    );
    return res.json({
      success: true,
      message: "Order created successfully",
      payment_session_id: order.payment_session_id,
      orderId,
    });
  } catch (err) {
    console.error("Error creating order (controller):", err);
    return res.status(500).json({ success: false, error: "Error creating order" });
  }
};

//  Verify payment
const verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;
    const payment = await getPaymentStatus(orderId);
    if (payment[0]?.payment_status === "SUCCESS") {
      // Update order status and user premium
      await db.query("UPDATE orders SET status = 'SUCCESS' WHERE orderId = ?", [orderId]);
      await db.query("UPDATE signup SET isPremium = 1 WHERE id = ?", [userId]);

      return res.json({
        success: true,
        message: "Payment successful, premium activated",
      });
    } else {
      // Payment failed or pending
      await db.query("UPDATE orders SET status = 'FAILED' WHERE orderId = ?", [orderId]);
      return res.json({ success: false, message: "Payment failed or pending" });
    }
  } catch (err) {
    console.error("Error verifying payment:", err);
    return res.status(500).json({ success: false, error: "Error verifying payment" });
  }
};

//  Get payment status by order ID
const getPaymentStatusById = async (req, res) => {
  const { orderId } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM orders WHERE orderId = ?", [orderId]);
    if (rows.length === 0) {
      return res.status(404).send("Order not found");
    }

    res.send(`
      <h1>Payment Status</h1>
      <p>Order ID: ${orderId}</p>
      <p>Status: ${rows[0].status}</p>
    `);
  } catch (err) {
    console.error("Error fetching order status:", err);
    res.status(500).send("Error fetching order status");
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getPaymentStatusById,
};
