#!/usr/bin/env bash
set -euo pipefail

INTERVAL_MINUTES="${INTERVAL_MINUTES:-30}"
INTERVAL_SECONDS=$((INTERVAL_MINUTES * 60))
PUSH="${PUSH:-1}"

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Aborting: not inside a git repository."
  exit 1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "Aborting: no 'origin' remote configured. Configure origin first, then rerun."
  exit 1
fi

BRANCH="$(git symbolic-ref --quiet --short HEAD || true)"
if [[ -z "$BRANCH" ]]; then
  echo "Aborting: detached HEAD. Please checkout a branch before running this script."
  exit 1
fi

push_current_branch() {
  if [[ "$PUSH" != "1" ]]; then
    return 0
  fi

  if git rev-parse --abbrev-ref --symbolic-full-name "@{u}" >/dev/null 2>&1; then
    git push origin "$BRANCH"
  else
    git push -u origin "$BRANCH"
  fi
}

if ! git diff --cached --quiet; then
  echo "Aborting: you have staged changes already. Please unstage them first (or commit them) before running this script."
  exit 1
fi

SCREENS_DIR="src/screens"
if [[ ! -d "$SCREENS_DIR" ]]; then
  echo "Aborting: $SCREENS_DIR not found."
  exit 1
fi

mapfile -t SCREEN_FILES < <(ls -1 "$SCREENS_DIR"/*.js 2>/dev/null | sort || true)

if [[ ${#SCREEN_FILES[@]} -eq 0 ]]; then
  echo "Aborting: no .js screen files found under $SCREENS_DIR."
  exit 1
fi

TOTAL_STEPS=$(( ${#SCREEN_FILES[@]} + 1 ))

for (( step=0; step<TOTAL_STEPS; step++ )); do
  if [[ $step -lt ${#SCREEN_FILES[@]} ]]; then
    TARGET="${SCREEN_FILES[$step]}"
    LABEL="src/screens/$(basename "$TARGET")"
  else
    TARGET="src"
    LABEL="src (remaining)"
  fi

  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Step $((step+1))/$TOTAL_STEPS: $LABEL"

  if [[ -n "$(git status --porcelain -- "$TARGET")" ]]; then
    git add -- "$TARGET"
    if git diff --cached --quiet -- "$TARGET"; then
      echo "No staged changes for $LABEL after git add; skipping commit."
    else
      if [[ "$TARGET" == "src" ]]; then
        git commit -m "chore(src): commit remaining source changes"
      else
        git commit -m "chore(screens): update $(basename "$TARGET")"
      fi

      echo "Pushing to origin/$BRANCH..."
      push_current_branch
    fi
  else
    echo "No changes detected for $LABEL; skipping commit."
  fi

  if [[ $step -lt $((TOTAL_STEPS - 1)) ]]; then
    echo "Sleeping for ${INTERVAL_MINUTES} minutes..."
    sleep "$INTERVAL_SECONDS"
  fi

done

echo "Done." 
