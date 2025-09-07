const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS  
  }
});

exports.sendPaymentSuccessEmail = async (to, orderId, amount) => {
  try {
    await transporter.sendMail({
      from: `"Expense Tracker" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Payment Successful - Premium Activated 🎉",
      html: `
        <h2>Payment Successful</h2>
        <p>Thank you for your payment.</p>
        <p><b>Order ID:</b> ${orderId}</p>
        <p><b>Amount:</b> ₹${amount}</p>
        <p>Your Premium Membership is now active. </p>
      `
    });
    console.log(" Payment success email sent to", to);
  } catch (err) {
    console.error(" Error sending email:", err);
  }
};
