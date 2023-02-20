import { App } from "cdktf";
import MainStack from "./stacks";

const stageName = process.env.APP_STAGE;
if (!stageName) {
  throw new Error("APP_STAGE is not set");
}

const app = new App();
new MainStack(app, `${stageName}-cdktf`);
app.synth();
