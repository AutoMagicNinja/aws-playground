import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class SecurityBaseTypescriptStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const securityLogsBucket = new cdk.aws_s3.Bucket(this, 'aws-cdk-demo-security-logs-bucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const cloudTrail = new cdk.aws_cloudtrail.Trail(this, 'aws-cdk-demo-cloudtrail', {
      sendToCloudWatchLogs: false,
      bucket: securityLogsBucket,
      s3KeyPrefix: 'cloudtrail',
    });

    new cdk.aws_config.CfnConfigurationRecorder(this, 'aws-cdk-demo-configuration-recorder', {
      roleArn: new cdk.aws_iam.Role(this, 'aws-cdk-demo-configuration-recorder-role', {
        assumedBy: new cdk.aws_iam.ServicePrincipal('config.amazonaws.com'),
        managedPolicies: [cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWS_ConfigRole')],
        inlinePolicies: {
          'aws-cdk-demo-configuration-recorder-policy': new cdk.aws_iam.PolicyDocument({
            statements: [
              new cdk.aws_iam.PolicyStatement({
                actions: ['s3:PutObject'],
                effect: cdk.aws_iam.Effect.ALLOW,
                resources: [`${securityLogsBucket.bucketArn}/config/*`],
              }),
            ]
          })
        }
      }).roleArn,
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: true
      },
      recordingMode: {
        recordingFrequency: 'CONTINUOUS',
      },
    });

    new cdk.aws_config.CfnDeliveryChannel(this, 'aws-cdk-demo-config-delivery-channel', {
      s3BucketName: securityLogsBucket.bucketName,
      s3KeyPrefix: 'config',
      configSnapshotDeliveryProperties: {
        deliveryFrequency: 'One_Hour'
      }
    });

    const vpc = new cdk.aws_ec2.Vpc(this, 'aws-cdk-demo-vpc', {});

    vpc.addFlowLog('aws-cdk-demo-vpc-flow-log', {
      destination: cdk.aws_ec2.FlowLogDestination.toS3(securityLogsBucket, 'vpcflow'),
      trafficType: cdk.aws_ec2.FlowLogTrafficType.ALL,
    });

    const githubOidcProvider = new cdk.aws_iam.OpenIdConnectProvider(this, 'aws-cdk-demo-github-oidc-provider', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
    });

    const cicdRole = new cdk.aws_iam.Role(this, 'aws-cdk-demo-cicd-role', {
      assumedBy: new cdk.aws_iam.FederatedPrincipal(githubOidcProvider.openIdConnectProviderArn,
        {
          'StringEquals': { 'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com', },
          'StringLike': { 'token.actions.githubusercontent.com:sub': 'repo:aws-cdk-demo/aws-playground:*', },
        },
        "sts:AssumeRoleWithWebIdentity"
      ),
      inlinePolicies: {
        'aws-cdk-demo-cicd-role-policy': new cdk.aws_iam.PolicyDocument({
          statements: [
            new cdk.aws_iam.PolicyStatement({
              // TODO: refine this to limit certain actions
              actions: ['cloudtrail:*'],
              effect: cdk.aws_iam.Effect.DENY,
              resources: [cloudTrail.trailArn],
            }),
          ]
        })
      },
      managedPolicies: [
        // TODO: refine this to limit certain actions
        cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'),
      ],
    });

    new cdk.CfnOutput(this, 'aws-cdk-demo-cicd-role-arn', {
      value: cicdRole.roleArn
    });
  }
}
