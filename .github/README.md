# GitHub Actions Workflow

This directory contains the GitHub Actions workflow for the rimori-plugin-discussions project.

## Workflow

### Pipeline (`pipeline.yml`)
A unified workflow that handles both CI and releases:

**On Pull Requests:**
- Runs tests, linting, and builds
- Sends notifications to `#releases` channel (marked as "PR CI Check")

**On Push to Branches:**
- Runs tests, linting, and builds
- **dev branch** → runs `yarn rimori-release alpha`
- **beta branch** → runs `yarn rimori-release beta`  
- **main branch** → runs `yarn rimori-release stable`
- Sends notifications to `#releases` channel (marked as "Plugin Release")

## Required GitHub Secrets

To enable the release pipeline and Slack notifications, you need to configure the following secrets in your GitHub repository:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add the following repository secrets:

### `RIMORI_TOKEN`
Your Rimori platform authentication token.

### `SLACK_BOT_TOKEN`
Your Slack bot token for pipeline notifications (starts with `xoxb-`).

### `SLACK_CHANNEL_ID`
The Slack channel ID where notifications will be sent (starts with `C`).

**Note:** The `RIMORI_PLUGIN_ID` is automatically extracted from your `package.json` file (from the `r_id` field), so you don't need to set it as a secret.

## Slack Notifications

The pipeline sends all notifications to the `#releases` channel with clear separation:

- **Pull Requests**: Marked as "🔍 PR CI Check" - shows when PR checks pass/fail
- **Direct Pushes**: Marked as "🚀 Plugin Release" - shows when releases are completed

### Setting up Slack App Integration

1. **Create a Slack App:**
   - Go to https://api.slack.com/apps
   - Click "Create New App" → "From scratch"
   - Name your app and select your workspace

2. **Configure Bot Permissions:**
   - Go to **OAuth & Permissions**
   - Add these scopes: `chat:write`, `channels:read`, `groups:read`
   - Install the app to your workspace
   - Copy the **Bot User OAuth Token** (starts with `xoxb-`)

3. **Get Channel ID:**
   - In Slack, right-click on the `#releases` channel name
   - Select "View channel details"
   - Scroll down to find the **Channel ID** (starts with `C`)

4. **Add to GitHub Secrets:**
   - Add `SLACK_BOT_TOKEN` with your bot token
   - Add `SLACK_CHANNEL_ID` with your channel ID

5. **Invite Bot to Channel:**
   - In the `#releases` channel, type: `/invite @YourBotName`
   - Or mention the bot: `@YourBotName`

**Note:** If you don't set up the Slack integration, the pipeline will still work but won't send notifications.

## How it works

1. **Pull Requests**: The CI pipeline runs tests, linting, and builds to ensure code quality
2. **Push to dev**: Automatically triggers alpha release
3. **Push to beta**: Automatically triggers beta release  
4. **Push to main**: Automatically triggers stable release

## Manual Release

You can also trigger releases manually by pushing to the respective branches or by using the GitHub Actions interface to run the workflow manually.