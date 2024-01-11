import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import path = require("path");
import * as iam from "aws-cdk-lib/aws-iam";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
interface computeStackProps extends cdk.StackProps {
  usersTable: Table;
  seatsTable: Table;
  flightTable: Table;
}

export class ComputeStack extends cdk.Stack {
  readonly addUserToTableFunc: NodejsFunction;
  readonly bookingLambdaInteGration: LambdaIntegration;
  readonly resgisterBookingFunc: NodejsFunction;
  readonly sendEmailFunc: NodejsFunction;
  readonly syncFlightRuleFunc: NodejsFunction;

  constructor(scope: Construct, id: string, props: computeStackProps) {
    super(scope, id, props);
    this.addUserToTableFunc = this.addUserToUsersTable(props);
    this.bookingLambdaInteGration = this.bookSeats(props);
    this.resgisterBookingFunc = this.registerBooking(props);
    this.syncFlightRuleFunc = this.syncFLights(props);
  }

  addUserToUsersTable(props: computeStackProps) {
    const func = new NodejsFunction(this, "adduserFunc", {
      functionName: "addUserFunc",
      runtime: Runtime.NODEJS_18_X,
      handler: "handler",
      entry: path.join(
        __dirname,
        "../functions/AddUserPostConfirmation/index.ts"
      ),
    });
    func.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["dynamodb:PutItem"],
        resources: [props.usersTable.tableArn as string],
      })
    );
    return func;
  }
  bookSeats(props: computeStackProps): LambdaIntegration {
    const func = new NodejsFunction(this, "booking", {
      functionName: "Booking",
      runtime: Runtime.NODEJS_18_X,
      handler: "handler",
      entry: path.join(__dirname, `../functions/Booking/index.ts`),
    });
    func.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["dynamodb:*", "events:PutEvents"],
        resources: [
          props.seatsTable.tableArn,
          "arn:aws:events:ap-south-1:730335186175:event-bus/FlightBookingEventus",
        ],
      })
    );
    return new LambdaIntegration(func);
  }
  registerBooking(props: computeStackProps): NodejsFunction {
    const func = new NodejsFunction(this, "registerBooking", {
      functionName: "registerBooking",
      runtime: Runtime.NODEJS_18_X,
      handler: "handler",
      entry: path.join(__dirname, `../functions/RegisterBooking/index.ts`),
    });
    func.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["dynamodb:*"],
        resources: [props.seatsTable.tableArn],
      })
    );
    return func;
  }
  syncFLights(props: computeStackProps): NodejsFunction {
    const func = new NodejsFunction(this, "syncFlights", {
      functionName: "syncFlights",
      runtime: Runtime.NODEJS_18_X,
      handler: "handler",
      entry: path.join(__dirname, `../functions/SyncFlights/index.ts`),
    });
    func.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["dynamodb:*"],
        resources: [props.seatsTable.tableArn],
      })
    );
    return func;
  }
}
