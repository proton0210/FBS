import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import path = require("path");
import * as iam from "aws-cdk-lib/aws-iam";
interface computeStackProps extends cdk.StackProps {
  usersTable: Table;
}

export class ComputeStack extends cdk.Stack {
  readonly addUserToTableFunc: NodejsFunction;

  constructor(scope: Construct, id: string, props: computeStackProps) {
    super(scope, id, props);
    this.addUserToTableFunc = this.addUserToUsersTable(props);
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
}
