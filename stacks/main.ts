import { Construct } from "constructs";
import { TerraformOutput, TerraformStack } from "cdktf";
import { provider } from "@cdktf/provider-aws";
import * as aws from "@cdktf/provider-aws";
import { DataAwsCallerIdentity } from "@cdktf/provider-aws/lib/data-aws-caller-identity";

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

    // new EcsStack(this, name);
    createOutput(this, {
      aws_account_id: awsData.accountId,
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
