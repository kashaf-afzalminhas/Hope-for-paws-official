#!/usr/bin/env bash
# Build a Lambda-ready zip for direct upload in the AWS Console.
# Usage: from backend/ run:  bash scripts/pack-lambda.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAGING="$ROOT/.lambda-pack"
OUT_ZIP="$ROOT/hopeforpaws-lambda.zip"
NODE_VERSION_REQUIRED=18

cd "$ROOT"

echo "==> Cleaning previous pack"
rm -rf "$STAGING" "$OUT_ZIP"
mkdir -p "$STAGING"

echo "==> Copying application source"
# Core entrypoints
cp -R app.js lambda.js package.json package-lock.json "$STAGING/"

# App directories required at runtime
for dir in config controllers middleware models queues routes services validators; do
  if [ -d "$ROOT/$dir" ]; then
    cp -R "$ROOT/$dir" "$STAGING/"
  fi
done

# Optional runtime assets (empty placeholder dirs ok)
mkdir -p "$STAGING/uploads/profile-images"
# Do NOT copy existing uploaded images (too large / not for Lambda)

echo "==> Installing production dependencies only"
cd "$STAGING"
npm ci --omit=dev --no-audit --no-fund

# Remove junk that bloats the zip
echo "==> Pruning unnecessary files from node_modules"
find node_modules -type d \( -name 'test' -o -name 'tests' -o -name '__tests__' -o -name 'docs' -o -name 'example' -o -name 'examples' -o -name '.github' \) -prune -exec rm -rf {} + 2>/dev/null || true
find node_modules -type f \( -name '*.md' -o -name '*.ts' -o -name '*.map' -o -name 'LICENSE*' -o -name 'CHANGELOG*' \) -delete 2>/dev/null || true

# Drop packages not needed on Lambda runtime path (lazy-loaded only for local Socket.IO)
echo "==> Removing local-only packages from Lambda package"
npm uninstall socket.io --omit=dev --no-save 2>/dev/null || rm -rf node_modules/socket.io node_modules/socket.io-adapter node_modules/socket.io-parser node_modules/engine.io node_modules/engine.io-parser 2>/dev/null || true
rm -rf node_modules/chart.js 2>/dev/null || true

echo "==> Creating zip (files at archive ROOT — required for Lambda)"
# IMPORTANT: zip from inside staging so handler path is lambda.handler not staging/lambda.handler
cd "$STAGING"
zip -rq "$OUT_ZIP" . \
  -x "*.git*" \
  -x "*DS_Store*" \
  -x "*.env*" \
  -x "*/.bin/*"

ZIP_SIZE=$(du -h "$OUT_ZIP" | awk '{print $1}')
UNZIP_SIZE=$(du -sh "$STAGING" | awk '{print $1}')

echo ""
echo "============================================"
echo " Lambda zip ready"
echo "============================================"
echo " File:     $OUT_ZIP"
echo " Zip size: $ZIP_SIZE  (Console direct upload limit: 50 MB)"
echo " Unzipped: ~$UNZIP_SIZE (limit: 250 MB)"
echo ""
echo " AWS Console settings:"
echo "   Runtime : Node.js 20.x"
echo "   Handler : lambda.handler"
echo "   Arch    : x86_64"
echo "   Timeout : 29 sec"
echo "   Memory  : 1024 MB+"
echo ""
echo " Required environment variables:"
echo "   RUNTIME=lambda"
echo "   NODE_ENV=production"
echo "   MONGO_URI=..."
echo "   JWT_SECRET=..."
echo "   CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET"
echo "   GMAIL_USER / GMAIL_PASS"
echo "   Chatbot_key / AI_MODEL"
echo "   stripe_secret_key / stripe_publishable_key   (if used)"
echo "============================================"

# Fail loudly if over console upload limit
ZIP_BYTES=$(wc -c < "$OUT_ZIP" | tr -d ' ')
if [ "$ZIP_BYTES" -gt 52428800 ]; then
  echo "WARNING: Zip exceeds 50 MB. Use S3 upload for the function code instead of direct console upload."
  echo "  aws s3 cp \"$OUT_ZIP\" s3://YOUR_BUCKET/hopeforpaws-lambda.zip"
  echo "  Then set Lambda code from that S3 object."
fi

# Quick structural check (Python avoids shell pipefail/SIGPIPE false negatives)
python3 - <<PY
import zipfile, sys
z = zipfile.ZipFile(r"""$OUT_ZIP""")
names = set(z.namelist())
required = ["lambda.js", "app.js", "package.json"]
missing = [r for r in required if r not in names]
if missing:
    print("ERROR: missing from zip root:", ", ".join(missing))
    sys.exit(1)
if not any(n.startswith("node_modules/serverless-http/") for n in names):
    print("ERROR: serverless-http missing from zip")
    sys.exit(1)
print("Structure check: OK (lambda.js, app.js, serverless-http present at zip root)")
PY

# Smoke-load handler from staging (same layout as zip)
echo "==> Smoke test: require handler"
cd "$STAGING"
RUNTIME=lambda AWS_LAMBDA_FUNCTION_NAME=local-smoke node -e "
  process.env.RUNTIME = 'lambda';
  process.env.AWS_LAMBDA_FUNCTION_NAME = 'local-smoke';
  delete process.env.MONGO_URI; // avoid connecting during require smoke test
  const mod = require('./lambda');
  if (typeof mod.handler !== 'function') {
    console.error('handler is not a function');
    process.exit(1);
  }
  console.log('handler export OK');
  process.exit(0);
"

echo ""
echo "DONE. Upload file:"
echo "  $OUT_ZIP"
