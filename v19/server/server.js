require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "Elishah Rides V9", paymentProvider: process.env.PAYMENT_PROVIDER || "none" });
});

app.post("/api/payment/create", (req, res) => {
  // V9 secure integration point.
  // Implement the selected gateway's official server-side SDK/API here.
  // Never accept or expose merchant secrets in the browser.
  const { bookingRef, amount, currency = "USD" } = req.body || {};
  if (!bookingRef || !amount) return res.status(400).json({ error: "bookingRef and amount are required" });

  if ((process.env.PAYMENT_PROVIDER || "none") === "none") {
    return res.status(501).json({
      error: "Payment provider is not configured yet",
      bookingRef, amount, currency
    });
  }

  return res.status(501).json({
    error: "Gateway adapter placeholder: configure the selected Sri Lankan gateway using its official merchant documentation.",
    bookingRef, amount, currency
  });
});

app.post("/api/payment/webhook", (req, res) => {
  // IMPORTANT: verify the gateway signature/hash before updating any booking.
  // Then update payment_status/payment_reference in Supabase server-side.
  res.json({ received: true, verified: false, message: "Webhook verification adapter is ready for gateway-specific implementation." });
});

app.post("/api/notifications/booking", (req, res) => {
  // Email/WhatsApp provider should be called from this server.
  // Do not place SMTP/API secrets in frontend JavaScript.
  const { bookingRef } = req.body || {};
  if (!bookingRef) return res.status(400).json({ error: "bookingRef is required" });
  res.status(501).json({ error: "Notification provider not configured yet", bookingRef });
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Elishah Rides V9 server running on port ${process.env.PORT || 3000}`);
});
