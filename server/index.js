const { connectToMongo } = require("./src/models/connectToMongo");
const { feedUsersToDatabase } = require("./src/insertUsers");

const express = require("express"),
    app = express();
// require("./DL/test_data").go()
require("dotenv").config() // 
app.use(require('cors')());
process.env.MONGO_URI;
app.use(express.json())

app.use("/user", require('./src/routes/userRouter'))

connectToMongo()
// feedUsersToDatabase();
app.listen(5050, () => console.log("The server is runnig on port 5050..."));
