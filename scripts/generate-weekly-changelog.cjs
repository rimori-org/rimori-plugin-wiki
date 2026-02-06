#!/usr/bin/env node
/* global process, console, require */
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Generates a human-readable changelog for the weekly release workflow.
 * - Uses git history to collect commits since the last tag (or last 50 commits).
 * - Optionally calls OpenAI to summarize the changes for language learners.
 * - Outputs changelog to stdout (capture with shell redirection or command substitution).
 */

const https = require('https');
const { execSync } = require('child_process');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

function run(command) {
  return execSync(command, { encoding: 'utf8' }).trim();
}

function getCommits() {
  let lastTag = '';
  try {
    lastTag = run('git describe --tags --abbrev=0');
  } catch {
    // No tags found yet
  }

  // Get commits since last merge to main, or since last tag, or last 50 commits
  if (lastTag) {
    return run(`git log ${lastTag}..HEAD --pretty=format:"%h - %s"`);
  }

  // Try to get commits since last merge to main
  try {
    const lastMainMerge = run('git log --first-parent --grep="Merge" --oneline -1 origin/main 2>/dev/null || git log --first-parent --oneline -1 origin/main 2>/dev/null || echo ""');
    if (lastMainMerge) {
      const mergeHash = lastMainMerge.split(' ')[0];
      return run(`git log ${mergeHash}..HEAD --pretty=format:"%h - %s"`);
    }
  } catch {
    // Fall through to default
  }

  // Fall back to last 50 commits if no tags exist
  return run('git log -50 --pretty=format:"%h - %s"');
}

function buildFallbackChangelog(commits) {
  const entries = commits
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (!entries.length) {
    return "## What's New\n\nNo changes since last release.\n";
  }

  const features = [];
  const fixes = [];
  const improvements = [];

  entries.forEach((entry) => {
    const lower = entry.toLowerCase();
    if (lower.includes('fix') || lower.includes('bug') || lower.includes('error')) {
      fixes.push(entry);
    } else if (lower.includes('feat') || lower.includes('add') || lower.includes('new')) {
      features.push(entry);
    } else {
      improvements.push(entry);
    }
  });

  const sections = ["## What's New\n"];

  if (features.length) {
    sections.push('### 🎉 New Features');
    features.slice(0, 5).forEach((item) => sections.push(`- ${item}`));
    sections.push('');
  }

  if (fixes.length) {
    sections.push('### 🐛 Bug Fixes');
    fixes.slice(0, 5).forEach((item) => sections.push(`- ${item}`));
    sections.push('');
  }

  if (improvements.length) {
    sections.push('### ✨ Improvements');
    improvements.slice(0, 5).forEach((item) => sections.push(`- ${item}`));
    sections.push('');
  }

  sections.push('### 📚 For Language Learners');
  sections.push('These updates focus on making the flashcard plugin smoother and more helpful while you practice.');
  sections.push('');

  return `${sections.join('\n')}\n`;
}

function callOpenAI(commits) {
  return new Promise((resolve, reject) => {
    if (!OPENAI_API_KEY) {
      reject(new Error('Missing OPENAI_API_KEY'));
      return;
    }

    const payload = {
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 1000,
      messages: [
        {
          role: 'system',
          content:
            'You are a technical writer creating user-friendly changelogs for a language learning flashcard plugin. Focus on user benefits, not technical details.',
        },
        {
          role: 'user',
          content: `Generate a user-friendly changelog for language learners using a flashcard plugin.
Focus on what they will notice and benefit from.
Format as markdown with sections for New Features, Bug Fixes, Improvements, and a closing section for learners.

Commits since last release:
${commits}
`,
        },
      ],
    };

    const data = JSON.stringify(payload);

    const req = https.request(
      {
        hostname: 'api.openai.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            const content = parsed?.choices?.[0]?.message?.content?.trim();
            if (!content) {
              reject(new Error('OpenAI returned empty content'));
              return;
            }
            resolve(content);
          } catch (error) {
            reject(error);
          }
        });
      },
    );

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  const commits = getCommits();

  if (!commits.trim()) {
    console.log("## What's New\n\nNo changes since last release.");
    return;
  }

  let changelog;

  if (OPENAI_API_KEY) {
    try {
      changelog = await callOpenAI(commits);
      console.error('Generated changelog via OpenAI.');
    } catch (error) {
      console.error(`OpenAI generation failed (${error.message}); using fallback summary.`);
    }
  }

  if (!changelog) {
    changelog = buildFallbackChangelog(commits);
  }

  // Output changelog to stdout (status messages go to stderr)
  console.log(changelog.endsWith('\n') ? changelog.trimEnd() : changelog);
}

main().catch((error) => {
  console.error('Failed to generate changelog:', error);
  process.exit(1);
});

