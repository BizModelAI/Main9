#!/bin/bash

echo "🧪 Testing Email Rate Limiting System"
echo "====================================="

# Test data
TEST_EMAIL="test@example.com"
QUIZ_DATA='{
  "mainMotivation": "financial-freedom",
  "weeklyTimeCommitment": 20,
  "successIncomeGoal": 5000,
  "techSkillsRating": 3,
  "riskComfortLevel": 4,
  "selfMotivationLevel": 5,
  "directCommunicationEnjoyment": 4,
  "creativeWorkEnjoyment": 3,
  "workStructurePreference": "flexible",
  "learningPreference": "hands-on",
  "firstIncomeTimeline": "3-6-months",
  "upfrontInvestment": 1000,
  "brandFaceComfort": 3,
  "longTermConsistency": 4,
  "trialErrorComfort": 4,
  "organizationLevel": 3,
  "uncertaintyHandling": 4,
  "workCollaborationPreference": "independent",
  "decisionMakingStyle": "data-driven",
  "familiarTools": ["social-media", "email"]
}'

REQUEST_BODY="{\"email\": \"$TEST_EMAIL\", \"quizData\": $QUIZ_DATA}"

echo ""
echo "📧 Test 1: Sending first email..."
RESPONSE1=$(curl -s -X POST http://localhost:5073/api/send-quiz-results \
  -H "Content-Type: application/json" \
  -d "$REQUEST_BODY" \
  -w "\nHTTP_CODE:%{http_code}")

HTTP_CODE1=$(echo "$RESPONSE1" | grep "HTTP_CODE:" | cut -d':' -f2)
RESPONSE_BODY1=$(echo "$RESPONSE1" | sed '/HTTP_CODE:/d')

echo "Status: $HTTP_CODE1"
echo "Response: $RESPONSE_BODY1"

if [ "$HTTP_CODE1" = "429" ]; then
  echo "✅ Rate limit working - first email blocked"
elif [ "$HTTP_CODE1" = "200" ]; then
  echo "✅ First email sent successfully"
else
  echo "❌ Unexpected response"
fi

echo ""
echo "📧 Test 2: Sending second email immediately..."
RESPONSE2=$(curl -s -X POST http://localhost:5073/api/send-quiz-results \
  -H "Content-Type: application/json" \
  -d "$REQUEST_BODY" \
  -w "\nHTTP_CODE:%{http_code}")

HTTP_CODE2=$(echo "$RESPONSE2" | grep "HTTP_CODE:" | cut -d':' -f2)
RESPONSE_BODY2=$(echo "$RESPONSE2" | sed '/HTTP_CODE:/d')

echo "Status: $HTTP_CODE2"
echo "Response: $RESPONSE_BODY2"

if [ "$HTTP_CODE2" = "429" ]; then
  echo "✅ Rate limit working - second email blocked"
  # Extract rate limit info if present
  REMAINING_TIME=$(echo "$RESPONSE_BODY2" | grep -o '"remainingTime":[0-9]*' | cut -d':' -f2)
  RATE_LIMIT_TYPE=$(echo "$RESPONSE_BODY2" | grep -o '"type":"[^"]*"' | cut -d'"' -f4)
  if [ ! -z "$REMAINING_TIME" ]; then
    echo "⏰ Rate limit info: $RATE_LIMIT_TYPE, ${REMAINING_TIME}s remaining"
  else
    echo "⚠️  Rate limit info not found in response"
  fi
else
  echo "❌ Rate limit not working - second email should be blocked"
fi

echo ""
echo "📧 Test 3: Waiting 2 seconds and trying again..."
sleep 2

RESPONSE3=$(curl -s -X POST http://localhost:5073/api/send-quiz-results \
  -H "Content-Type: application/json" \
  -d "$REQUEST_BODY" \
  -w "\nHTTP_CODE:%{http_code}")

HTTP_CODE3=$(echo "$RESPONSE3" | grep "HTTP_CODE:" | cut -d':' -f2)
RESPONSE_BODY3=$(echo "$RESPONSE3" | sed '/HTTP_CODE:/d')

echo "Status: $HTTP_CODE3"
echo "Response: $RESPONSE_BODY3"

if [ "$HTTP_CODE3" = "429" ]; then
  echo "✅ Rate limit still active"
  REMAINING_TIME=$(echo "$RESPONSE_BODY3" | grep -o '"remainingTime":[0-9]*' | cut -d':' -f2)
  RATE_LIMIT_TYPE=$(echo "$RESPONSE_BODY3" | grep -o '"type":"[^"]*"' | cut -d'"' -f4)
  if [ ! -z "$REMAINING_TIME" ]; then
    echo "⏰ Rate limit info: $RATE_LIMIT_TYPE, ${REMAINING_TIME}s remaining"
  else
    echo "⚠️  Rate limit info not found in response"
  fi
elif [ "$HTTP_CODE3" = "200" ]; then
  echo "✅ Rate limit expired - email sent successfully"
else
  echo "❌ Unexpected response"
fi

echo ""
echo "�� Test completed!" 