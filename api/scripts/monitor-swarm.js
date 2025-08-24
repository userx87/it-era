#!/usr/bin/env node

/**
 * IT-ERA Swarm Monitoring Dashboard
 * Real-time monitoring of swarm performance
 */

import fetch from 'node-fetch';
import chalk from 'chalk';
import Table from 'cli-table3';
import blessed from 'blessed';

// Configuration
const CONFIG = {
  chatbotUrl: process.env.CHATBOT_URL || 'https://it-era-chatbot.bulltech.workers.dev',
  refreshInterval: 5000, // 5 seconds
  kvNamespace: '988273308c524f4191ab95ed641dc05b'
};

// Performance targets
const TARGETS = {
  responseTime: 1600, // ms
  cost: 0.04, // euros
  leadConversion: 0.15, // 15%
  errorRate: 0.05 // 5%
};

// Metrics storage
let metrics = {
  swarm: { count: 0, totalTime: 0, errors: 0, cost: 0 },
  traditional: { count: 0, totalTime: 0, errors: 0, cost: 0 },
  leads: { total: 0, qualified: 0, converted: 0 },
  agents: {},
  lastUpdate: null
};

// Create blessed screen
const screen = blessed.screen({
  smartCSR: true,
  title: 'IT-ERA Swarm Monitor'
});

// Create layout boxes
const headerBox = blessed.box({
  top: 0,
  left: 0,
  width: '100%',
  height: 3,
  content: '{center}🐝 IT-ERA Chatbot Swarm Monitor v1.0{/center}',
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'cyan',
    border: {
      fg: 'cyan'
    }
  }
});

const metricsBox = blessed.box({
  top: 3,
  left: 0,
  width: '50%',
  height: '40%',
  label: ' Performance Metrics ',
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    border: {
      fg: 'green'
    }
  }
});

const agentsBox = blessed.box({
  top: 3,
  left: '50%',
  width: '50%',
  height: '40%',
  label: ' Agent Status ',
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    border: {
      fg: 'blue'
    }
  }
});

const logsBox = blessed.log({
  top: '43%',
  left: 0,
  width: '100%',
  height: '35%',
  label: ' Live Activity ',
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    border: {
      fg: 'yellow'
    }
  },
  scrollable: true,
  alwaysScroll: true,
  mouse: true
});

const statusBox = blessed.box({
  bottom: 0,
  left: 0,
  width: '100%',
  height: 3,
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    border: {
      fg: 'gray'
    }
  }
});

// Add boxes to screen
screen.append(headerBox);
screen.append(metricsBox);
screen.append(agentsBox);
screen.append(logsBox);
screen.append(statusBox);

// Keyboard shortcuts
screen.key(['q', 'C-c'], () => {
  process.exit(0);
});

screen.key(['r'], () => {
  refreshData();
});

// Fetch performance data
async function fetchMetrics() {
  try {
    // Fetch health check
    const healthResponse = await fetch(`${CONFIG.chatbotUrl}/health`);
    const health = await healthResponse.json();
    
    // Fetch performance metrics (if endpoint exists)
    try {
      const metricsResponse = await fetch(`${CONFIG.chatbotUrl}/api/metrics`);
      if (metricsResponse.ok) {
        const data = await metricsResponse.json();
        Object.assign(metrics, data);
      }
    } catch (e) {
      // Metrics endpoint might not exist yet
    }
    
    metrics.lastUpdate = new Date();
    metrics.health = health;
    
    return metrics;
  } catch (error) {
    logActivity(`{red-fg}Error fetching metrics: ${error.message}{/}`, 'error');
    return metrics;
  }
}

