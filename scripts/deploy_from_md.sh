#!/usr/bin/env bash
set -euo pipefail

# === Step 0 — Carica istruzioni dal file ===
if [[ ! -f api/deploy_claudeflare.md ]]; then
  echo "ERRORE: file mancante: api/deploy_claudeflare.md" >&2
  exit 1
fi

# === Step 1 — Preflight produzione ===
PROD_DIR="web/pages"
DRAFT_DIR="web/pages-draft"
SITEMAP="web/sitemap.xml"
REPORT_DIR="web/reports"
mkdir -p "${REPORT_DIR}"

COUNT_PROD=$(find "${PROD_DIR}" -maxdepth 1 -type f -name '*.html' | wc -l | tr -d ' ')
if [[ "${COUNT_PROD}" -lt 500 ]]; then
  echo "ERRORE: troppe poche pagine in produzione (${COUNT_PROD}). Interrompo." >&2
  exit 1
fi

if [[ ! -s "${SITEMAP}" ]]; then
  echo "ERRORE: sitemap non trovata o vuota (${SITEMAP}). Interrompo." >&2
  exit 1
fi

# === Step 2 — Parametri Cloudflare (ENV o file) ===
PROJECT_NAME="${PROJECT_NAME:-$( [[ -f api/project_name.txt ]] && cat api/project_name.txt || echo it-era )}"
CF_ACCOUNT_ID="${CF_ACCOUNT_ID:-$( [[ -f api/cf_account_id.txt ]] && cat api/cf_account_id.txt || echo "" )}"
CF_API_TOKEN="${CF_API_TOKEN:-$( [[ -f api/cf_api_token.txt ]] && cat api/cf_api_token.txt || echo "" )}"

# === Step 3 — Wrangler: install & check ===
if ! command -v wrangler >/dev/null 2>&1; then
  echo "Wrangler non trovato: provo installazione globale (npm -g wrangler)"
  npm i -g wrangler >/dev/null 2>&1 || true
fi
HAS_WRANGLER="no"
if command -v wrangler >/dev/null 2>&1; then HAS_WRANGLER="yes"; fi

# === Step 4 — Deploy via Wrangler (se possibile) ===
DEPLOY_STATUS="skipped"
DEPLOY_MSG="wrangler non disponibile o credenziali mancanti; preparo fallback."
if [[ "${HAS_WRANGLER}" == "yes" && -n "${CF_ACCOUNT_ID}" && -n "${CF_API_TOKEN}" ]]; then
  export CLOUDFLARE_ACCOUNT_ID="${CF_ACCOUNT_ID}"
  export CLOUDFLARE_API_TOKEN="${CF_API_TOKEN}"
  echo "Wrangler OK. Account=${CLOUDFLARE_ACCOUNT_ID} Project=${PROJECT_NAME}"
  # Tenta creazione progetto se non esiste (idempotente)
  wrangler pages project create "${PROJECT_NAME}" --production-branch=main >/dev/null 2>&1 || true
  # Se esiste directory functions, la usa; altrimenti deploy statico puro
  FUNCTIONS_FLAG=""
  [[ -d "./functions" ]] && FUNCTIONS_FLAG="--functions=./functions"
  set +e
  wrangler pages deploy ./web --project-name="${PROJECT_NAME}" --branch=main ${FUNCTIONS_FLAG}
  RC=$?
  set -e
  if [[ $RC -eq 0 ]]; then
    DEPLOY_STATUS="success"
    DEPLOY_MSG="Deploy completato via Wrangler (Cloudflare Pages)."
  else
    DEPLOY_STATUS="warning"
    DEPLOY_MSG="Wrangler eseguito ma ha restituito codice ${RC}. Preparo fallback e istruzioni."
  fi
fi

# === Step 5 — Fallback: zip per upload manuale + riporto MD ===
TS_STAMP=$(date +%Y%m%d-%H%M%S)
ZIP_PATH="web/reports/it-era-static-${TS_STAMP}.zip"
(
  cd web
  zip -qr "../${ZIP_PATH}" .
)
MD_SUMMARY_PATH="web/reports/deploy_md_summary.txt"
awk 'NR<=4000 {print}' api/deploy_claudeflare.md > "${MD_SUMMARY_PATH}"

# === Step 6 — URL di verifica (sample) ===
SAMPLE_URLS=$(printf '%s\n%s\n%s\n%s\n%s\n' \
  "https://it-era.pages.dev/pages/assistenza-it-lecco.html" \
  "https://it-era.pages.dev/pages/assistenza-it-milano.html" \
  "https://it-era.pages.dev/pages/sicurezza-informatica-lecco.html" \
  "https://it-era.pages.dev/pages/cloud-storage-lecco.html" \
  "https://it-era.pages.dev/sitemap.xml")
# Build JSON array for sample URLs without relying on ${var@Q} (not available on old bash)
SAMPLE_JSON=$(printf '%s\n' "${SAMPLE_URLS}" | sed 's/"/\\"/g; s/.*/"&"/' | paste -sd, -)

# === Step 7 — Report finale ===
if command -v sha1sum >/dev/null 2>&1; then
  SITEMAP_SHA1=$(sha1sum "${SITEMAP}" | awk '{print $1}')
else
  SITEMAP_SHA1=$(shasum "${SITEMAP}" | awk '{print $1}')
fi
TS=$(date -Iseconds)
REPORT_JSON="${REPORT_DIR}/wrangler_deploy_report.json"
cat > "${REPORT_JSON}" <<JSON
{
  "timestamp": "${TS}",
  "project_name": "${PROJECT_NAME}",
  "prod_pages_count": ${COUNT_PROD},
  "sitemap": "${SITEMAP}",
  "sitemap_sha1": "${SITEMAP_SHA1}",
  "wrangler_available": "${HAS_WRANGLER}",
  "deploy_status": "${DEPLOY_STATUS}",
  "message": "${DEPLOY_MSG}",
  "zip_fallback": "${ZIP_PATH}",
  "md_summary": "${MD_SUMMARY_PATH}",
  "sample_urls": [${SAMPLE_JSON}]
}
JSON

# === Step 8 — Console summary ===
echo "=== DEPLOY SUMMARY ==="
echo "Project: ${PROJECT_NAME}"
echo "Prod pages: ${COUNT_PROD}"
echo "Sitemap: ${SITEMAP} (sha1: ${SITEMAP_SHA1})"
echo "Wrangler: ${HAS_WRANGLER}"
echo "Deploy status: ${DEPLOY_STATUS} — ${DEPLOY_MSG}"
echo "Fallback ZIP: ${ZIP_PATH}"
echo "MD summary: ${MD_SUMMARY_PATH}"
echo "Sample URLs:"
echo "${SAMPLE_URLS}"
