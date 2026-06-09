const oracledb = require('oracledb');

async function testConnection() {
    try 
    {
        // Oracle DB Connection Config
        const connection = await oracledb.getConnection({
            user: "system",          // Aapka Oracle username
            password: "onelove",      // Aapka Oracle password
            connectString: "localhost:1521/xe" // Aapka connection string
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