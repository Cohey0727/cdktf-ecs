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
          volumeSize: 64,
        },
        clusterConfig: {
          instanceType: "c6g.large.search",
          instanceCount: 2,
          zoneAwarenessEnabled: true,
          zoneAwarenessConfig: {
            availabilityZoneCount: 2,
          },
          warmEnabled: false,
          dedicatedMasterEnabled: true,
          dedicatedMasterCount: 3,
          dedicatedMasterType: "c6g.large.search",
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
        timeouts: {
          create: "2h",
          delete: "2h",
          update: "2h",
        },
      }
    );
  }
}

export default OpenSearchStack;
