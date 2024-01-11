import { ApiStack } from "./../lib/api-stack";
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DatabaseStack } from "../lib/database-stack";
import { ComputeStack } from "../lib/compute-stack";
import { AuthStack } from "../lib/auth-stack";
import { EventBridgeStack } from "../lib/eventbus-stack";
import { SESStack } from "../lib/ses-stack";

const app = new cdk.App();
const databaseStack = new DatabaseStack(app, "DataBaseStack");
const computeStack = new ComputeStack(app, "ComputeStack", {
  usersTable: databaseStack.usersTable,
  flightTable: databaseStack.flightsTable,
  seatsTable: databaseStack.seatsTable,
});
const authStack = new AuthStack(app, "AuthStack", {
  addUserPostConfirmation: computeStack.addUserToTableFunc,
});
const apiStack = new ApiStack(app, "APIStack", {
  bookingLambdaIntegration: computeStack.bookingLambdaInteGration,
  userPool: authStack.userPool,
});
const eventStack = new EventBridgeStack(app, "EventBridgeStack", {
  syncFlights: computeStack.syncFlightRuleFunc,
  registerBooking: computeStack.resgisterBookingFunc,
  emailReceipt: computeStack.sendEmailFunc,
});
const sesStack = new SESStack(app, "SESStack");
