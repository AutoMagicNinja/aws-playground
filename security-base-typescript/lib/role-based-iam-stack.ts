import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class RoleBasedIAMStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define IAM users
    // TODO: use SAML or OIDC to federate users
    const IncidentResponderUser = new cdk.aws_iam.User(this, 'IncidentResponder', {
      userName: 'CDK-TS-IncidentResponder'
    });
    const DeveloperUser = new cdk.aws_iam.User(this, 'Developer', {
      userName: 'CDK-TS-Developer'
    });

    // Define IAM roles the users may assume
    const SecurityAdminRole = new cdk.aws_iam.Role(this, 'SecurityAdminRole', {
      roleName: 'CDK-TS-SecurityAdmin',
      assumedBy: IncidentResponderUser,
      managedPolicies: [
        cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess')
      ],
      maxSessionDuration: cdk.Duration.hours(1),
    });
    const SecurityAnalystRole = new cdk.aws_iam.Role(this, 'SecurityAnalystRole', {
      roleName: 'CDK-TS-SecurityAnalyst',
      assumedBy: IncidentResponderUser,
      managedPolicies: [
        cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('SecurityAudit'),
        cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('ReadOnlyAccess')
      ],
      maxSessionDuration: cdk.Duration.hours(4),
    });
    const PowerUserRole = new cdk.aws_iam.Role(this, 'PowerUserRole', {
      roleName: 'CDK-TS-PowerUser',
      assumedBy: DeveloperUser,
      managedPolicies: [
        cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('job-function/DataScientist'),
        cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('job-function/NetworkAdministrator'),
        cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('PowerUserAccess'),
        cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('ReadOnlyAccess')
      ],
      maxSessionDuration: cdk.Duration.hours(2),
    });

    // By default, limit the users to only assume their roles
    const IncidentResponderAssumeRolePolicy = new cdk.aws_iam.Policy(this, 'IncidentResponderAssumeRolePolicy', {
      policyName: 'CDK-TS-IncidentResponderAssumeRole',
      statements: [
        new cdk.aws_iam.PolicyStatement({
          actions: ['sts:AssumeRole'],
          resources: [SecurityAdminRole.roleArn, SecurityAnalystRole.roleArn],
          effect: cdk.aws_iam.Effect.ALLOW
        }),
        new cdk.aws_iam.PolicyStatement({
          notActions: ['sts:AssumeRole'],
          resources: [SecurityAdminRole.roleArn, SecurityAnalystRole.roleArn],
          effect: cdk.aws_iam.Effect.DENY
        })
      ],
    });
    IncidentResponderUser.attachInlinePolicy(IncidentResponderAssumeRolePolicy);
    SecurityAdminRole.grantAssumeRole(IncidentResponderUser);
    SecurityAnalystRole.grantAssumeRole(IncidentResponderUser);

    const DeveloperAssumeRolePolicy = new cdk.aws_iam.Policy(this, 'DeveloperAssumeRolePolicy', {
      policyName: 'CDK-TS-DeveloperAssumeRole',
      statements: [
        new cdk.aws_iam.PolicyStatement({
          actions: ['sts:AssumeRole'],
          resources: [PowerUserRole.roleArn],
          effect: cdk.aws_iam.Effect.ALLOW
        }),
        new cdk.aws_iam.PolicyStatement({
          notActions: ['sts:AssumeRole'],
          resources: [PowerUserRole.roleArn],
          effect: cdk.aws_iam.Effect.DENY
        })
      ],
    });
    DeveloperUser.attachInlinePolicy(DeveloperAssumeRolePolicy);
    PowerUserRole.grantAssumeRole(DeveloperUser);
  }
}