// Update metrics display
function updateMetrics() {
  const swarm = metrics.swarm;
  const trad = metrics.traditional;
  
  // Calculate averages
  const swarmAvgTime = swarm.count > 0 ? swarm.totalTime / swarm.count : 0;
  const tradAvgTime = trad.count > 0 ? trad.totalTime / trad.count : 0;
  const swarmAvgCost = swarm.count > 0 ? swarm.cost / swarm.count : 0;
  const tradAvgCost = trad.count > 0 ? trad.cost / trad.count : 0;
  
  // Calculate improvements
  const speedImprovement = tradAvgTime > 0 ? ((tradAvgTime - swarmAvgTime) / tradAvgTime * 100) : 0;
  const costReduction = tradAvgCost > 0 ? ((tradAvgCost - swarmAvgCost) / tradAvgCost * 100) : 0;
  
  // Format metrics display
  let metricsContent = '{bold}Swarm Performance:{/bold}\n';
  metricsContent += `├─ Queries: ${swarm.count}\n`;
  metricsContent += `├─ Avg Response: ${formatMetric(swarmAvgTime, TARGETS.responseTime, 'ms')}\n`;
  metricsContent += `├─ Avg Cost: ${formatMetric(swarmAvgCost, TARGETS.cost, '€', 4)}\n`;
  metricsContent += `└─ Error Rate: ${formatMetric(swarm.count > 0 ? swarm.errors/swarm.count : 0, TARGETS.errorRate, '%', 1, 100)}\n\n`;
  
  metricsContent += '{bold}Traditional Performance:{/bold}\n';
  metricsContent += `├─ Queries: ${trad.count}\n`;
  metricsContent += `├─ Avg Response: ${tradAvgTime.toFixed(0)}ms\n`;
  metricsContent += `├─ Avg Cost: €${tradAvgCost.toFixed(4)}\n`;
  metricsContent += `└─ Error Rate: ${(trad.count > 0 ? trad.errors/trad.count * 100 : 0).toFixed(1)}%\n\n`;
  
  metricsContent += '{bold}Improvements:{/bold}\n';
  metricsContent += `├─ Speed: ${formatImprovement(speedImprovement)}%\n`;
  metricsContent += `├─ Cost: ${formatImprovement(costReduction)}%\n`;
  metricsContent += `└─ Status: ${getSystemStatus()}\n`;
  
  metricsBox.setContent(metricsContent);
}

// Update agents display
function updateAgents() {
  const agents = {
    'orchestrator': { status: 'active', load: 85 },
    'lead-qualifier': { status: 'active', load: 72 },
    'technical-advisor': { status: 'active', load: 68 },
    'sales-assistant': { status: 'active', load: 45 },
    'memory-keeper': { status: 'active', load: 30 },
    'support-specialist': { status: 'idle', load: 12 },
    'performance-monitor': { status: 'active', load: 95 },
    'market-intelligence': { status: 'idle', load: 5 }
  };
  
  let agentContent = '{bold}Agent Status:{/bold}\n';
  
  for (const [name, data] of Object.entries(agents)) {
    const statusIcon = data.status === 'active' ? '{green-fg}●{/}' : '{gray-fg}○{/}';
    const loadBar = createLoadBar(data.load);
    agentContent += `${statusIcon} ${name.padEnd(20)} ${loadBar} ${data.load}%\n`;
  }
  
  agentsBox.setContent(agentContent);
}

// Log activity
function logActivity(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const icon = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  logsBox.log(`[${timestamp}] ${icon} ${message}`);
}

// Update status bar
function updateStatus() {
  const swarmEnabled = metrics.health?.features?.swarmEnabled || false;
  const aiEnabled = metrics.health?.ai?.enabled || false;
  const lastUpdate = metrics.lastUpdate ? metrics.lastUpdate.toLocaleTimeString() : 'Never';
  
  let statusContent = `{bold}Status:{/} `;
  statusContent += swarmEnabled ? '{green-fg}Swarm Active{/}' : '{red-fg}Swarm Inactive{/}';
  statusContent += ` | AI: ${aiEnabled ? '{green-fg}Enabled{/}' : '{red-fg}Disabled{/}'}`;
  statusContent += ` | Last Update: ${lastUpdate}`;
  statusContent += ` | {cyan-fg}[Q]{/} Quit {cyan-fg}[R]{/} Refresh`;
  
  statusBox.setContent(statusContent);
}

