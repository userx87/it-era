#!/usr/bin/env node
/**
 * IT-ERA Chatbot Real-Time Log Monitor
 * Monitors conversation starts and ID generation in real-time
 */

const fs = require('fs');
const path = require('path');

class ChatbotRealTimeMonitor {
    constructor() {
        this.logFile = path.join(__dirname, 'conversation-logs.jsonl');
        this.isMonitoring = false;
        this.conversationCount = 0;
        this.startTime = Date.now();
        
        console.log('🚀 IT-ERA Chatbot Real-Time Monitor Initialized');
        console.log('📂 Log file:', this.logFile);
        console.log('⏰ Started at:', new Date().toISOString());
        console.log('=' .repeat(80));
    }
    
    startMonitoring() {
        this.isMonitoring = true;
        console.log('👁️  MONITORING STARTED - Waiting for conversation events...');
        console.log('💡 Start a conversation on IT-ERA website to see logs');
        console.log('-'.repeat(80));
        
        // Initialize log file
        if (!fs.existsSync(this.logFile)) {
            fs.writeFileSync(this.logFile, '');
        }
        
        // Watch for file changes
        this.watchLogFile();
        
        // Simulate some initial activity for demo
        setTimeout(() => {
            this.logConversationEvent('SYSTEM', 'Monitor activated and ready', {
                monitoring: true,
                timestamp: new Date().toISOString()
            });
        }, 1000);
        
        // Keep process alive
        this.keepAlive();
    }
    
    watchLogFile() {
        fs.watchFile(this.logFile, { interval: 100 }, (curr, prev) => {
            if (curr.mtime > prev.mtime) {
                this.readNewLogEntries();
            }
        });
    }
    
    readNewLogEntries() {
        try {
            const content = fs.readFileSync(this.logFile, 'utf8');
            const lines = content.trim().split('\n').filter(line => line.trim());
            
            if (lines.length > 0) {
                const lastLine = lines[lines.length - 1];
                const logEntry = JSON.parse(lastLine);
                this.displayLogEntry(logEntry);
            }
        } catch (error) {
            console.error('❌ Error reading log file:', error.message);
        }
    }
    
    logConversationEvent(type, message, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            type,
            message,
            data,
            conversationId: data.conversationId || null,
            sequence: this.conversationCount++
        };
        
        // Append to log file
        fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
        
        return logEntry;
    }
    
    displayLogEntry(entry) {
        const timestamp = new Date(entry.timestamp).toLocaleTimeString();
        const uptime = Math.round((Date.now() - this.startTime) / 1000);
        
        console.log(`\n🔔 [${timestamp}] ${entry.type}: ${entry.message}`);
        
        if (entry.data.conversationId) {
            console.log(`   🆔 Conversation ID: ${entry.data.conversationId}`);
        }
        
        if (entry.data.sessionId) {
            console.log(`   📝 Session ID: ${entry.data.sessionId}`);
        }
        
        if (entry.data.userAgent) {
            console.log(`   🌐 User Agent: ${entry.data.userAgent.substring(0, 50)}...`);
        }
        
        if (entry.data.ip) {
            console.log(`   🌍 IP Address: ${entry.data.ip}`);
        }
        
        if (entry.data.duration) {
            console.log(`   ⏱️  Response Time: ${entry.data.duration}ms`);
        }
        
        if (entry.data.cost) {
            console.log(`   💰 AI Cost: €${entry.data.cost.toFixed(4)}`);
        }
        
        console.log(`   📊 Event #${entry.sequence} | Uptime: ${uptime}s`);
        console.log('-'.repeat(50));
    }
    
    // Simulate conversation events for demo
    simulateConversationStart() {
        const mockSessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const mockConversationId = `ITERA_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${new Date().toLocaleTimeString('it-IT').replace(/:/g, '')}_${Math.random().toString(36).substr(2, 12).toUpperCase()}_P`;
        
        this.logConversationEvent('CONVERSATION_START', 'New conversation initiated', {
            conversationId: mockConversationId,
            sessionId: mockSessionId,
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            ip: '192.168.1.100',
            duration: Math.floor(Math.random() * 500) + 200,
            aiPowered: true,
            cost: Math.random() * 0.01
        });
    }
    
    simulateMessage() {
        const mockMessages = [
            'Ho bisogno di assistenza tecnica',
            'Vorrei un preventivo per la sicurezza informatica',
            'I nostri server non funzionano',
            'Problema con il backup dei dati',
            'Voglio parlare con un tecnico'
        ];
        
        const message = mockMessages[Math.floor(Math.random() * mockMessages.length)];
        
        this.logConversationEvent('USER_MESSAGE', `User message: "${message}"`, {
            message,
            messageLength: message.length,
            duration: Math.floor(Math.random() * 300) + 100,
            timestamp: new Date().toISOString()
        });
        
        // Simulate bot response
        setTimeout(() => {
            this.logConversationEvent('BOT_RESPONSE', 'AI-powered response generated', {
                aiModel: 'GPT-4o Mini',
                responseTime: Math.floor(Math.random() * 1500) + 500,
                cost: Math.random() * 0.005,
                cached: Math.random() > 0.7
            });
        }, 1000);
    }
    
    keepAlive() {
        // Simulate periodic conversation activity
        setInterval(() => {
            if (Math.random() > 0.7) {
                this.simulateConversationStart();
            }
        }, 15000); // Every 15 seconds
        
        setInterval(() => {
            if (Math.random() > 0.5) {
                this.simulateMessage();
            }
        }, 8000); // Every 8 seconds
        
        // Keep process alive
        process.stdin.resume();
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n\n🛑 Monitoring stopped');
            console.log(`📈 Total events monitored: ${this.conversationCount}`);
            console.log(`⏱️  Total uptime: ${Math.round((Date.now() - this.startTime) / 1000)}s`);
            process.exit(0);
        });
    }
    
    // Manual event logging (for integration with actual chatbot)
    logSessionStart(sessionId, conversationId, metadata = {}) {
        return this.logConversationEvent('SESSION_START', 'Chatbot session initiated', {
            sessionId,
            conversationId,
            ...metadata
        });
    }
    
    logMessage(sessionId, message, isUser = true) {
        return this.logConversationEvent(
            isUser ? 'USER_MESSAGE' : 'BOT_RESPONSE', 
            isUser ? `User: ${message}` : `Bot response generated`,
            {
                sessionId,
                message: isUser ? message : null,
                messageType: isUser ? 'user' : 'bot',
                timestamp: new Date().toISOString()
            }
        );
    }
    
    logEscalation(sessionId, escalationType, priority = 'medium') {
        return this.logConversationEvent('ESCALATION', `Conversation escalated: ${escalationType}`, {
            sessionId,
            escalationType,
            priority,
            escalatedAt: new Date().toISOString()
        });
    }
}

// Auto-start if run directly
if (require.main === module) {
    const monitor = new ChatbotRealTimeMonitor();
    monitor.startMonitoring();
    
    console.log('\n💡 DEMO MODE: Simulating conversation activity');
    console.log('🔍 In production, integrate with chatbot worker using:');
    console.log('   monitor.logSessionStart(sessionId, conversationId, metadata)');
    console.log('   monitor.logMessage(sessionId, message, isUser)');
    console.log('   monitor.logEscalation(sessionId, type, priority)');
    console.log('\n⌨️  Press Ctrl+C to stop monitoring\n');
}

module.exports = ChatbotRealTimeMonitor;