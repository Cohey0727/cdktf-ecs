import { TerraformStack } from "cdktf";
import NetworkStack from "./network-stack";
import * as aws from "@cdktf/provider-aws";
import * as fs from "fs";

type EcsStackProps = {
  network: NetworkStack;
};

class EcsStack {
  readonly scope: TerraformStack;
  readonly cluster: aws.ecsCluster.EcsCluster;
  readonly executionRole: aws.iamRole.IamRole;
  readonly taskDefinition: aws.ecsTaskDefinition.EcsTaskDefinition;

  constructor(scope: TerraformStack, name: string, props: EcsStackProps) {
    this.scope = scope;
    this.cluster = new aws.ecsCluster.EcsCluster(scope, "EcsCluster", {
      name: `${name}-cluster`,
    });

    const assumeRolePolicy = fs.readFileSync(
      "stacks/task-execution-role-policy.json",
      "utf8"
    );

    this.executionRole = new aws.iamRole.IamRole(scope, "TaskExecution", {
      name: `${name}-TaskExecution`,
      assumeRolePolicy: assumeRolePolicy,
    });

    const containerDefinitions = fs.readFileSync(
      "stacks/container-definitions.json",
      "utf8"
    );
    this.taskDefinition = new aws.ecsTaskDefinition.EcsTaskDefinition(
      scope,
      "EcsTaskDefinition",
      {
        family: `${name}-task-definition`,
        requiresCompatibilities: ["FARGATE"],
        networkMode: "awsvpc",
        containerDefinitions,
        cpu: "256",
        memory: "512",
        executionRoleArn: this.executionRole.arn,
      }
    );

    const service = new aws.ecsService.EcsService(scope, "EcsService", {
      name: `${name}-service`,
      cluster: this.cluster.arn,
      taskDefinition: this.taskDefinition.arn,
      desiredCount: 1,
      launchType: "FARGATE",
      networkConfiguration: {
        subnets: props.network.publicSubnets.map((subnet) => subnet.id),
        assignPublicIp: false,
      },
    });
  }
}

export default EcsStack;