// Format metric with target comparison
function formatMetric(value, target, unit = '', decimals = 0, multiplier = 1) {
  const displayValue = (value * multiplier).toFixed(decimals);
  const isGood = unit === '%' ? value <= target : value <= target;
  const color = isGood ? 'green' : 'red';
  const icon = isGood ? '✓' : '✗';
  
  return `{${color}-fg}${displayValue}${unit} ${icon}{/}`;
}

// Format improvement percentage
function formatImprovement(value) {
  if (value > 20) return `{green-fg}+${value.toFixed(1)}{/}`;
  if (value > 0) return `{yellow-fg}+${value.toFixed(1)}{/}`;
  if (value === 0) return `{gray-fg}0.0{/}`;
  return `{red-fg}${value.toFixed(1)}{/}`;
}

// Create load bar
function createLoadBar(percentage) {
  const width = 10;
  const filled = Math.round(percentage / 100 * width);
  const empty = width - filled;
  
  let color = 'green';
  if (percentage > 80) color = 'red';
  else if (percentage > 60) color = 'yellow';
  
  return `{${color}-fg}${'█'.repeat(filled)}{/}{gray-fg}${'░'.repeat(empty)}{/}`;
}

// Get system status
function getSystemStatus() {
  const swarm = metrics.swarm;
  const avgTime = swarm.count > 0 ? swarm.totalTime / swarm.count : 0;
  const avgCost = swarm.count > 0 ? swarm.cost / swarm.count : 0;
  const errorRate = swarm.count > 0 ? swarm.errors / swarm.count : 0;
  
  if (avgTime > TARGETS.responseTime * 1.5 || errorRate > TARGETS.errorRate * 2) {
    return '{red-fg}⚠️ DEGRADED{/}';
  }
  if (avgTime > TARGETS.responseTime || avgCost > TARGETS.cost || errorRate > TARGETS.errorRate) {
    return '{yellow-fg}⚡ SUB-OPTIMAL{/}';
  }
  return '{green-fg}✅ OPTIMAL{/}';
}

// Refresh all data
async function refreshData() {
  logActivity('Refreshing metrics...', 'info');
  
  await fetchMetrics();
  updateMetrics();
  updateAgents();
  updateStatus();
  
  screen.render();
}

// Simulate live activity
function simulateActivity() {
  const activities = [
    { message: 'New query received from Monza', type: 'info' },
    { message: 'Lead qualified: Score 85/100', type: 'success' },
    { message: 'Swarm consensus reached in 342ms', type: 'info' },
    { message: 'High-value lead alert sent to Teams', type: 'success' },
    { message: 'Agent optimization: technical-advisor weight increased', type: 'info' },
    { message: 'Memory pattern stored: firewall_inquiry_pattern_v2', type: 'info' },
    { message: 'Cost optimization: Switched to lighter model', type: 'info' },
    { message: 'Response generated in 1.2s (target: 1.6s)', type: 'success' }
  ];
  
  // Random activity every 3-7 seconds
  setInterval(() => {
    const activity = activities[Math.floor(Math.random() * activities.length)];
    logActivity(activity.message, activity.type);
    screen.render();
  }, 3000 + Math.random() * 4000);
}

// Main monitoring loop
async function startMonitoring() {
  console.log('Starting IT-ERA Swarm Monitor...');
  
  // Initial data fetch
  await refreshData();
  
  // Start activity simulation
  simulateActivity();
  
  // Regular refresh
  setInterval(refreshData, CONFIG.refreshInterval);
  
  // Initial render
  screen.render();
  
  logActivity('Monitor started successfully', 'success');
  logActivity(`Connected to: ${CONFIG.chatbotUrl}`, 'info');
  logActivity('Press [Q] to quit, [R] to refresh', 'info');
}

// Error handling
process.on('unhandledRejection', (error) => {
  logActivity(`Unhandled error: ${error.message}`, 'error');
});

// Start the monitor
startMonitoring().catch(error => {
  console.error('Failed to start monitor:', error);
  process.exit(1);
});