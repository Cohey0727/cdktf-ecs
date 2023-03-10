import * as aws from "@cdktf/provider-aws";
import { TerraformStack } from "cdktf";
import NetworkStack from "./network-stack";

type DatabaseStackProps = {
  network: NetworkStack;
};

class DatabaseStack {
  readonly scope: TerraformStack;
  readonly cluster: aws.rdsCluster.RdsCluster;
  readonly parameterGroup: aws.rdsClusterParameterGroup.RdsClusterParameterGroup;
  static readonly databaseEngin = "aurora-mysql";
  static readonly engineVersion = "5.7.mysql_aurora.2.10.3";

  constructor(scope: TerraformStack, name: string, props: DatabaseStackProps) {
    this.scope = scope;
    const { network } = props;
    const dbSubnetGroup = new aws.dbSubnetGroup.DbSubnetGroup(this.scope, "DbSubnetGroup", {
      name: `${name}-subnet-group`,
      subnetIds: network.publicSubnets.map((subnet) => subnet.id),
      tags: {
        Name: `${name}-subnet-group`,
        Stack: name,
      },
    });

    const dbSecurityGroup = new aws.securityGroup.SecurityGroup(this.scope, "DbSecurityGroup", {
      name: `${name}-security-group`,
      vpcId: network.vpc.id,
      ingress: [
        {
          fromPort: 0,
          toPort: 65535,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
        },
      ],
      tags: {
        Name: `${name}-security-group`,
        Stack: name,
      },
    });

    const clusterIdentifier = `${name}-cluster`;
    this.parameterGroup = new aws.rdsClusterParameterGroup.RdsClusterParameterGroup(
      scope,
      "ClusterParameterGroup",
      {
        name: `${name}-cluster-parameter-group`,
        family: "aurora-mysql5.7",
        parameter: [
          {
            name: "binlog_format",
            value: "ROW",
            applyMethod: "pending-reboot",
          },
          {
            name: "binlog_checksum",
            value: "NONE",
            applyMethod: "pending-reboot",
          },
        ],
      }
    );

    this.cluster = new aws.rdsCluster.RdsCluster(this.scope, "RdsCluster", {
      clusterIdentifier,
      engine: DatabaseStack.databaseEngin,
      engineVersion: DatabaseStack.engineVersion,
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [dbSecurityGroup.id],
      masterUsername: process.env.DATABASE_MASTER_USER!,
      masterPassword: process.env.DATABASE_MASTER_PASSWORD!,
      databaseName: process.env.DATABASE_NAME!,
      skipFinalSnapshot: true,
      applyImmediately: true,
      dbClusterParameterGroupName: this.parameterGroup.name,
      dbInstanceParameterGroupName: this.parameterGroup.name,
      tags: { Name: clusterIdentifier, Stack: name },
    });

    new aws.rdsClusterInstance.RdsClusterInstance(this.scope, "RdsClusterInstance", {
      identifier: `${name}-cluster-instance`,
      clusterIdentifier: this.cluster.clusterIdentifier,
      engine: DatabaseStack.databaseEngin,
      instanceClass: "db.t3.small",
      publiclyAccessible: true,
      dbParameterGroupName: "default.aurora-mysql5.7",
    });
  }
}

export default DatabaseStack;
