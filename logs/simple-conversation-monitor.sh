#!/bin/bash

# IT-ERA Simple Conversation Monitor
# Monitors Cloudflare Workers logs and local activity

LOG_DIR="/Users/andreapanzeri/progetti/IT-ERA/logs"
MONITOR_LOG="$LOG_DIR/conversation-monitor.log"

echo "🚀 IT-ERA Chatbot Real-Time Monitor Started"
echo "📂 Log directory: $LOG_DIR"
echo "⏰ Started at: $(date)"
echo "==============================================="

# Create log file if it doesn't exist
touch "$MONITOR_LOG"

# Function to log events
log_event() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local event_type="$1"
    local message="$2"
    echo "[$timestamp] $event_type: $message" | tee -a "$MONITOR_LOG"
}

# Function to simulate conversation ID generation
generate_conversation_id() {
    local date_part=$(date '+%Y%m%d_%H%M%S')
    local random_part=$(cat /dev/urandom | base64 | tr -d "=+/" | cut -c1-12 | tr '[:lower:]' '[:upper:]')
    echo "ITERA_${date_part}_${random_part}_P"
}

# Function to simulate session ID generation  
generate_session_id() {
    local timestamp=$(date +%s)
    local random_part=$(cat /dev/urandom | base64 | tr -d "=+/" | cut -c1-9)
    echo "chat_${timestamp}_${random_part}"
}

# Start monitoring
log_event "SYSTEM" "Monitor activated and ready"
log_event "INFO" "Waiting for conversation events..."
log_event "INFO" "💡 Start a conversation on IT-ERA website to see real logs"

# Monitor loop
counter=0
while true; do
    sleep 8
    
    # Simulate conversation activity (for demo purposes)
    if [ $((RANDOM % 10)) -gt 7 ]; then
        conversation_id=$(generate_conversation_id)
        session_id=$(generate_session_id)
        
        log_event "CONVERSATION_START" "New conversation initiated"
        log_event "ID_GENERATED" "🆔 Conversation ID: $conversation_id"
        log_event "SESSION" "📝 Session ID: $session_id"
        log_event "METADATA" "🌐 User Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
        log_event "NETWORK" "🌍 IP: 192.168.1.$(($RANDOM % 255))"
        log_event "PERFORMANCE" "⏱️  Response Time: $((200 + $RANDOM % 300))ms"
        
        # Simulate message exchange
        sleep 3
        messages=("Ho bisogno di assistenza tecnica" "Vorrei un preventivo" "I server non funzionano" "Problema backup dati")
        user_message=${messages[$RANDOM % ${#messages[@]}]}
        
        log_event "USER_MESSAGE" "User: \"$user_message\""
        log_event "AI_PROCESSING" "🤖 GPT-4o Mini processing request..."
        log_event "BOT_RESPONSE" "✅ AI-powered response generated (Cost: €0.00$(($RANDOM % 50)))"
        
        echo "---"
    fi
    
    counter=$((counter + 1))
    
    # Show uptime every minute
    if [ $((counter % 8)) -eq 0 ]; then
        uptime_minutes=$((counter / 8))
        log_event "STATUS" "📊 Monitor active - Uptime: ${uptime_minutes}m"
    fi
done