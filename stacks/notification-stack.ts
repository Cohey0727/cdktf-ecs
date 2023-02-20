import { TerraformStack } from "cdktf";
import * as aws from "@cdktf/provider-aws";
import * as fs from "fs";
import EcsStack from "./ecs-stack";

type NotificationStackProps = {
  ecs: EcsStack;
  awsData: aws.dataAwsCallerIdentity.DataAwsCallerIdentity;
};

class NotificationStack {
  readonly scope: TerraformStack;
  readonly ecsTopic: aws.snsTopic.SnsTopic;
  constructor(scope: TerraformStack, name: string, props: NotificationStackProps) {
    this.scope = scope;
    const { ecs, awsData } = props;

    const ecsTopicName = `${name}-ecs-topic`;
    const accessPolicy = fs
      .readFileSync("stacks/sns-access-policy.json", "utf8")
      .replaceAll("{{aws-account-id}}", awsData.accountId)
      .replaceAll("{{topic-name}}", ecsTopicName);

    this.ecsTopic = new aws.snsTopic.SnsTopic(this.scope, "SnsEcsTopic", {
      name: ecsTopicName,
      policy: accessPolicy,
      tags: { Name: ecsTopicName },
    });

    const ecsEventBridgeName = `${name}-ecs-event-bridge`;
    const eventBridgePattern = fs
      .readFileSync("stacks/event-bridge.json", "utf8")
      .replaceAll("{{cluster-arn}}", ecs.cluster.arn);

    const eventRule = new aws.cloudwatchEventRule.CloudwatchEventRule(this.scope, "EcsEventRule", {
      name: ecsEventBridgeName,
      eventPattern: eventBridgePattern,
    });
    new aws.cloudwatchEventTarget.CloudwatchEventTarget(this.scope, "EcsTarget", {
      rule: eventRule.name,
      arn: this.ecsTopic.arn,
    });
  }
}

export default NotificationStack;
