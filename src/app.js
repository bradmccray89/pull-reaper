import handleIssueOpened from './handlers/issue.js';
import handlePullRequest from './handlers/pull_request.js';

export default function app(app) {
  app.log.info('Yay, the app was loaded!');

  app.on('issues.opened', handleIssueOpened);

  app.on(['pull_request.opened', 'pull_request.synchronize'], (context) =>
    handlePullRequest(context, app)
  );
}
