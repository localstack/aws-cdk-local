const { configureEnvironment, EnvironmentMisconfigurationError } = require("../src");

describe("configureEnvironment", () => {
  test("empty environment", () => {
    const env = {};
    const allowListStr = "";
    configureEnvironment(env, allowListStr);
    expect(env).toEqual({
      AWS_ENDPOINT_URL: "http://localhost.localstack.cloud:4566",
      AWS_ENDPOINT_URL_S3: "http://s3.localhost.localstack.cloud:4566",
    });
  });

  test("custom endpoint url", () => {
    const env = {
      AWS_ENDPOINT_URL: "http://foo.bar:4567",
      AWS_ENDPOINT_URL_S3: "http://foo.bar:4567",
    };
    const allowListStr = "";
    configureEnvironment(env, allowListStr);
    expect(env).toEqual({
      AWS_ENDPOINT_URL: "http://foo.bar:4567",
      AWS_ENDPOINT_URL_S3: "http://foo.bar:4567",
    });
  });

  test("custom endpoint url without specifying s3 url", () => {
    const env = {
      AWS_ENDPOINT_URL: "http://foo.bar:4567",
    };
    const allowListStr = "";
    expect(() => configureEnvironment(env, allowListStr)).toThrow(EnvironmentMisconfigurationError);
  });

  test("strip extra configuration envars", () => {
    const env = {
      AWS_PROFILE: "my-profile",
    };
    const allowListStr = "";
    configureEnvironment(env, allowListStr);
    expect(env).toEqual({
      AWS_ENDPOINT_URL: "http://localhost.localstack.cloud:4566",
      AWS_ENDPOINT_URL_S3: "http://s3.localhost.localstack.cloud:4566",
    });
  });

  test("allowlist of profile", () => {
    const env = {
      AWS_PROFILE: "my-profile",
    };
    const allowListStr = "AWS_PROFILE";
    configureEnvironment(env, allowListStr);
    expect(env).toEqual({
      AWS_PROFILE: "my-profile",
      AWS_ENDPOINT_URL: "http://localhost.localstack.cloud:4566",
      AWS_ENDPOINT_URL_S3: "http://s3.localhost.localstack.cloud:4566",
    });
  });
});
