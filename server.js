const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const nodemailer = require('nodemailer');
const axios = require("axios");


const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    logger: true,
    debug: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendEmailNotification(userEmail, subject, message) {
    return await transporter.sendMail({
        from: `Perfume Jam Jam <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject,
        replyTo: process.env.EMAIL_USER,
        text: message,
        envelope: {
            from: process.env.EMAIL_USER,
            to: userEmail
        },
        html: message.replace(/\n/g, '<br>'),
        headers: {
            'X-Priority': '1',
            'Importance': 'high'
        }
    });
}

async function sendWhatsAppMessage(order) {
    try {

        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 5);

        const formattedDate = deliveryDate.toLocaleDateString("en-IN");

        const message = `🛍️ *Perfume Jam Jam*

✅ Order Confirmed

👤 Customer : ${order.name}

🆔 Order ID : PJJ-${Date.now()}

📦 Product :
${order.productName}

💰 Price :
₹${order.price}

💳 Payment :
Cash on Delivery

🚚 Expected Delivery :
${formattedDate}

📍 Address :
${order.address}

Thank you for shopping with Perfume Jam Jam ❤️`;

        await axios.post(
            `https://graph.facebook.com/v22.0/${process.env.PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to: `91${order.phone.replace(/\D/g, "")}`,
                type: "text",
                text: {
                    body: message
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("✅ WhatsApp Message Sent");

    } catch (err) {

        console.error(
            "❌ WhatsApp Error:",
            err.response?.data || err.message
        );

    }
}

const app = express();

const explicitAllowedOrigins = new Set([
    'https://perfume-aa.vercel.app',
    ...(process.env.FRONTEND_ORIGIN ? process.env.FRONTEND_ORIGIN.split(',') : [])
        .map(origin => origin.trim())
        .filter(Boolean)
]);

function isAllowedOrigin(origin) {
    if (!origin) {
        return true;
    }

    if (
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('https://localhost:') ||
        origin.startsWith('https://127.0.0.1:')
    ) {
        return true;
    }

    if (explicitAllowedOrigins.has(origin)) {
        return true;
    }

    return /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);
}

app.use(cors({
    origin(origin, callback) {
        if (isAllowedOrigin(origin)) {
            return callback(null, true);
        }

        return callback(null, false);
    },
    credentials: true
}));

// Database Config
const isProduction = process.env.NODE_ENV === 'production';
const oracleEnvMissing = !process.env.ORACLE_USER || !process.env.ORACLE_PASSWORD || !process.env.ORACLE_CONNECT_STRING;

const dbConfig = {
    user: process.env.ORACLE_USER || "system",
    password: process.env.ORACLE_PASSWORD || "chal nikl ",
    connectString: process.env.ORACLE_CONNECT_STRING || (isProduction ? "" : "localhost:1521/xe")
};

if (oracleEnvMissing) {
    console.warn('Oracle env vars are missing. Set ORACLE_USER, ORACLE_PASSWORD, and ORACLE_CONNECT_STRING for a stable login flow.');
}

function sendDbUnavailable(res, operation, err) {
    console.error(`Database ${operation} failed:`, err.message);

    return res.status(503).json({
        success: false,
        message: 'Database temporarily unavailable. Please try again later.',
        error: err.message
    });
}

async function getConnectionWithTimeout(timeoutMs = 5000) {
    let timer;

    if (isProduction && oracleEnvMissing) {
        throw new Error('Oracle env vars are missing in production');
    }

    const connectionPromise = oracledb.getConnection(dbConfig);
    const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => {
            reject(new Error(`Database connection timed out after ${timeoutMs}ms`));
        }, timeoutMs);
    });

    try {
        return await Promise.race([connectionPromise, timeoutPromise]);
    } finally {
        if (timer) {
            clearTimeout(timer);
        }
    }
}

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// =====================
// DATABASE CHECK
// =====================
app.get('/api/check-db', async (req, res) => {


let connection;

try {

    connection = await getConnectionWithTimeout();

    res.send("Database connected successfully!");

} catch (err) {

    res.status(503).send(err.message);

} finally {

    if (connection) {
        await connection.close();
    }
}


});

