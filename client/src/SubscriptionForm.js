import React from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import axios from "axios";

import CardSection from "./CardSection";

const SubscriptionForm = () => {
  const stripe = useStripe();
  const elements = useElements();

  async function onSubscriptionComplete(result) {
    const subscription = await axios
      .get(`http://localhost:5000/get-subscription/${result.subscription.id}`)
      .then((result) => result.data);
    console.log(subscription);
    // Payment was successful.
    if (subscription.status === "active") {
      // Change your UI to show a success message to your customer.
      // Call your backend to grant access to your service based on
      // `result.subscription.items.data[0].price.product` the customer subscribed to
      alert("Success");
    } else alert("unsuccessfull");
  }

  function handlePaymentThatRequiresCustomerAction(data) {
    console.log(data);
    const { subscription, invoice, priceId, paymentMethodId, isRetry } = data;

    if (subscription && subscription.status === "active") {
      // Subscription is active, no customer actions required.
      return { subscription, priceId, paymentMethodId };
    }

    // If it's a first payment attempt, the payment intent is on the subscription latest invoice.
    // If it's a retry, the payment intent will be on the invoice itself.
    let paymentIntent = invoice
      ? invoice.payment_intent
      : subscription.latest_invoice.payment_intent;

    if (
      paymentIntent.status === "requires_action" ||
      (isRetry === true && paymentIntent.status === "requires_payment_method")
    ) {
      return stripe
        .confirmCardPayment(paymentIntent.client_secret, {
          payment_method: paymentMethodId,
        })
        .then((result) => {
          if (result.error) {
            // Start code flow to handle updating the payment details.
            // Display error message in your UI.
            // The card was declined (i.e. insufficient funds, card has expired, etc).
            throw result.error;
          } else {
            console.log(result);
            if (result.paymentIntent.status === "succeeded") {
              // Show a success message to your customer.
              return {
                priceId,
                subscription,
                invoice,
                paymentMethodId,
              };
            }
          }
        })
        .catch((error) => {
          throw error;
        });
    } else {
      // No customer action needed.
      return { subscription, priceId, paymentMethodId };
    }
  }

  const retryInvoiceWithNewPaymentMethod = async ({
    customerId,
    paymentMethodId,
    invoiceId,
    priceId,
  }) => {
    return await axios
      .post("http://localhost:5000/retry-invoice", {
        customerId: customerId,
        paymentMethodId: paymentMethodId,
        invoiceId: invoiceId,
      })
      .then((response) => {
        console.log(response);
        return response.data;
      })
      // If the card is declined, display an error to the user.
      .then((result) => {
        if (result.error) {
          // The card had an error when trying to attach it to a customer.
          throw result;
        }
        return result;
      })
      // Normalize the result to contain the object returned by Stripe.
      // Add the additional details we need.
      .then((result) => {
        console.log(result);
        return {
          // Use the Stripe 'object' property on the
          // returned result to understand what object is returned.
          invoice: result,
          paymentMethodId: paymentMethodId,
          priceId: priceId,
          isRetry: true,
        };
      })
      // Some payment methods require a customer to be on session
      // to complete the payment process. Check the status of the
      // payment intent to handle these actions.
      .then(handlePaymentThatRequiresCustomerAction)
      // No more actions required. Provision your service for the user.
      .then(onSubscriptionComplete)
      .catch((error) => {
        // An error has happened. Display the failure to the user here.
        // We utilize the HTML element we created.
        throw error;
      });
  };

  function handleRequiresPaymentMethod(data) {
    console.log(data);
    const { subscription, paymentMethodId, priceId } = data;

    if (subscription.status === "active") {
      // subscription is active, no customer actions required.
      return { subscription, priceId, paymentMethodId };
    } else if (
      subscription.latest_invoice.payment_intent.status ===
      "requires_payment_method"
    ) {
      // Using localStorage to manage the state of the retry here,
      // feel free to replace with what you prefer.
      // Store the latest invoice ID and status.
      return retryInvoiceWithNewPaymentMethod({
        customerId: subscription.customer,
        invoiceId: subscription.latest_invoice.id,
        paymentMethodId: paymentMethodId,
        priceId: priceId,
      });
    } else {
      return { subscription, priceId, paymentMethodId };
    }
  }

  const cancelSubscription = async (subscriptionId) => {
    const response = await axios
      .post("http://localhost:5000/cancel-subscription", {
        subscriptionId: subscriptionId,
      })
      .then((response) => response.data);
    alert("Subscription cancelled");
    return response;
  };

  const createCustomer = async () => {
    const response = await axios
      .get("http://localhost:5000/create-customer")
      .then((response) => response.data);
    console.log(response);
    const { customer } = response;
    return customer;
  };

  const createSubscription = async ({
    customerId,
    paymentMethodId,
    priceId,
  }) => {
    const response = await axios
      .post("http://localhost:5000/create-subscription", {
        customerId,
        paymentMethodId,
        priceId,
      })
      .then((response) => {
        console.log(response);
        return response.data;
      })
      .then((result) => {
        if (result.error) {
          // The card had an error when trying to attach it to a customer.
          throw result;
        }
        return result;
      })
      // Normalize the result to contain the object returned by Stripe.
      // Add the additional details we need.
      .then((result) => {
        console.log(result);
        return {
          paymentMethodId: paymentMethodId,
          priceId: priceId,
          subscription: result,
        };
      })
      // Some payment methods require a customer to be on session
      // to complete the payment process. Check the status of the
      // payment intent to handle these actions.
      .then(handlePaymentThatRequiresCustomerAction)
      // If attaching this card to a Customer object succeeds,
      // but attempts to charge the customer fail, you
      // get a requires_payment_method error.
      .then(handleRequiresPaymentMethod)
      // No more actions required. Provision your service for the user.
      .then(onSubscriptionComplete)
      .catch((error) => {
        // An error has happened. Display the failure to the user here.
        // We utilize the HTML element we created.
        console.log(error);
        alert(error);
        return;
      });

    return response;
  };

  const handleSubmit = async (priceId) => {
    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    const customer = await createCustomer();
    const card = elements.getElement(CardElement);

    stripe
      .createPaymentMethod({
        type: "card",
        card,
        billing_details: {
          name: "Ritik Agrawal",
        },
      })
      .then((result) => {
        if (result.error) {
          console.log(result);
          return;
        } else {
          createSubscription({
            customerId: customer.id,
            paymentMethodId: result.paymentMethod.id,
            priceId,
          });
        }
      });
  };

  return (
    <div>
      <CardSection />
      <button
        disabled={!stripe}
        onClick={() => handleSubmit("price_1ItG5ISCs7NRMvuhrhCH0dbY")} // Price ID
      >
        20 $ subscription
      </button>
      <button
        disabled={!stripe}
        onClick={() => handleSubmit("price_1IYUM0SCs7NRMvuhGaUubr16")}
      >
        10 $ subscription
      </button>
      <button
        disabled={!stripe}
        onClick={() => cancelSubscription("sub_JWInZI6UcrHgSm")}
      >
        Cancel 20 $ subscription
      </button>
      <button disabled={!stripe} onClick={() => cancelSubscription("")}>
        Cancel 10 $ subscription
      </button>
    </div>
  );
};

export default SubscriptionForm;
