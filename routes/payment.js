import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import 'dotenv/config';
import Payment from '../models/Payment.js';

const router = express.Router();

// Initialize Razorpay instance with environment variables
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET,
});

// ROUTE 1 : Create Order Api Using POST Method http://localhost:4000/api/payment/order
router.post('/order', (req, res) => {
    const { amount } = req.body;

    if (!amount) {
        return res.status(400).json({ message: "Amount is required" });
    }

    try {
        const options = {
            amount: Number(amount * 100), // Razorpay accepts amount in paise
            currency: "INR",
            receipt: crypto.randomBytes(10).toString("hex"),
        };

        razorpayInstance.orders.create(options, (error, order) => {
            if (error) {
                console.error("Order creation error:", error);
                return res.status(500).json({ message: "Something went wrong during order creation" });
            }
            res.status(200).json({ data: order });
            console.log("Order created:", order);
        });
    } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// ROUTE 2 : Verify Payment Using POST Method http://localhost:4000/api/payment/verify
router.post('/verify', async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        // Concatenate the order and payment IDs to create the sign
        const sign = razorpay_order_id + "|" + razorpay_payment_id;

        // Generate the expected signature with the provided secret
        const expectedSign = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET)
            .update(sign.toString())
            .digest("hex");

        // Verify if the signature matches
        const isAuthentic = expectedSign === razorpay_signature;

        if (isAuthentic) {
            const payment = new Payment({
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
            });

            // Save Payment 
            await payment.save();

            // Send success message
            res.json({
                message: "Payment successful",
            });
        } else {
            res.status(400).json({ message: "Payment verification failed" });
        }
    } catch (error) {
        console.error("Verification error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

export default router;
