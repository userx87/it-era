#!/bin/bash

# Script per esportare le conversazioni dal KV storage di Cloudflare
# Uso: ./export-conversations.sh

NAMESPACE_ID="988273308c524f4191ab95ed641dc05b"
OUTPUT_DIR="./exported-conversations"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "📥 Esportazione conversazioni IT-ERA Chatbot..."
echo "Namespace: $NAMESPACE_ID"
echo ""

# Crea directory output
mkdir -p "$OUTPUT_DIR"

# Lista tutte le chiavi
echo "1️⃣ Recupero lista sessioni..."
wrangler kv:key list --namespace-id "$NAMESPACE_ID" > "$OUTPUT_DIR/keys_$TIMESTAMP.json"

# Estrai le chiavi dal JSON
KEYS=$(cat "$OUTPUT_DIR/keys_$TIMESTAMP.json" | jq -r '.[].name')

if [ -z "$KEYS" ]; then
    echo "❌ Nessuna conversazione trovata"
    exit 0
fi

# Conta le conversazioni
COUNT=$(echo "$KEYS" | wc -l)
echo "✅ Trovate $COUNT conversazioni"
echo ""

# Esporta ogni conversazione
echo "2️⃣ Esportazione conversazioni..."
for KEY in $KEYS; do
    echo "   Esportando: $KEY"
    wrangler kv:key get "$KEY" --namespace-id "$NAMESPACE_ID" > "$OUTPUT_DIR/$KEY.json"
done

echo ""
echo "3️⃣ Creazione report consolidato..."

# Crea report consolidato
cat > "$OUTPUT_DIR/report_$TIMESTAMP.md" << EOF
# IT-ERA Chatbot - Export Conversazioni
**Data Export**: $(date)
**Totale Conversazioni**: $COUNT

## Conversazioni Esportate:
EOF

for KEY in $KEYS; do
    echo "- $KEY" >> "$OUTPUT_DIR/report_$TIMESTAMP.md"
done

echo ""
echo "✅ Export completato!"
echo "📁 File salvati in: $OUTPUT_DIR"
echo ""
echo "File generati:"
echo "  - keys_$TIMESTAMP.json (lista chiavi)"
echo "  - [session_id].json (conversazioni)"
echo "  - report_$TIMESTAMP.md (report)"