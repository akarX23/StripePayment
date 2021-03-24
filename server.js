const express = require("express");
const app = express();
const cors = require("cors");
const stripe = require("stripe")(
  "sk_test_51IXl70SCs7NRMvuh1zSRiOwhuFmX0u3pkyJ4Xq8PLje0GTpYBzVg5UAvBVPQlXVgn49HCakmgYWZIJgODI9uM1Rx00nalNrJBO"
);

app.use(cors());

// const paymentIntent = await stripe.paymentIntents.create({
//   amount: 1099,
//   currency: "inr",
//   // Verify your integration in this guide by including this parameter
//   metadata: { integration_check: "accept_a_payment" },
// });

app.get("/secret", async (req, res) => {
  const intent = await stripe.paymentIntents.create({
    amount: 1099,
    currency: "inr",
    // Verify your integration in this guide by including this parameter
    metadata: { integration_check: "accept_a_payment" },
  });
  return res.status(200).json({ client_secret: intent.client_secret });
});

app.listen(5000, () => console.log("Server running on port 5000"));
