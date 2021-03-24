import React from "react";
import { Switch, Route } from "react-router-dom";

//COMPONENTS
import CheckoutForm from "./CheckoutForm";
import SubscriptionForm from "./SubscriptionForm";

const Routes = () => {
  return (
    <Switch>
      <Route exact path="/payment" component={CheckoutForm} />
      <Route path="/subscription" component={SubscriptionForm} />
    </Switch>
  );
};

export default Routes;
