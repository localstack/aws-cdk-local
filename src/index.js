const isEnvTrue = (envName) => ["1", "true"].includes(process.env[envName]);

const DEFAULT_EDGE_PORT = 4566;
const EDGE_PORT = process.env.EDGE_PORT || DEFAULT_EDGE_PORT;
const PROTOCOL = isEnvTrue("USE_SSL") ? "https" : "http";

class EnvironmentMisconfigurationError extends Error {
  constructor(message) {
    super(message);
  }
}

const configureEnvironment = (env, allowListStr) => {
  // If the user has set `AWS_ENDPOINT_URL` but _NOT_ `AWS_ENDPOINT_URL_S3` then we cannot continue
  // as we do not know if the users endpoint can support subdomains, and we cannot simply use the
  // same version as S3 requests will be parsed incorrectly.
  if (Object.hasOwn(env, "AWS_ENDPOINT_URL") && !Object.hasOwn(env, "AWS_ENDPOINT_URL_S3")) {
    throw new EnvironmentMisconfigurationError("If specifying 'AWS_ENDPOINT_URL' then 'AWS_ENDPOINT_URL_S3' must be specified");
  }

  // Strip out any variables that may configure the environment
  //
  // 1. parse AWS_ENVAR_ALLOWLIST to extract the keys we should allow
  const allowList = allowListStr.split(",").map((item) => item.trim());

  // 2. build array of keys to remove
  const keysToRemove = Object.keys(env).filter((key) => {
    // don't filter out any keys which are not AWS configuration keys
    if (!key.startsWith("AWS_")) {
      return false;
    }

    // always allow AWS_ENDPOINT_URL*
    if (key.startsWith("AWS_ENDPOINT_URL")) {
      return false;
    }

    // if the key has been explicitly allowlisted, don't exclude the key
    if (allowList.includes(key)) {
      return false;
    }

    // otherwise we should remove the key
    return true;
  });

  // 3. remove the keys from the environment

  Object.keys(env).forEach((key) => {
    if (keysToRemove.includes(key)) {
      delete env[key];
    }
  });

  // set credentials if not set from the environment
  env.AWS_ACCESS_KEY_ID = env.AWS_ACCESS_KEY_ID || "test";
  env.AWS_SECRET_ACCESS_KEY = env.AWS_SECRET_ACCESS_KEY || "test";

  // Explicitly set AWS_ENDPOINT_URL* to configure network access to LocalStack
  // This _must_ use localhost.localstack.cloud as we require valid subdomains of these paths to
  // resolve. Unfortunately though `curl` seems to support subdomains of localhost, the CDK does not.
  env.AWS_ENDPOINT_URL_S3 = env.AWS_ENDPOINT_URL_S3 || `${PROTOCOL}://s3.localhost.localstack.cloud:${EDGE_PORT}`;
  env.AWS_ENDPOINT_URL = env.AWS_ENDPOINT_URL || `${PROTOCOL}://localhost.localstack.cloud:${EDGE_PORT}`;
};


module.exports = {
  isEnvTrue,
  EDGE_PORT,
  PROTOCOL,
  configureEnvironment,
  EnvironmentMisconfigurationError,
};
