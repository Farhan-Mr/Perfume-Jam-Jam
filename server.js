const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');

const app = express();

// Database Config
const dbConfig = {
    user: "system",
    password: "",
    connectString: "localhost:1521/xe"
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));


// DB Check
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


// Get Orders
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


// Place Order
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

        // 🔥 CLEAN PRICE (MOST IMPORTANT FIX)
        const cleanPrice = String(price).replace(/[^0-9.]/g, "");
        const priceNum = parseFloat(cleanPrice);

        console.log("CLEAN PRICE:", cleanPrice);
        console.log("PRICE NUMBER:", priceNum);

        if (isNaN(priceNum)) {
            return res.status(400).json({
                success: false,
                error: "Invalid price format"
            });
        }

        connection = await oracledb.getConnection(dbConfig);

        const result = await connection.execute(
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

        console.log("INSERT SUCCESS");

        res.json({
            success: true,
            message: "Order placed successfully"
        });

    } catch (err) {

        console.log("========== ERROR ==========");
        console.log(err);
        console.log("MESSAGE:", err.message);
        console.log("CODE:", err.code);

        res.status(500).json({
            success: false,
            error: err.message
        });

    } finally {

        if (connection) {
            await connection.close();
            console.log("DB CONNECTION CLOSED");
        }
    }
});


// Start server
app.listen(3000, () => {
    console.log("Server running on port 3000");
});