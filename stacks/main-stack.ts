import { Construct } from "constructs";
import { TerraformOutput, TerraformStack } from "cdktf";
import { provider } from "@cdktf/provider-aws";
import * as aws from "@cdktf/provider-aws";
import { DataAwsCallerIdentity } from "@cdktf/provider-aws/lib/data-aws-caller-identity";
import NetworkStack from "./network-stack";
import EcsStack from "./ecs-stack";
import EcrStack from "./ecr-stack";
import DatabaseStack from "./database-stack";

const s3 = aws.s3Bucket;

class MainStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);
    new provider.AwsProvider(this, "AwsProvider", {
      region: "ap-northeast-1",
    });
    const awsData = new DataAwsCallerIdentity(this, "AwsData");

    new s3.S3Bucket(this, "S3Bucket", {
      bucket: `${name}-bucket`,
    });

    const network = new NetworkStack(this, name);
    const database = new DatabaseStack(this, name, { network });
    const ecr = new EcrStack(this, name, {});
    new EcsStack(this, name, { network, database, ecr });
    createOutput(this, {
      aws_account_id: awsData.accountId,
      vpc_id: network.vpc.id,
      private_subnet_ids: network.privateSubnets
        .map((subnet) => subnet.id)
        .join(","),
      public_subnet_ids: network.publicSubnets
        .map((subnet) => subnet.id)
        .join(","),
      ecr_repository_name: ecr.repository.name,
    });
  }
}

const createOutput = (scope: Construct, outputs: { [key: string]: string }) => {
  Object.entries(outputs).forEach(([key, value]) => {
    new TerraformOutput(scope, key, {
      value: value,
    });
  });
};

export default MainStack;
