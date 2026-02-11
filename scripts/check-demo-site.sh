#!/usr/bin/env bash

set -euo pipefail

ROOT_URL="${1:-https://react-form-autosave.onrender.com}"
ROOT_URL="${ROOT_URL%/}"

tmp_dir="$(mktemp -d)"
html_file="$tmp_dir/index.html"
docs_html_file="$tmp_dir/docs.html"
asset_file="$tmp_dir/app.js"

cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

echo "Running smoke check for: $ROOT_URL"

success=0
for attempt in {1..12}; do
  if curl -fsSL --max-time 20 "$ROOT_URL" -o "$html_file"; then
    success=1
    break
  fi
  echo "Attempt $attempt/12 failed, retrying in 10s..."
  sleep 10
done

if [[ "$success" -ne 1 ]]; then
  echo "Could not fetch demo HTML after retries."
  exit 1
fi

if ! grep -q "<title>react-form-autosave Demo Playground</title>" "$html_file"; then
  echo "Unexpected title in demo HTML."
  exit 1
fi

if ! curl -fsSL --max-time 20 "$ROOT_URL/docs" -o "$docs_html_file"; then
  echo "Could not fetch /docs route."
  exit 1
fi

if ! grep -q "<title>react-form-autosave Demo Playground</title>" "$docs_html_file"; then
  echo "Unexpected title in /docs HTML."
  exit 1
fi

asset_path="$(grep -oE 'src="/assets/[^"]+\.js"' "$html_file" | head -n 1 | sed -E 's/src="([^"]+)"/\1/')"
if [[ -z "${asset_path:-}" ]]; then
  echo "Could not find JavaScript asset path in HTML."
  exit 1
fi

asset_url="${ROOT_URL}${asset_path}"
curl -fsSL --max-time 20 "$asset_url" -o "$asset_file"

if ! grep -q "react-form-autosave" "$asset_file"; then
  echo "JavaScript asset does not contain expected package markers."
  exit 1
fi

if ! grep -q "/docs" "$asset_file"; then
  echo "JavaScript asset does not include dedicated docs routing."
  exit 1
fi

echo "Smoke check passed. Asset: $asset_path"
