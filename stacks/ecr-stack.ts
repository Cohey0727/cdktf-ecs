import { TerraformStack } from "cdktf";
import * as aws from "@cdktf/provider-aws";

type EcrStackProps = {};

class EcrStack {
  readonly scope: TerraformStack;
  readonly repository: aws.ecrRepository.EcrRepository;
  constructor(scope: TerraformStack, name: string, props: EcrStackProps) {
    this.scope = scope;

    const repositoryName = `${name}-repository`;
    this.repository = new aws.ecrRepository.EcrRepository(this.scope, "EcrRepository", {
      name: repositoryName,
      imageTagMutability: "MUTABLE",
      imageScanningConfiguration: { scanOnPush: true },
      tags: {
        Name: repositoryName,
        Stack: name,
      },
    });
  }
}

export default EcrStack;
