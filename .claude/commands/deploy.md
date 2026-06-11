---
description: Cut a patch release — bump version, update CHANGELOG.md, commit, tag and push
argument-hint: "[optional release summary]"
allowed-tools: Read, Edit, Bash(git status:*), Bash(git branch:*), Bash(git log:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*), Bash(git tag:*), Bash(git push:*), Bash(npm version:*)
---

You are cutting a **patch release**. Follow these steps in order and stop if any step reveals a problem that needs the user's decision.

1. **Inspect state.** Run `git status` and `git branch --show-current`. Note the current branch (push to it; never force-push). Run `git log -1 --pretty=%s` and check for the latest `v*` tag with `git describe --tags --abbrev=0` (it may not exist yet).

2. **Bump the patch version.** Read the current `version` from `package.json`, then run `npm version patch --no-git-tag-version` (updates `package.json` and `package-lock.json`, no commit, no tag). Capture the new version `X.Y.Z`.

3. **Update `CHANGELOG.md`** at the repo root (Keep a Changelog format):
   - Take the contents under `## [Unreleased]` and move them into a new section `## [X.Y.Z] - YYYY-MM-DD` (today's date), directly below `## [Unreleased]`.
   - Leave a fresh, empty `## [Unreleased]` heading at the top for future work.
   - If `## [Unreleased]` is empty (or missing), derive the entries yourself: summarize the changes since the last release using `git log <lastTag>..HEAD --oneline` plus the current working-tree diff (`git status` / `git diff`), grouped under **Added / Changed / Fixed**. Incorporate the user's `$ARGUMENTS` summary if provided.

4. **Commit everything.** Stage all changes (`git add -A`) — this includes any pending feature work, the version bump and the changelog — and commit with the message `chore(release): vX.Y.Z`.

5. **Tag and push.** Create an annotated tag `git tag -a vX.Y.Z -m "vX.Y.Z"`, then push the branch and the tag: `git push origin HEAD:<current-branch>` and `git push origin vX.Y.Z`.

6. **Report.** Print the new version, the changelog entry you wrote, and confirm the push succeeded. The app footer reads the version from `package.json`, so it will show `vX.Y.Z` after deploy.

Do not run lint/build here unless the user asks; the weekly sync workflow already gates data. If the working tree is clean and there is nothing to release, say so instead of creating an empty commit.
