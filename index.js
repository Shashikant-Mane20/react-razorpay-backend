import connectToMongo from "./database/db.js";
import express from "express";
import cors from "cors";
import payment from "./routes/payment.js";

connectToMongo();
const app = express();
const port = 4000

app.use(express.json());
app.use(cors());

app.get('/',(req,res) => {
    res.send('Hello World!')
})

app.use('/api/payment',payment)

app.listen(port,() => {
    console.log(`listening on port http://localhost:${port}`);
})