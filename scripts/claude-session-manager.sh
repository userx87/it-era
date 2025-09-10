#!/bin/bash

# IT-ERA Session Manager con Auto-Save
# Salva automaticamente tutto quello che facciamo

PROJECT="it-era"
SESSION_ID="session-$(date +%Y%m%d-%H%M%S)"
MEMORY_DIR="$HOME/.claude/memory/$PROJECT"

# Crea directory se non esiste
mkdir -p "$MEMORY_DIR"

# Funzione per salvare in memoria
save_memory() {
    local key="$1"
    local value="$2"
    local namespace="${3:-auto}"
    
    npx claude-flow@alpha memory store "${namespace}/${PROJECT}/${key}" "$value"
    echo "[$(date '+%H:%M:%S')] Saved: $key" >> "$MEMORY_DIR/session.log"
}

# Inizializza sessione
echo "🚀 Starting IT-ERA Session: $SESSION_ID"
save_memory "session/start/$SESSION_ID" "$(date)"

# Salva stato Git iniziale
GIT_STATUS=$(git status --short)
save_memory "git/initial/$SESSION_ID" "$GIT_STATUS"

# Hook per intercettare modifiche (usando fswatch su macOS)
if command -v fswatch &> /dev/null; then
    echo "📁 Monitoring file changes..."
    
    fswatch -r . --exclude .git --exclude node_modules | while read file; do
        save_memory "file/changed/$(date +%s)" "$file"
    done &
    FSWATCH_PID=$!
fi

# Salva ogni comando eseguito
export PROMPT_COMMAND='save_memory "cmd/$(date +%s)" "$BASH_COMMAND" "commands"'

# Cleanup on exit
trap cleanup EXIT

cleanup() {
    echo "💾 Saving session summary..."
    
    # Salva stato Git finale
    GIT_DIFF=$(git diff --stat)
    save_memory "git/final/$SESSION_ID" "$GIT_DIFF"
    
    # Salva riassunto sessione
    SUMMARY=$(cat <<EOF
{
  "session_id": "$SESSION_ID",
  "start": "$SESSION_START",
  "end": "$(date)",
  "files_changed": $(git diff --name-only | wc -l),
  "commands_run": $(grep "cmd/" "$MEMORY_DIR/session.log" | wc -l)
}
EOF
)
    save_memory "session/summary/$SESSION_ID" "$SUMMARY"
    
    # Kill fswatch if running
    [ ! -z "$FSWATCH_PID" ] && kill $FSWATCH_PID
    
    echo "✅ Session saved to memory"
}

# Menu interattivo
while true; do
    echo ""
    echo "=== IT-ERA Session Manager ==="
    echo "1) Save current state to memory"
    echo "2) Save decision/note"
    echo "3) View recent changes"
    echo "4) Create checkpoint"
    echo "5) Exit"
    echo -n "Choose: "
    
    read choice
    
    case $choice in
        1)
            echo -n "Enter description: "
            read desc
            save_memory "state/$(date +%s)" "$desc" "manual"
            ;;
        2)
            echo -n "Enter decision/note: "
            read note
            save_memory "note/$(date +%s)" "$note" "notes"
            ;;
        3)
            npx claude-flow@alpha memory search "$PROJECT" --limit 10
            ;;
        4)
            CHECKPOINT="checkpoint-$(date +%s)"
            git stash save "$CHECKPOINT"
            save_memory "checkpoint/$CHECKPOINT" "Git stash created"
            ;;
        5)
            exit 0
            ;;
    esac
done