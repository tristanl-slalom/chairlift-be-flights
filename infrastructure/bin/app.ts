#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TasksServiceStack } from '../lib/tasks-service-stack';

const app = new cdk.App();

new TasksServiceStack(app, 'ConceptoTasksServiceStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-west-2'
  },
  description: 'Concepto Tasks Microservice Stack'
});
