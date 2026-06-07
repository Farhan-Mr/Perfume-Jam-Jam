const express = require("express");
const oracledb = require("oracledb");

const app = express();

const dbConfig = {
  user: "SYSTEM",
  password: "ONELOVE",
  connectString: "localhost/XEPDB1"
};

app.get("/", async (req, res) => {
  let connection;

  try {
    connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `SELECT 'Oracle Connected Successfully' AS MSG FROM dual`
    );

    res.send(result.rows[0][0]);

  } catch (err) {
    console.error(err);
    res.send("Database Connection Failed");
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

app.listen(3000, () => {
  console.log("Server Running On Port 3000");
});