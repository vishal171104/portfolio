#!/usr/bin/env bash
# Build the site and publish it to the vishal171104.github.io user page.
# Usage: ./deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

npm run build
touch dist/.nojekyll

cd dist
rm -rf .git
git init -q -b main
git add -A
git commit -q -m "Deploy $(date '+%Y-%m-%d %H:%M')"
git push -f https://github.com/vishal171104/vishal171104.github.io.git main
echo "Deployed → https://vishal171104.github.io/"