// =========================
// REGISTER USER
// =========================
app.post('/api/register', async (req, res) => {


let connection;

try {

    const {
        full_name,
        email,
        password
    } = req.body;

    const normalizedEmail = String(email || "").trim().toLowerCase();

    connection = await getConnectionWithTimeout();

    await connection.execute(
        `
        INSERT INTO USERS
        (
            FULL_NAME,
            EMAIL,
            PASSWORD,
            ROLE
        )
        VALUES
        (
            :full_name,
            :email,
            :password,
            'user'
        )
        `,
        {
            full_name,
            email: normalizedEmail,
            password
        },
        {
            autoCommit: true
        }
    );

    res.json({
        success: true,
        message: "Registration successful"
    });

} catch (err) {

    return sendDbUnavailable(res, 'registration', err);

} finally {

    if (connection) {
        await connection.close();
    }
}


});

// =========================
// LOGIN USER
// =========================
app.post('/api/login', async (req, res) => {


let connection;

try {

    const {
        email,
        password
    } = req.body;

    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPassword = String(password || "");

    connection = await getConnectionWithTimeout();

    const result = await connection.execute(
        `
        SELECT EMAIL, PASSWORD, ROLE
        FROM USERS
        WHERE EMAIL = :email
        `,
        { email: normalizedEmail }
    );

    if (result.rows.length === 0) {

        return res.status(401).json({
            success: false,
            message: "User not found"
        });
    }

    const user = result.rows[0];

    if (String(user[1] ?? "") !== normalizedPassword) {

        return res.status(401).json({
            success: false,
            message: "Wrong password"
        });
    }

    res.json({
        success: true,
        role: user[2]
    });

} catch (err) {

    return sendDbUnavailable(res, 'login', err);

} finally {

    if (connection) {
        await connection.close();
    }
}


});

// =========================
// GET ORDERS
// =========================
app.get('/orders', async (req, res) => {


let connection;

try {

    connection = await getConnectionWithTimeout();

    const result = await connection.execute(
        "SELECT * FROM ORDERS"
    );

    res.json(result.rows);

} catch (err) {

    return sendDbUnavailable(res, 'orders fetch', err);

} finally {

    if (connection) {
        await connection.close();
    }
}


});

// =========================
// PLACE ORDER
// =========================
app.post('/place-order', async (req, res) => {


console.log("================================");
console.log("POST /place-order HIT");
console.log("BODY:", req.body);
console.log("================================");

let connection;

try {

    const {
        name,
        email,
        phone,
        address,
        productName,
        price
    } = req.body;

    const cleanPrice = String(price).replace(/[^0-9.]/g, "");
    const priceNum = parseFloat(cleanPrice);

    if (isNaN(priceNum)) {

        return res.status(400).json({
            success: false,
            error: "Invalid price format"
        });
    }

    connection = await getConnectionWithTimeout();

    await connection.execute(
        `
        INSERT INTO ORDERS
        (
            CUSTOMER_NAME,
            EMAIL,
            PHONE,
            ADDRESS,
            PRODUCT_NAME,
            PRICE,
            STATUS
        )
        VALUES
        (
            :name,
            :email,
            :phone,
            :address,
            :productName,
            :price,
            'PENDING'
        )
        `,
        {
            name,
            email,
            phone,
            address,
            productName,
            price: priceNum
        },
        {
            autoCommit: true
        }
    );

    // =========================
    // Send Order Confirmation Email
    // =========================
    console.log('Sending confirmation email to:', email);

    const mailInfo = sendEmailNotification(
        email,
        "Your Order is Confirmed ✅",
        `Hello ${name},
        Thank you for shopping with Perfume Jam Jam.
        Your order has been successfully placed.

        Product : ${productName}
        Price : ₹${priceNum}
        Delivery Address:
        ${address}

        We will contact you soon regarding delivery.

        Thank you ❤️
        Perfume Jam Jam`
    );

    void Promise.allSettled([
        mailInfo.then((info) => {
            console.log('Email sent:', info.messageId, info.response);
            console.log('Order confirmation email completed for:', email);
        }),
        sendWhatsAppMessage({
            name,
            phone,
            productName,
            price: priceNum,
            address
        })
    ]).then((results) => {
        const failedTasks = results.filter((result) => result.status === 'rejected');

        if (failedTasks.length > 0) {
            console.warn('Order notification tasks had failures:', failedTasks.length);
        }
    });



    res.json({
        success: true,
        message: "Order placed successfully",
        emailSent: true
    });

} catch (err) {

    return sendDbUnavailable(res, 'order placement', err);

} finally {

    if (connection) {
        await connection.close();
    }
}


});

// =========================
// START SERVER
// =========================
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});