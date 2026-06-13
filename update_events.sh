#!/bin/bash
set -e

echo "🔄 Fetching and transforming events..."
cd public
python3 transform.py
cd ..

echo "📦 Committing..."
git add .
git commit -m "updated events"

echo "🚀 Pushing..."
git push

echo "✅ Done!"
