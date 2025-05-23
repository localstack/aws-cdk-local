[![Integration Tests](https://github.com/localstack/aws-cdk-local/actions/workflows/build.yml/badge.svg)](https://github.com/localstack/aws-cdk-local/actions/workflows/build.yml)

# AWS Cloud Development Kit (CDK) for LocalStack

This project provides a thin wrapper script `cdklocal` for using the [AWS CDK](https://github.com/aws/aws-cdk) library against local APIs provided by [LocalStack](https://github.com/localstack/localstack).

**Note:** This project replaces the [old (deprecated) repo](https://github.com/localstack/aws-cdk) which was a fork of the AWS CDK repo. Instead of forking the repo and applying changes, we now simply provide a simple wrapper script `cdklocal` which applies runtime patching. The advantage of the new approach is that you should be able to use arbitrary CDK versions under the cover.

## Quick Installation

The `cdklocal` command line is published as an [npm library](https://www.npmjs.com/package/aws-cdk-local):
```bash
$ npm install -g aws-cdk-local aws-cdk
...
$ cdklocal --version
1.65.5
```

**Note:** Starting with version `1.65.2`, the dependency `aws-cdk` needs to be installed manually
(to decouple the two libraries, and allow using arbitrary versions of `aws-cdk` under the covers).

(Note: Depending on your local setup, you may or may not have to use the global `npm` installation flag `-g` above.)

### Mac OS specific `MODULE_NOT_FOUND` issue
On Mac OS, brew can be used to install AWS CDK, which might result in a `MODULE_NOT_FOUND` error from `cdklocal`.
To resolve this, set the `NODE_PATH` variable pointing to your AWS CDK's `node_module` folder to expand the lookup path for modules.
```bash
$ export NODE_PATH=$NODE_PATH:/opt/homebrew/Cellar/aws-cdk/<CDK_VERSION>/libexec/lib/node_modules
```

## Version support

`cdklocal` supports all installed versions of the node `aws-cdk` package, however some complications are present for `aws-cdk >= 2.177.0`.

For these CDK versions, we remove AWS configuration environment variables like `AWS_PROFILE` from the shell environment before invoking the `cdk` command, and explicitly set `AWS_ENDPOINT_URL` and `AWS_ENDPOINT_URL_S3` to target LocalStack.

1. We do this because other environment variables may lead to a conflicting set of configuration options, where the wrong region is used to target LocalStack, or `cdklocal` tries to deploy into upstream AWS by mistake. If individual configuration variables are needed for the deploy process (e.g. `AWS_REGION`) these configuration variables can be propagated to the `cdk` command by configuring `AWS_ENVAR_ALLOWLIST`, for example: `AWS_ENVAR_ALLOWLIST=AWS_REGION,AWS_DEFAULT_REGION AWS_DEFAULT_REGION=eu-central-1 AWS_REGION=eu-central-1 cdklocal ...`.
2. If you are manually setting `AWS_ENDPOINT_URL`, the new value will continue to be read from the environment, however `AWS_ENDPOINT_URL_S3` _must_ also be set and should include a `.s3.` component to ensure we correctly detect S3 requests.

## Configurations

The following environment variables can be configured:

* `AWS_ENDPOINT_URL`: The endpoint URL to connect to (combination of `USE_SSL`/`LOCALSTACK_HOSTNAME`/`EDGE_PORT` below)
* `AWS_ENDPOINT_URL_S3`: The endpoint URL to connect to (combination of `USE_SSL`/`LOCALSTACK_HOSTNAME`/`EDGE_PORT` below) for S3 requests
* `AWS_ENVAR_ALLOWLIST`: Allow specific `AWS_*` environment variables to be used by the CDK
* `EDGE_PORT` (deprecated): Port under which LocalStack edge service is accessible (default: `4566`)
* `LOCALSTACK_HOSTNAME` (deprecated): Target host under which LocalStack edge service is accessible (default: `localhost`)
* `USE_SSL` (deprecated): Whether to use SSL to connect to the LocalStack endpoint, i.e., connect via HTTPS.
* `LAMBDA_MOUNT_CODE`: Whether to use local Lambda code mounting (via setting `__local__` S3 bucket name). Note: may require CDK version <2.14.0 to be fully functional.
* `BUCKET_MARKER_LOCAL`: Magic S3 bucket name for Lambda mount and [hot reloading](https://docs.localstack.cloud/user-guide/tools/lambda-tools/hot-reloading) (default: `__local__`, will default to `hot-reload` in a future release)

## Deploying a Sample App

The CDK command line ships with a sample app generator to run a quick test for getting started:
```bash
$ mkdir /tmp/test; cd /tmp/test
$ cdklocal init sample-app --language=javascript
...
```

Make sure that LocalStack is installed and started up with the required services:
```bash
$ SERVICES=serverless,sqs,sns localstack start
```

Then deploy the sample app against the local APIs via the `cdklocal` command line:
```bash
$ cdklocal deploy
...
Do you wish to deploy these changes (y/n)? y
...
Stack ARN:
arn:aws:cloudformation:us-east-1:000000000000:stack/TestStack/e3debc0a-311e-4968-8230-ed78f89cb614
```

Once the deployment is done, you can inspect the created resources via the [`awslocal`](https://github.com/localstack/awscli-local) command line:
```bash
$ awslocal sns list-topics
{
    "Topics": [
        {
            "TopicArn": "arn:aws:sns:us-east-1:000000000000:TestStack-TestTopic339EC197-79F43WWCCS4Z"
        }
    ]
}
```

## Change Log

* 3.0.1: Using the `-v`/`--version` flag prints the cdklocal version and the version of the underlying `aws-cdk` package (if possible)
* 3.0.0: Sanitise environment of configuration environment variables before deployment
* 2.19.2: Fix SDK compatibility with aws-cdk versions >= 2.177.0
* 2.19.1: Fix SDK compatibility with older CDK versions; Fix patched bucket location in TemplateURL
* 2.19.0: Add support for aws-cdk versions >= `2.167.0`
* 2.18.1: Throw better exception if `aws-cdk` not found
* 2.18.0: Add support for AWS_ENDPOINT_URL, USE_SSL, and BUCKET_MARKER_LOCAL configurations
* 2.17.0: Fix IPv4 fallback check to prevent IPv6 connection issue with `localhost` on macOS
* 2.16.0: Add check to prevent IPv6 connection issue with `localhost` on MacOS
* 2.15.0: Fix issue with undefined BUCKET_NAME_OUTPUT variable; add CI build and eslint config
* 2.14.0: Add switches in patches to accommodate new esbuild packaging mechanism in CDK v2.14.0+
* 1.65.7: Add switch that checks for asset existence before symlinking assets; fix parsing fetched template body for JSON/YAML formats; add missing dependency to "diff" package
* 1.65.6: Create symlinks to Lambda assets to enable persistent code mounting of Lambdas on "cdklocal synth"
* 1.65.5: Add support for `LAMBDA_MOUNT_CODE` config to enable local Lambda code mounting
* 1.65.4: Add support for large stacks by patching bucketUrl for ToolkitInfo
* 1.65.2: Patch missing getPromise() in forceCredentialRetrieval; remove aws-cdk from npm dependencies
* 1.65.1: Override BucketURL to use path style addressing
* 1.65.0: Initial release

## License

The AWS CDK is distributed under the [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0).
