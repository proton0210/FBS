import * as dotenv from "dotenv";
dotenv.config();

import * as cognito from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new cognito.CognitoIdentityProviderClient({
  region: "ap-south-1",
});

import Chance from "chance";
const chance = new Chance();

let firstName: string | undefined;

const createUser = () => {
  firstName = chance.first({ nationality: "en" });
  const lastName = chance.first({ nationality: "en" });
  const suffix = chance.string({
    length: 8,
    pool: "qwerrtyuiopassdfgghjklx",
  });
  const email = `${firstName}-${lastName}-${suffix}@serverlesscreed.com`;
  const password = chance.string({ length: 10 });
  return {
    email,
    password,
  };
};

describe("Auth Test Flow", () => {
  let email: string | undefined;
  let password: string | undefined;
  let userPoolId: string | undefined;
  let clientId: string | undefined;
  beforeAll(() => {
    const user = createUser();
    email = user.email;
    password = user.password;
    userPoolId = process.env.USER_POOL_ID;
    clientId = process.env.CLIENT_POOL_ID;
  });

  it("User exists in User Pool and User's Table", async () => {
    console.log(`[${email}] - signing up..`);
    const signUpCommand = new cognito.SignUpCommand({
      ClientId: clientId,
      Username: email,
      Password: password,
      UserAttributes: [
        {
          Name: "name",
          Value: firstName,
        },
      ],
    });
    const signUpResponse = await cognitoClient.send(signUpCommand);
    const userSub = signUpResponse.UserSub;

    console.log(`[${userSub}]-confirming Sign Up`);
    const adminCommand: cognito.AdminConfirmSignUpCommandInput = {
      UserPoolId: userPoolId as string,
      Username: userSub as string,
    };
    try {
      await cognitoClient.send(
        new cognito.AdminConfirmSignUpCommand(adminCommand)
      );
    } catch (error) {
      console.log("Error Confirming Sign up");
    }
  });
});
