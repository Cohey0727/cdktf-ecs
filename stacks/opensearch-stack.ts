import { TerraformStack } from "cdktf";
import * as aws from "@cdktf/provider-aws";

type OpenSearchStackProps = {};
class OpenSearchStack {
  readonly domain: aws.opensearchDomain.OpensearchDomain;
  constructor(
    scope: TerraformStack,
    name: string,
    props: OpenSearchStackProps
  ) {
    const domainName = `${name}-domain`;
    this.domain = new aws.opensearchDomain.OpensearchDomain(
      scope,
      "OpensearchDomain",
      {
        domainName,
        engineVersion: "OpenSearch_2.3",
        ebsOptions: {
          ebsEnabled: true,
          volumeType: "gp3",
          volumeSize: 10,
        },
        clusterConfig: {
          instanceType: "t3.small.search",
          instanceCount: 2,
          zoneAwarenessEnabled: true,
          zoneAwarenessConfig: {
            availabilityZoneCount: 2,
          },
          warmEnabled: false,
          dedicatedMasterEnabled: false,
        },
        advancedOptions: {
          "rest.action.multi.allow_explicit_index": "true",
        },
        domainEndpointOptions: {
          enforceHttps: true,
          tlsSecurityPolicy: "Policy-Min-TLS-1-2-2019-07",
        },
        nodeToNodeEncryption: { enabled: true },
        encryptAtRest: { enabled: true },
        advancedSecurityOptions: {
          enabled: true,
          internalUserDatabaseEnabled: true,
          masterUserOptions: {
            masterUserName: process.env.OPENSEARCH_MASTER_USER!,
            masterUserPassword: process.env.OPENSEARCH_MASTER_PASSWORD!,
          },
        },
      }
    );
  }
}

export default OpenSearchStack;
