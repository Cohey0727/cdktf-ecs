import { TerraformStack } from "cdktf";
import EcrStack from "./ecr-stack";
import NetworkStack from "./network-stack";
import * as aws from "@cdktf/provider-aws";
import * as fs from "fs";
import DatabaseStack from "./database-stack";

type EcsStackProps = {
  network: NetworkStack;
  ecr: EcrStack;
  database: DatabaseStack;
};

class EcsStack {
  readonly scope: TerraformStack;
  readonly cluster: aws.ecsCluster.EcsCluster;
  readonly service: aws.ecsService.EcsService;
  readonly executionRole: aws.iamRole.IamRole;
  readonly taskDefinition: aws.ecsTaskDefinition.EcsTaskDefinition;

  constructor(scope: TerraformStack, name: string, props: EcsStackProps) {
    this.scope = scope;
    const { network, ecr, database } = props;

    const clusterName = `${name}-cluster`;
    this.cluster = new aws.ecsCluster.EcsCluster(scope, "EcsCluster", {
      name: clusterName,
      tags: { Name: clusterName, Stack: name },
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
      { name: `/ecs/logs/${name}` }
    );
    const containerDefinitions = fs
      .readFileSync("stacks/container-definitions.json", "utf8")
      .replaceAll("{{log-group}}", logGroup.name)
      .replaceAll("{{image-url}}", `${ecr.repository.repositoryUrl}:latest`)
      .replaceAll("{{database-host}}", database.cluster.endpoint)
      .replaceAll("{{database-password}}", database.cluster.masterPassword)
      .replaceAll("{{database-user}}", database.cluster.masterUsername)
      .replaceAll("{{database-port}}", `${database.cluster.port}`)
      .replaceAll("{{database-schema}}", `${database.cluster.databaseName}`);

    const taskDefinitionName = `${name}-task-definition`;
    this.taskDefinition = new aws.ecsTaskDefinition.EcsTaskDefinition(
      scope,
      "EcsTaskDefinition",
      {
        family: taskDefinitionName,
        requiresCompatibilities: ["FARGATE"],
        networkMode: "awsvpc",
        containerDefinitions,
        cpu: "256",
        memory: "512",
        executionRoleArn: this.executionRole.arn,
        runtimePlatform: {
          operatingSystemFamily: "LINUX",
          cpuArchitecture: "ARM64",
        },
        tags: { Name: taskDefinitionName, Stack: name },
      }
    );

    const serviceName = `${name}-service`;
    this.service = new aws.ecsService.EcsService(scope, "EcsService", {
      name: serviceName,
      cluster: this.cluster.arn,
      taskDefinition: this.taskDefinition.arn,
      desiredCount: 1,
      launchType: "FARGATE",
      deploymentMaximumPercent: 100,
      deploymentMinimumHealthyPercent: 0,
      networkConfiguration: {
        subnets: network.publicSubnets.map((subnet) => subnet.id),
        assignPublicIp: true,
      },
      tags: { Name: serviceName, Stack: name },
    });
  }
}

export default EcsStack;
