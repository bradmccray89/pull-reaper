import nock from "nock";
import { fetchOpenAIReview } from "../src/services/openai.js";
import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert";

describe("fetchOpenAIReview", () => {
  beforeEach(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  test("returns review content from OpenAI", async () => {
    const mock = nock("https://api.openai.com")
      .post("/v1/chat/completions")
      .reply(200, {
        choices: [
          {
            message: { content: "review" },
          },
        ],
      });

    const result = await fetchOpenAIReview("diff", "key");
    assert.equal(result, "review");
    assert.deepStrictEqual(mock.pendingMocks(), []);
  });

  test("throws when OpenAI returns an error", async () => {
    const mock = nock("https://api.openai.com")
      .post("/v1/chat/completions")
      .reply(500, "oops");

    await assert.rejects(
      fetchOpenAIReview("diff", "key"),
      /OpenAI request failed: 500/
    );
    assert.deepStrictEqual(mock.pendingMocks(), []);
  });
});
