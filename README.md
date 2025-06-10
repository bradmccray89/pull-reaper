# pull-reaper

> A GitHub App built with [Probot](https://github.com/probot/probot) that A node.js app for managing pull requests

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## Docker

```sh
# 1. Build container
docker build -t pull-reaper .

# 2. Start container
docker run -e APP_ID=<app-id> -e PRIVATE_KEY=<pem-value> pull-reaper
```

## Pull Request Diff Check

When installed on a repository, this app watches pull requests and sends their
diffs to the OpenAI API. The API response is expected to be a JSON array of
inline review comments which are posted directly on the relevant lines of the
pull request. Configure an `OPENAI_API_KEY` environment variable for the app to
enable these reviews.

## Contributing

If you have suggestions for how pull-reaper could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2025 Brandon McCray
