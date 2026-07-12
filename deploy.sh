#!/usr/bin/env bash
# Build the site and publish it to the gh-pages branch of the (public) portfolio
# repo, which GitHub Pages serves at https://vishal171104.github.io/portfolio/.
# The gh-pages branch is an orphan holding only built output, so it stays tiny
# and never carries the main branch's history.
# Usage: ./deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

npm run build
touch dist/.nojekyll

cd dist
rm -rf .git
git init -q -b gh-pages
git add -A
git commit -q -m "Deploy $(date '+%Y-%m-%d %H:%M')"
git push -f https://github.com/vishal171104/portfolio.git gh-pages
echo "Deployed → https://vishal171104.github.io/portfolio/"
