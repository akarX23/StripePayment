import React from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { BrowserRouter } from "react-router-dom";
import Routes from "./Routes";

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(
  "pk_test_51IXl70SCs7NRMvuhxmSWN6iVMSdiLfNewvY2P3mpcsRZsckvm7XCONVk8wVBaQAUhKMipwiI4i2qDJkevaErlhjw00ouvmuygC"
);

function App() {
  return (
    <BrowserRouter>
      <Elements stripe={stripePromise}>
        <Routes />
      </Elements>
    </BrowserRouter>
  );
}

export default App;
