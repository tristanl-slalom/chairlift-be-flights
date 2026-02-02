#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { FlightsServiceStack } from '../lib/flights-service-stack';

const app = new cdk.App();

new FlightsServiceStack(app, 'ChairliftFlightsServiceStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-west-2'
  },
  description: 'Chairlift Flights Microservice Stack'
});
