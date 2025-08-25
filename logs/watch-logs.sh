#!/bin/bash

# Real-time log watcher for IT-ERA chatbot
echo "👁️  Watching IT-ERA chatbot logs in real-time..."
echo "📂 Log file: /Users/andreapanzeri/progetti/IT-ERA/logs/conversation-monitor.log"
echo "⌨️  Press Ctrl+C to stop"
echo "==========================================="

# Watch the log file
tail -f /Users/andreapanzeri/progetti/IT-ERA/logs/conversation-monitor.log 2>/dev/null || echo "Log file not found yet, waiting..."