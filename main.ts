import { App } from "cdktf";
import MainStack from "./stacks/main";

const envName = process.env.STAGE;
if (!envName) {
  throw new Error("STAGE is not set");
}

const app = new App();
new MainStack(app, `${envName}-ecs`);
app.synth();
