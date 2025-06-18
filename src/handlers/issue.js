export default async function handleIssueOpened(context) {
  const issueComment = context.issue({
    body: 'Thanks for opening this issue!',
  });
  await context.octokit.issues.createComment(issueComment);
}
