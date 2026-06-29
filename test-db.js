const oracledb = require('oracledb');

async function testConnection() {
    try 
    {
        // Oracle DB Connection Config
        const connection = await oracledb.getConnection({
            user: process.env.ORACLE_USER || "system",          
            password: process.env.ORACLE_PASSWORD || "onelove",     
            connectString: process.env.ORACLE_CONNECT_STRING || "localhost:1521/xe" // connection string
        });

        console.log("Success! Oracle Database se connect ho gaya.");
        await connection.close();
    }

    catch (err) 
    {
        console.error("Error connection failed: ", err);
    }
}

testConnection();