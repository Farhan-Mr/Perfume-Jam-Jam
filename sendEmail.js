const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOrderEmail = async (customerEmail, order) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: customerEmail,
    subject: `Order Confirmed - #${order._id}`,
    html: `
      <h2>Your Order has been Confirmed ✅</h2>

      <p><strong>Order ID:</strong> ${order._id}</p>
      <p><strong>Total Price:</strong> ₹${order.totalPrice}</p>
      <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
      <p><strong>Delivery Date:</strong> ${order.deliveryDate}</p>

      <h3>Thank you for shopping with us ❤️</h3>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendOrderEmail;