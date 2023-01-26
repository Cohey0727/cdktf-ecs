import { App } from "cdktf";
import MainStack from "./stacks";

const stageName = process.env.STAGE;
if (!stageName) {
  throw new Error("STAGE is not set");
}

const app = new App();
new MainStack(app, `${stageName}-ecs`);
app.synth();
