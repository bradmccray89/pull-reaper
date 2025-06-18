import { fetchOpenAIReview } from '../services/openai.js';

export default async function handlePullRequest(context, app) {
  const { owner, repo, pull_number } = context.pullRequest();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    app.log.warn('OPENAI_API_KEY not configured; skipping diff check.');
    return;
  }

  try {
    const diffRes = await context.octokit.pulls.get({
      owner,
      repo,
      pull_number,
      mediaType: { format: 'diff' },
    });

    const diff = diffRes.data;
    const message = await fetchOpenAIReview(diff, apiKey);

    let comments;
    try {
      comments = JSON.parse(message);
    } catch (e) {
      const comment = context.issue({ body: message });
      await context.octokit.issues.createComment(comment);
      return;
    }

    const commitId = context.payload.pull_request.head.sha;
    for (const c of comments) {
      if (!c.path || !c.line || !c.body) continue;
      await context.octokit.pulls.createReviewComment({
        owner,
        repo,
        pull_number,
        commit_id: commitId,
        path: c.path,
        line: c.line,
        side: 'RIGHT',
        body: c.body,
      });
    }
  } catch (err) {
    app.log.error(err);
  }
}
