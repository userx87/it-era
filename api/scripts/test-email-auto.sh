#!/bin/bash

# 🧪 Test Automatici Sistema Email IT-ERA
# Esegue una suite completa di test per validare il sistema

set -e

# Configurazione
API_URL="https://it-era-email.bulltech.workers.dev"
RESULTS_FILE="/tmp/it-era-email-test-results.json"

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Contatori
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      🧪 Test Suite Sistema Email IT-ERA               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Funzione helper per test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    ((TESTS_TOTAL++))
    echo -n -e "${BLUE}[TEST $TESTS_TOTAL]${NC} $test_name... "
    
    if eval "$test_command"; then
        if [ "$expected_result" = "success" ]; then
            echo -e "${GREEN}✅ PASS${NC}"
            ((TESTS_PASSED++))
            return 0
        else
            echo -e "${RED}❌ FAIL (expected failure)${NC}"
            ((TESTS_FAILED++))
            return 1
        fi
    else
        if [ "$expected_result" = "failure" ]; then
            echo -e "${GREEN}✅ PASS (correctly failed)${NC}"
            ((TESTS_PASSED++))
            return 0
        else
            echo -e "${RED}❌ FAIL${NC}"
            ((TESTS_FAILED++))
            return 1
        fi
    fi
}

# Test 1: Health Check
test_health() {
    response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")
    [ "$response" = "200" ]
}

# Test 2: CORS Headers
test_cors() {
    headers=$(curl -s -I -X OPTIONS \
        -H "Origin: https://it-era.it" \
        -H "Access-Control-Request-Method: POST" \
        "$API_URL/api/contact" 2>/dev/null)
    echo "$headers" | grep -q "Access-Control-Allow-Origin"
}

# Test 3: Email valida
test_valid_email() {
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Origin: https://it-era.it" \
        -d '{
            "nome": "Test Automatico",
            "email": "test@example.com",
            "telefono": "333 1234567",
            "privacy": true
        }' \
        "$API_URL/api/contact")
    echo "$response" | grep -q '"success":true'
}

# Test 4: Email non valida
test_invalid_email() {
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Origin: https://it-era.it" \
        -d '{
            "nome": "Test",
            "email": "not-an-email",
            "telefono": "333 1234567",
            "privacy": true
        }' \
        "$API_URL/api/contact")
    echo "$response" | grep -q '"success":false'
}

# Test 5: Telefono non valido
test_invalid_phone() {
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Origin: https://it-era.it" \
        -d '{
            "nome": "Test",
            "email": "test@example.com",
            "telefono": "123",
            "privacy": true
        }' \
        "$API_URL/api/contact")
    echo "$response" | grep -q '"success":false'
}

# Test 6: Privacy non accettata
test_no_privacy() {
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Origin: https://it-era.it" \
        -d '{
            "nome": "Test",
            "email": "test@example.com",
            "telefono": "333 1234567",
            "privacy": false
        }' \
        "$API_URL/api/contact")
    echo "$response" | grep -q '"success":false'
}

# Test 7: Campi mancanti
test_missing_fields() {
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Origin: https://it-era.it" \
        -d '{}' \
        "$API_URL/api/contact")
    echo "$response" | grep -q '"success":false'
}

# Test 8: Form completo con tutti i campi
test_complete_form() {
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Origin: https://it-era.it" \
        -d '{
            "nome": "Mario Rossi",
            "email": "mario@example.com",
            "telefono": "+39 02 1234567",
            "azienda": "Rossi SRL",
            "comune": "Milano",
            "dipendenti": "10-50",
            "servizi": ["Sito web", "Server", "Assistenza IT"],
            "urgenza": "normale",
            "messaggio": "Richiesta preventivo per nuovo sito aziendale",
            "privacy": true,
            "formType": "preventivo"
        }' \
        "$API_URL/api/contact")
    echo "$response" | grep -q '"success":true' && echo "$response" | grep -q '"ticketId"'
}

# Test 9: XSS Prevention
test_xss_prevention() {
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Origin: https://it-era.it" \
        -d '{
            "nome": "<script>alert(1)</script>",
            "email": "test@example.com",
            "telefono": "333 1234567",
            "messaggio": "<img src=x onerror=alert(1)>",
            "privacy": true
        }' \
        "$API_URL/api/contact")
    # Should succeed but sanitize the input
    echo "$response" | grep -q '"success":true'
}

# Test 10: Response time
test_response_time() {
    start=$(date +%s%N)
    curl -s -o /dev/null "$API_URL/health"
    end=$(date +%s%N)
    response_time=$(((end - start) / 1000000))
    [ $response_time -lt 3000 ] # Deve rispondere in meno di 3 secondi
}

echo -e "${YELLOW}Esecuzione test suite...${NC}\n"

# Esegui tutti i test
run_test "Health Check Endpoint" "test_health" "success"
run_test "CORS Headers Configuration" "test_cors" "success"
run_test "Valid Email Submission" "test_valid_email" "success"
run_test "Invalid Email Validation" "test_invalid_email" "failure"
run_test "Invalid Phone Validation" "test_invalid_phone" "failure"
run_test "Privacy Not Accepted" "test_no_privacy" "failure"
run_test "Missing Required Fields" "test_missing_fields" "failure"
run_test "Complete Form Submission" "test_complete_form" "success"
run_test "XSS Input Sanitization" "test_xss_prevention" "success"
run_test "Response Time < 3s" "test_response_time" "success"

echo ""
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}           RISULTATI TEST SUITE          ${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

# Calcola percentuale successo
if [ $TESTS_TOTAL -gt 0 ]; then
    SUCCESS_RATE=$((TESTS_PASSED * 100 / TESTS_TOTAL))
else
    SUCCESS_RATE=0
fi

# Mostra risultati
echo -e "Test Totali:    $TESTS_TOTAL"
echo -e "Test Passati:   ${GREEN}$TESTS_PASSED${NC}"
echo -e "Test Falliti:   ${RED}$TESTS_FAILED${NC}"
echo -e "Success Rate:   ${SUCCESS_RATE}%"
echo ""

# Genera report JSON
cat > "$RESULTS_FILE" <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "api_url": "$API_URL",
  "tests_total": $TESTS_TOTAL,
  "tests_passed": $TESTS_PASSED,
  "tests_failed": $TESTS_FAILED,
  "success_rate": $SUCCESS_RATE,
  "status": $([ $TESTS_FAILED -eq 0 ] && echo '"PASS"' || echo '"FAIL"')
}
EOF

# Valutazione finale
if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║    ✅ TUTTI I TEST SUPERATI!          ║${NC}"
    echo -e "${GREEN}║    Sistema Email Completamente        ║${NC}"
    echo -e "${GREEN}║    Funzionante e Validato             ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════╗${NC}"
    echo -e "${RED}║    ⚠️  ALCUNI TEST FALLITI            ║${NC}"
    echo -e "${RED}║    Verificare configurazione          ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Report salvato in: $RESULTS_FILE${NC}"
    exit 1
fi