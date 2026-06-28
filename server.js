const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');

const app = express();

// Database Config
const dbConfig = {
user: "system",
password: "onelove",
connectString: "localhost:1521/xe"
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// =========================
// DATABASE CHECK
// =========================
app.get('/api/check-db', async (req, res) => {


let connection;

try {

    connection = await oracledb.getConnection(dbConfig);

    res.send("Database connected successfully!");

} catch (err) {

    res.status(500).send(err.message);

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

    connection = await oracledb.getConnection(dbConfig);

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
            email,
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

    res.status(500).json({
        success: false,
        error: err.message
    });

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

    connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
        `
        SELECT EMAIL, PASSWORD, ROLE
        FROM USERS
        WHERE EMAIL = :email
        `,
        { email }
    );

    if (result.rows.length === 0) {

        return res.status(401).json({
            success: false,
            message: "User not found"
        });
    }

    const user = result.rows[0];

    if (user[1] !== password) {

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

    res.status(500).json({
        success: false,
        error: err.message
    });

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

    connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
        "SELECT * FROM ORDERS"
    );

    res.json(result.rows);

} catch (err) {

    res.status(500).json({
        error: err.message
    });

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

    connection = await oracledb.getConnection(dbConfig);

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

    res.json({
        success: true,
        message: "Order placed successfully"
    });

} catch (err) {

    res.status(500).json({
        success: false,
        error: err.message
    });

} finally {

    if (connection) {
        await connection.close();
    }
}


});

// =========================
// START SERVER
// =========================
app.listen(3000, () => {
console.log("Server running on port 3000");
});