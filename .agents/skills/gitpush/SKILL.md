---
name: gitpush
description: Stages all local changes, commits them with a descriptive message, and pushes them to GitHub.
---

# Git Push Skill

When the user requests to push their code or triggers `/gitpush`, follow this exact workflow:

## 1. Inspect Changes
Run `git status` to see what files have been modified, created, or deleted.

## 2. Determine Commit Message
- Check if the user specified a commit message in their message.
- If they did not specify a commit message, generate a concise, descriptive commit message based on the changed files and modifications.

## 3. Execute Git Commands
Run the following commands in the workspace root directory:
1. Stage all changes:
   ```bash
   git add .
   ```
2. Commit changes:
   ```bash
   git commit -m "<Commit Message>"
   ```
3. Push changes to GitHub:
   ```bash
   git push
   ```

## 4. Report Progress
Provide a brief summary of the files committed and the branch they were pushed to.
