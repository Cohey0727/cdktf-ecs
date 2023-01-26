import { routeTable } from "@cdktf/provider-aws";
import { TerraformStack } from "cdktf";
import * as aws from "@cdktf/provider-aws";

class NetworkStack {
  readonly scope: TerraformStack;
  readonly vpc: aws.vpc.Vpc;
  readonly privateSubnets: aws.subnet.Subnet[];
  readonly publicSubnets: aws.subnet.Subnet[];

  constructor(scope: TerraformStack, name: string) {
    this.scope = scope;
    const vpcName = `${name}-vpc`;
    this.vpc = new aws.vpc.Vpc(scope, "MainVpc", {
      cidrBlock: "10.0.0.0/16",
      tags: {
        Name: vpcName,
      },
    });

    const privateSubnetCount = 2;
    this.privateSubnets = [...Array(privateSubnetCount).keys()].map((index) => {
      const logicId = `PrivateSubnet-${index}`;
      const subnetName = `${name}-private-subnet-${index}`;
      return new aws.subnet.Subnet(scope, logicId, {
        cidrBlock: `10.0.${index}.0/24`,
        vpcId: this.vpc.id,
        tags: {
          Name: subnetName,
        },
      });
    });

    const publicSubnetCount = 2;
    this.publicSubnets = [...Array(publicSubnetCount).keys()].map((index) => {
      const logicId = `PublicSubnet-${index}`;
      const subnetName = `${name}-public-subnet-${index}`;
      return new aws.subnet.Subnet(scope, logicId, {
        cidrBlock: `10.0.${index + 16}.0/24`,
        vpcId: this.vpc.id,
        tags: {
          Name: subnetName,
        },
      });
    });
    const igwName = `${name}-igw`;
    const igw = new aws.internetGateway.InternetGateway(
      scope,
      "InternetGateway",
      {
        vpcId: this.vpc.id,
        tags: {
          Name: igwName,
        },
      }
    );
    const publicRouteTable = new aws.routeTable.RouteTable(
      scope,
      "PublicRouteTable",
      {
        vpcId: this.vpc.id,
        route: [{ gatewayId: igw.id, cidrBlock: "0.0.0.0/0" }],
        tags: { Name: `${name}-public-route-table` },
      }
    );

    this.publicSubnets.map((subnet, index) =>
      this.attachRouteTable(
        `AttachPublicRouteTable-${index}`,
        subnet,
        publicRouteTable
      )
    );
  }

  attachRouteTable(
    id: string,
    subnet: aws.subnet.Subnet,
    routeTable: routeTable.RouteTable
  ) {
    new aws.routeTableAssociation.RouteTableAssociation(this.scope, id, {
      subnetId: subnet.id,
      routeTableId: routeTable.id,
    });
  }
}

export default NetworkStack;
