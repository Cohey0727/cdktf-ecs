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
  readonly service: aws.ecsService.EcsService;
  readonly executionRole: aws.iamRole.IamRole;
  readonly taskDefinition: aws.ecsTaskDefinition.EcsTaskDefinition;

  constructor(scope: TerraformStack, name: string, props: EcsStackProps) {
    this.scope = scope;
    this.cluster = new aws.ecsCluster.EcsCluster(scope, "EcsCluster", {
      name: `${name}-cluster`,
      tags: {
        Name: `${name}-cluster`,
        Stack: name,
      },
    });

    const assumeRolePolicy = fs.readFileSync(
      "stacks/task-execution-role-policy.json",
      "utf8"
    );

    this.executionRole = new aws.iamRole.IamRole(scope, "TaskExecution", {
      name: `${name}-TaskExecution`,
      assumeRolePolicy: assumeRolePolicy,
      managedPolicyArns: [
        "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
      ],
    });

    const logGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(
      scope,
      "LogGroup",
      {
        name: `/ecs/logs/${name}`,
      }
    );
    const containerDefinitions = fs
      .readFileSync("stacks/container-definitions.json", "utf8")
      .replaceAll("{{log-group}}", logGroup.name);

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
        tags: {
          Name: `${name}-task-definition`,
          Stack: name,
        },
      }
    );

    this.service = new aws.ecsService.EcsService(scope, "EcsService", {
      name: `${name}-service`,
      cluster: this.cluster.arn,
      taskDefinition: this.taskDefinition.arn,
      desiredCount: 1,
      launchType: "FARGATE",
      deploymentMaximumPercent: 100,
      deploymentMinimumHealthyPercent: 0,
      networkConfiguration: {
        subnets: props.network.publicSubnets.map((subnet) => subnet.id),
        assignPublicIp: true,
      },
      tags: {
        Name: `${name}-service`,
        Stack: name,
      },
    });
  }
}

export default EcsStack;
