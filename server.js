const express = require("express");
const app = express();
const cors = require("cors");

// Secret key
const stripe = require("stripe")(
  "sk_test_51IXl70SCs7NRMvuh1zSRiOwhuFmX0u3pkyJ4Xq8PLje0GTpYBzVg5UAvBVPQlXVgn49HCakmgYWZIJgODI9uM1Rx00nalNrJBO"
);

app.use(express.json());
app.use(cors());

//"prod_JApx6n9UP4dNkG"
//"prod_JApxLC4Ub0ey7y"
//"price_1IYUKiSCs7NRMvuhc1FQqNKS"
//"price_1IYUM0SCs7NRMvuhGaUubr16"

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

app.get("/create-customer", async (req, res) => {
  try {
    const customer = await stripe.customers.create({
      description: "My First Test Customer (created for API docs)",
      email: "ritikagrawal1292000@gmail.com",
    });

    return res.status(200).json({ customer: customer });
  } catch (e) {
    return res.status(401).json({ error: e.message });
  }
});

app.post("/create-subscription", async (req, res) => {
  // Attach the payment method to the customer
  try {
    await stripe.paymentMethods.attach(req.body.paymentMethodId, {
      customer: req.body.customerId,
    });
  } catch (error) {
    console.log(error);
    return res.status(402).json({ error: { message: error.message } });
  }

  // Change the default invoice settings on the customer to the new payment method
  await stripe.customers.update(req.body.customerId, {
    invoice_settings: {
      default_payment_method: req.body.paymentMethodId,
    },
  });

  // Create the subscription
  const subscription = await stripe.subscriptions.create({
    customer: req.body.customerId,
    items: [{ price: req.body.priceId }],
    expand: ["latest_invoice.payment_intent"],
  });

  res.status(200).send(subscription);
});

app.post("/cancel-subscription", async (req, res) => {
  // Delete the subscription
  const deletedSubscription = await stripe.subscriptions.del(
    req.body.subscriptionId
  );
  return res.status(200).json(deletedSubscription);
});

app.post("/retry-invoice", async (req, res) => {
  // Set the default payment method on the customer

  try {
    await stripe.paymentMethods.attach(req.body.paymentMethodId, {
      customer: req.body.customerId,
    });
    await stripe.customers.update(req.body.customerId, {
      invoice_settings: {
        default_payment_method: req.body.paymentMethodId,
      },
    });
  } catch (error) {
    // in case card_decline error
    return res
      .status("402")
      .send({ result: { error: { message: error.message } } });
  }

  const invoice = await stripe.invoices.retrieve(req.body.invoiceId, {
    expand: ["payment_intent"],
  });
  res.status(200).send(invoice);
});

app.get("/get-subscription/:subscriptionId", async (req, res) => {
  const subscription = await stripe.subscriptions.retrieve(
    req.params.subscriptionId
  );
  console.log(subscription);
  res.status(200).send(subscription);
});

app.listen(5000, () => console.log("Server running on port 5000"));
