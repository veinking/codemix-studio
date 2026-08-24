#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "bIDE iOS builds require macOS with Xcode installed." >&2
  exit 1
fi

for command in xcodebuild xcrun zip unzip ditto; do
  if ! command -v "${command}" >/dev/null 2>&1; then
    echo "Missing required command: ${command}" >&2
    exit 1
  fi
done

if ! command -v xcodegen >/dev/null 2>&1; then
  echo "XcodeGen is required. Install it with: brew install xcodegen" >&2
  exit 1
fi

DERIVED_DATA_PATH="${ROOT_DIR}/build/BideDeviceDerivedData"
OUTPUT_DIR="${ROOT_DIR}/build/BideSideloadlyOutput"
LOG_DIR="${ROOT_DIR}/build/BideSideloadlyLogs"
IPA_PATH="${ROOT_DIR}/build/bIDE-Sideloadly.ipa"

rm -rf "${DERIVED_DATA_PATH}" "${OUTPUT_DIR}" "${IPA_PATH}"
mkdir -p "${LOG_DIR}"

echo "==> Generating bIDE Xcode project"
(
  cd ios
  xcodegen generate
) 2>&1 | tee "${LOG_DIR}/xcodegen.log"

test -d ios/bIDE.xcodeproj

echo "==> Building unsigned arm64 bIDE app"
set -o pipefail
xcodebuild \
  -project ios/bIDE.xcodeproj \
  -scheme bIDE \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -derivedDataPath "${DERIVED_DATA_PATH}" \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGN_IDENTITY='' \
  DEVELOPMENT_TEAM='' \
  build 2>&1 | tee "${LOG_DIR}/xcodebuild.log"

APP_PATH="$(find "${DERIVED_DATA_PATH}/Build/Products/Release-iphoneos" -maxdepth 1 -name 'bIDE.app' -print -quit)"
if [[ -z "${APP_PATH}" || ! -d "${APP_PATH}" ]]; then
  echo "bIDE.app was not produced for iphoneos." >&2
  exit 1
fi

EXECUTABLE_NAME="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleExecutable' "${APP_PATH}/Info.plist")"
BUNDLE_ID="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "${APP_PATH}/Info.plist")"
SUPPORTED_PLATFORM="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleSupportedPlatforms:0' "${APP_PATH}/Info.plist")"
EXECUTABLE_PATH="${APP_PATH}/${EXECUTABLE_NAME}"

test -x "${EXECUTABLE_PATH}"
[[ "${SUPPORTED_PLATFORM}" == "iPhoneOS" ]]
ARCHITECTURES="$(xcrun lipo -archs "${EXECUTABLE_PATH}")"
echo "${ARCHITECTURES}" | tee "${LOG_DIR}/architectures.log"
echo "${ARCHITECTURES}" | grep -qw arm64

{
  echo "Bundle ID: ${BUNDLE_ID}"
  echo "Platform: ${SUPPORTED_PLATFORM}"
  echo "Architectures: ${ARCHITECTURES}"
  echo "Device families: iPhone + iPad"
  echo "Code signing: disabled for Sideloadly packaging"
  echo "SQL execution: native SQLite enabled in Phase 2"
  echo "Python/R execution: intentionally deferred beyond Phase 2"
} | tee "${LOG_DIR}/app-bundle-verification.txt"

rm -rf "${APP_PATH}/_CodeSignature" "${APP_PATH}/embedded.mobileprovision"
mkdir -p "${OUTPUT_DIR}/Payload"
ditto "${APP_PATH}" "${OUTPUT_DIR}/Payload/bIDE.app"
(
  cd "${OUTPUT_DIR}"
  /usr/bin/zip -qry "${IPA_PATH}" Payload
)
unzip -t "${IPA_PATH}" | tee "${LOG_DIR}/ipa-integrity.log"

cat <<EOF

bIDE Sideloadly package is ready.

IPA:
  ${IPA_PATH}

Bundle ID:
  ${BUNDLE_ID}

Build logs:
  ${LOG_DIR}
EOF
