import type { Request, Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    console.error("❌ Razorpay Key ID or Key Secret is missing in environment variables!");
    return null;
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
};

// @desc    Create a new Razorpay order
// @route   POST /api/payments/order
export const createOrder = async (req: Request, res: Response) => {
  const { amount, currency = "INR" } = req.body;

  try {
    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      return res.status(500).json({ message: "Razorpay is not configured on the server." });
    }

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise (e.g., ₹100 = 10000 paise)
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).send("Order creation failed");
    }

    res.json(order);
  } catch (error: any) {
    console.error("Razorpay Order Error:", error);
    res.status(500).json({ message: "Error creating Razorpay order", error: error.message });
  }
};

// @desc    Verify Razorpay payment signature
// @route   POST /api/payments/verify
export const verifyPayment = async (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  try {
    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    
    // Create the expected signature
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generated_signature = hmac.digest("hex");

    if (generated_signature === razorpay_signature) {
      res.json({ message: "Payment verified successfully", success: true });
    } else {
      res.status(400).json({ message: "Invalid signature", success: false });
    }
  } catch (error: any) {
    console.error("Razorpay Verification Error:", error);
    res.status(500).json({ message: "Error verifying payment", error: error.message });
  }
};
