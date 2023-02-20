import { TerraformStack } from "cdktf";
import * as aws from "@cdktf/provider-aws";
import * as fs from "fs";
import EcsStack from "./ecs-stack";

type NotificationStackProps = {
  ecs: EcsStack;
};

class NotificationStack {
  readonly scope: TerraformStack;
  readonly ecsTopic: aws.snsTopic.SnsTopic;
  constructor(scope: TerraformStack, name: string, props: NotificationStackProps) {
    this.scope = scope;
    const { ecs } = props;

    const ecsTopicName = `${name}-ecs-topic`;
    this.ecsTopic = new aws.snsTopic.SnsTopic(this.scope, "SnsEcsTopic", {
      name: ecsTopicName,
      tags: { Name: ecsTopicName },
    });

    const ecsEventBridgeName = `${name}-ecs-event-bridge`;
    const eventBridgePattern = fs
      .readFileSync("stacks/event-bridge.json", "utf8")
      .replace("{{cluster-arn}}", ecs.cluster.arn);

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
