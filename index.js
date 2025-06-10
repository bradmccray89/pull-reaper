/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */
export default (app) => {
  // Your code here
  app.log.info('Yay, the app was loaded!');

  app.on('issues.opened', async (context) => {
    const issueComment = context.issue({
      body: 'Thanks for opening this issue!',
    });
    return context.octokit.issues.createComment(issueComment);
  });

  app.on(['pull_request.opened', 'pull_request.synchronize'], async (context) => {
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
      const payload = {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are a code review bot. Analyze the following git diff and respond with JSON array of objects with `path`, `line`, and `body` describing issues. Only return JSON.',
          },
          { role: 'user', content: diff.slice(0, 20000) },
        ],
        temperature: 0,
      };

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`OpenAI request failed: ${response.status} ${await response.text()}`);
      }

      const data = await response.json();
      let comments;
      try {
        comments = JSON.parse(data.choices[0].message.content);
      } catch (e) {
        const comment = context.issue({ body: data.choices[0].message.content });
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
  });

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};
