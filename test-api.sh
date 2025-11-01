#!/bin/bash

# API Testing Script
# Tests all API endpoints to verify error handling and functionality

echo "🧪 Starting API Endpoint Tests..."
echo "=================================="
echo ""

BASE_URL="http://localhost:3000"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5
    
    echo -n "Testing: $name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (Status: $status_code)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $status_code)"
        echo "Response: $body"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo "1. Health Check Endpoint"
echo "------------------------"
test_endpoint "Health Check" "GET" "/api/health" "" "200"
echo ""

echo "2. Metrics Endpoint"
echo "-------------------"
test_endpoint "Metrics" "GET" "/api/metrics" "" "200"
echo ""

echo "3. Test Endpoint"
echo "----------------"
test_endpoint "Test Endpoint" "GET" "/api/test" "" "200"
echo ""

echo "4. Heavy Processing - GET"
echo "-------------------------"
test_endpoint "Heavy Processing GET" "GET" "/api/heavy-processing" "" "200"
echo ""

echo "5. Heavy Processing - POST (Valid)"
echo "-----------------------------------"
test_endpoint "Heavy POST - Light" "POST" "/api/heavy-processing" \
    '{"iterations": 100, "complexity": "light"}' "200"
test_endpoint "Heavy POST - Medium" "POST" "/api/heavy-processing" \
    '{"iterations": 1000, "complexity": "medium"}' "200"
test_endpoint "Heavy POST - Heavy" "POST" "/api/heavy-processing" \
    '{"iterations": 500, "complexity": "heavy"}' "200"
echo ""

echo "6. Heavy Processing - POST (Invalid Input)"
echo "-------------------------------------------"
test_endpoint "Invalid JSON" "POST" "/api/heavy-processing" \
    'invalid json' "400"
test_endpoint "Invalid Complexity" "POST" "/api/heavy-processing" \
    '{"iterations": 100, "complexity": "invalid"}' "400"
test_endpoint "Negative Iterations" "POST" "/api/heavy-processing" \
    '{"iterations": -100, "complexity": "light"}' "400"
echo ""

echo "7. Error Handling"
echo "-----------------"
test_endpoint "404 Not Found" "GET" "/api/nonexistent" "" "404"
echo ""

echo "=================================="
echo "📊 Test Results Summary"
echo "=================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
