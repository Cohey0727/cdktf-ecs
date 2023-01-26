import { TerraformStack } from "cdktf";
import NetworkStack from "./network-stack";
import * as aws from "@cdktf/provider-aws";

type EcsStackProps = {
  network: NetworkStack;
};

class EcsStack {
  readonly scope: TerraformStack;
  readonly cluster: aws.ecsCluster.EcsCluster;
  constructor(scope: TerraformStack, name: string, props: EcsStackProps) {
    this.scope = scope;
    this.cluster = new aws.ecsCluster.EcsCluster(scope, "EcsCluster", {
      name: `${name}-cluster`,
    });
  }
}

export default EcsStack;
