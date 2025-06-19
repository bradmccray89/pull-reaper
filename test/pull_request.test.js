import nock from "nock";
import myProbotApp from "../index.js";
import { Probot, ProbotOctokit } from "probot";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { describe, beforeEach, afterEach, test } from "node:test";
import assert from "node:assert";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const privateKey = fs.readFileSync(
  path.join(__dirname, "fixtures/mock-cert.pem"),
  "utf-8",
);

const prPayload = JSON.parse(
  fs.readFileSync(path.join(__dirname, "fixtures/pull_request.opened.json"), "utf-8"),
);
const prPayloadOriginal = JSON.parse(
  fs.readFileSync(path.join(__dirname, "fixtures/pull_request.opened.json"), "utf-8"),
);

describe("Pull request handler", () => {
  let probot;

  beforeEach(() => {
    nock.disableNetConnect();
    probot = new Probot({
      appId: 123,
      privateKey,
      Octokit: ProbotOctokit.defaults({
        retry: { enabled: false },
        throttle: { enabled: false },
      }),
    });
    probot.load(myProbotApp);
  });

  test("skips when OPENAI_API_KEY is not set", async () => {
    await probot.receive({ name: "pull_request", payload: prPayload });
  });

  test("posts fallback comment when OpenAI response is invalid JSON", async () => {
    process.env.OPENAI_API_KEY = "test";

    const ghMock = nock("https://api.github.com")
      .post("/app/installations/2/access_tokens")
      .reply(200, {
        token: "test",
        permissions: {
          issues: "write",
          pull_requests: "read",
        },
      })
      .get("/repos/hiimbex/testing-things/pulls/1")
      .reply(200, "diff")
      .post("/repos/hiimbex/testing-things/issues/1/comments", (body) => {
        assert.deepEqual(body, { body: "invalid" });
        return true;
      })
      .reply(200);

    const aiMock = nock("https://api.openai.com")
      .post("/v1/chat/completions")
      .reply(200, {
        choices: [
          {
            message: { content: "invalid" },
          },
        ],
      });

    await probot.receive({ name: "pull_request", payload: prPayload });

    assert.deepStrictEqual(ghMock.pendingMocks(), []);
    assert.deepStrictEqual(aiMock.pendingMocks(), []);
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
    delete process.env.OPENAI_API_KEY;
    Object.assign(prPayload, prPayloadOriginal);
  });
});
