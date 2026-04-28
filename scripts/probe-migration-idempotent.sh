#!/usr/bin/env bash
set -euo pipefail
bun db:migrate
OUTPUT=$(bun db:migrate 2>&1)
if echo "$OUTPUT" | grep -qE "already applied|0 migrations to apply|nothing to migrate"; then
  echo "PASS: migration is idempotent"
  exit 0
fi
echo "FAIL: second migration run produced unexpected output:"
echo "$OUTPUT"
exit 1
