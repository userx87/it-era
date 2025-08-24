/**
 * Phone System Demo Component
 * Interactive VoIP system visualization with real-time call simulation
 */

class PhoneSystemDemo {
    constructor(containerId) {
        this.container = document.getElementById(containerId) || document.querySelector('.phone-system-demo');
        this.isActive = false;
        this.animationFrameId = null;
        this.callSimulations = [];
        this.deviceNodes = [];
        this.callQueue = [];
        
        this.init();
    }

    init() {
        if (!this.container) return;
        
        this.setupDeviceNodes();
        this.setupObserver();
        this.bindEvents();
        this.initializeCallSimulation();
        this.setupAccessibility();
    }

    setupDeviceNodes() {
        this.deviceNodes = Array.from(this.container.querySelectorAll('.device-node')).map(node => ({
            element: node,
            type: node.dataset.device,
            status: 'idle',
            callDuration: 0,
            lastActivity: Date.now()
        }));
    }

    setupObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.startDemo();
                } else {
                    this.pauseDemo();
                }
            });
        }, {
            threshold: 0.4,
            rootMargin: '20px'
        });

        observer.observe(this.container);
    }

    bindEvents() {
        // Device interaction handlers
        this.deviceNodes.forEach(device => {
            device.element.addEventListener('click', () => {
                this.handleDeviceClick(device);
            });

            // Hover effects
            device.element.addEventListener('mouseenter', () => {
                this.highlightDevice(device);
            });

            device.element.addEventListener('mouseleave', () => {
                this.resetDeviceHighlight(device);
            });

            // Keyboard navigation
            device.element.setAttribute('tabindex', '0');
            device.element.setAttribute('role', 'button');
            device.element.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handleDeviceClick(device);
                }
            });
        });

        // Pause animations when tab is not visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseDemo();
            } else if (this.isActive) {
                this.startDemo();
            }
        });

        // Central hub interaction
        const centralHub = this.container.querySelector('.central-hub');
        if (centralHub) {
            centralHub.addEventListener('click', () => {
                this.showSystemStatus();
            });
        }
    }

    setupAccessibility() {
        // Add ARIA labels and descriptions
        this.deviceNodes.forEach(device => {
            const indicator = device.element.querySelector('.call-indicator');
            device.element.setAttribute('aria-label', `${device.type} device`);
            
            if (indicator) {
                this.updateDeviceAriaLabel(device);
            }
        });
    }

    updateDeviceAriaLabel(device) {
        const statusText = {
            'idle': 'available',
            'active': 'on active call',
            'incoming': 'receiving incoming call',
            'conference': 'in conference call'
        };

        const status = device.element.querySelector('.call-indicator').dataset.status;
        device.element.setAttribute('aria-label', 
            `${device.type} device - currently ${statusText[status] || 'unknown'}`
        );
    }

    startDemo() {
        this.isActive = true;
        this.animateSystem();
        this.startCallSimulations();
        this.updateLiveStatistics();
    }

    pauseDemo() {
        this.isActive = false;
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        this.callSimulations.forEach(sim => clearInterval(sim));
        this.callSimulations = [];
    }

    animateSystem() {
        if (!this.isActive) return;

        // Update connection lines animation
        this.updateConnectionLines();
        
        // Update call indicators
        this.updateCallIndicators();
        
        // Update central hub pulse
        this.updateHubPulse();

        this.animationFrameId = requestAnimationFrame(() => this.animateSystem());
    }

    updateConnectionLines() {
        const lines = this.container.querySelectorAll('.connection-line');
        lines.forEach((line, index) => {
            // Animate data flow through connection lines
            const opacity = Math.sin(Date.now() * 0.003 + index) * 0.3 + 0.7;
            line.style.opacity = opacity;
            
            // Add pulse effect for active connections
            const device = this.deviceNodes[index];
            if (device && device.status === 'active') {
                line.style.background = `linear-gradient(to bottom, 
                    rgba(16, 185, 129, ${opacity}), 
                    transparent)`;
            } else {
                line.style.background = `linear-gradient(to bottom, 
                    rgba(14, 165, 233, ${opacity}), 
                    transparent)`;
            }
        });
    }

    updateCallIndicators() {
        this.deviceNodes.forEach(device => {
            const indicator = device.element.querySelector('.call-indicator');
            if (!indicator) return;

            // Update indicator based on device status
            if (device.status === 'active') {
                device.callDuration = Date.now() - device.lastActivity;
                this.updateCallDuration(device);
            }
        });
    }

    updateHubPulse() {
        const pulse = this.container.querySelector('.connection-pulse');
        if (!pulse) return;

        // Dynamic pulse based on system activity
        const activeDevices = this.deviceNodes.filter(d => d.status !== 'idle').length;
        const intensity = Math.min(activeDevices / this.deviceNodes.length + 0.3, 1);
        
        pulse.style.borderWidth = `${2 + intensity * 2}px`;
        pulse.style.opacity = intensity;
    }

    startCallSimulations() {
        // Simulate incoming calls
        const incomingCallSimulation = setInterval(() => {
            if (!this.isActive) return;
            
            const availableDevices = this.deviceNodes.filter(d => d.status === 'idle');
            if (availableDevices.length > 0 && Math.random() < 0.3) {
                const randomDevice = availableDevices[Math.floor(Math.random() * availableDevices.length)];
                this.simulateIncomingCall(randomDevice);
            }
        }, 3000);

        // Simulate call endings
        const callEndSimulation = setInterval(() => {
            if (!this.isActive) return;
            
            const activeDevices = this.deviceNodes.filter(d => 
                d.status === 'active' && Date.now() - d.lastActivity > 8000
            );
            
            if (activeDevices.length > 0 && Math.random() < 0.4) {
                const randomDevice = activeDevices[Math.floor(Math.random() * activeDevices.length)];
                this.endCall(randomDevice);
            }
        }, 2000);

        this.callSimulations = [incomingCallSimulation, callEndSimulation];
    }

    simulateIncomingCall(device) {
        if (!device || device.status !== 'idle') return;

        // Set incoming call status
        this.setDeviceStatus(device, 'incoming');
        
        // Auto-answer after random delay
        const answerDelay = 1500 + Math.random() * 2000;
        setTimeout(() => {
            if (device.status === 'incoming' && this.isActive) {
                this.answerCall(device);
            }
        }, answerDelay);
    }

    answerCall(device) {
        this.setDeviceStatus(device, 'active');
        device.lastActivity = Date.now();
        
        // Add call to live info panel
        this.addCallToInfoPanel(device);
        
        // Announce to screen readers
        this.announceCallUpdate(`Call started on ${device.type}`, 'polite');
    }

    endCall(device) {
        this.setDeviceStatus(device, 'idle');
        device.callDuration = 0;
        
        // Remove from info panel
        this.removeCallFromInfoPanel(device);
        
        // Announce to screen readers
        this.announceCallUpdate(`Call ended on ${device.type}`, 'polite');
    }

    setDeviceStatus(device, status) {
        device.status = status;
        const indicator = device.element.querySelector('.call-indicator');
        
        if (indicator) {
            indicator.dataset.status = status;
            this.updateDeviceAriaLabel(device);
        }
    }

    addCallToInfoPanel(device) {
        const callsContainer = this.container.querySelector('.active-calls');
        if (!callsContainer) return;

        const callItem = document.createElement('div');
        callItem.className = 'call-item';
        callItem.dataset.deviceType = device.type;
        callItem.innerHTML = `
            <span class="caller">${this.generateCallerName()}</span>
            <span class="duration" data-start="${Date.now()}">00:00</span>
        `;

        callsContainer.appendChild(callItem);
    }

    removeCallFromInfoPanel(device) {
        const callItem = this.container.querySelector(
            `.call-item[data-device-type="${device.type}"]`
        );
        
        if (callItem) {
            callItem.style.opacity = '0';
            callItem.style.transform = 'translateX(20px)';
            setTimeout(() => callItem.remove(), 300);
        }
    }

    updateCallDuration(device) {
        const callItem = this.container.querySelector(
            `.call-item[data-device-type="${device.type}"] .duration`
        );
        
        if (callItem) {
            const startTime = parseInt(callItem.dataset.start);
            const duration = Math.floor((Date.now() - startTime) / 1000);
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            
            callItem.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    generateCallerName() {
        const names = [
            'Marco Rossi', 'Giulia Bianchi', 'Alessandro Verdi', 'Francesca Russo',
            'Luca Ferrari', 'Chiara Romano', 'Matteo Ricci', 'Elena Marino',
            'Andrea Costa', 'Sara Fontana', 'Cliente Prospect', 'Fornitore',
            'Sala Riunioni A', 'Reception', 'Commerciale', 'Supporto Tecnico'
        ];
        
        return names[Math.floor(Math.random() * names.length)];
    }

    handleDeviceClick(device) {
        // Interactive device control
        switch (device.status) {
            case 'idle':
                this.simulateOutgoingCall(device);
                break;
            case 'incoming':
                this.answerCall(device);
                break;
            case 'active':
                this.endCall(device);
                break;
            case 'conference':
                this.showConferenceOptions(device);
                break;
        }
    }

    simulateOutgoingCall(device) {
        // Show dialing animation
        this.setDeviceStatus(device, 'incoming');
        
        setTimeout(() => {
            if (device.status === 'incoming' && this.isActive) {
                this.answerCall(device);
            }
        }, 1000);
    }

    highlightDevice(device) {
        device.element.style.transform = 'scale(1.1)';
        device.element.style.zIndex = '10';
        
        // Show device info tooltip
        this.showDeviceTooltip(device);
    }

    resetDeviceHighlight(device) {
        device.element.style.transform = '';
        device.element.style.zIndex = '';
        
        this.hideDeviceTooltip();
    }

    showDeviceTooltip(device) {
        const tooltip = this.createDeviceTooltip(device);
        document.body.appendChild(tooltip);
        
        // Position tooltip
        const deviceRect = device.element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        tooltip.style.left = `${deviceRect.left + deviceRect.width / 2 - tooltipRect.width / 2}px`;
        tooltip.style.top = `${deviceRect.top - tooltipRect.height - 10}px`;
        
        requestAnimationFrame(() => {
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'translateY(0)';
        });
    }

    createDeviceTooltip(device) {
        const existingTooltip = document.getElementById('device-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }

        const tooltip = document.createElement('div');
        tooltip.id = 'device-tooltip';
        tooltip.className = 'device-tooltip';
        
        const deviceInfo = this.getDeviceInfo(device);
        
        tooltip.innerHTML = `
            <div class="tooltip-arrow"></div>
            <h4>${device.type}</h4>
            <p>${deviceInfo.description}</p>
            <div class="device-stats">
                <span class="stat">
                    <strong>${deviceInfo.quality}</strong>
                    Audio Quality
                </span>
                <span class="stat">
                    <strong>${deviceInfo.features}</strong>
                    Features
                </span>
            </div>
        `;

        tooltip.style.cssText = `
            position: fixed;
            background: white;
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            border: 1px solid #e5e7eb;
            max-width: 250px;
            z-index: 1000;
            opacity: 0;
            transform: translateY(-10px);
            transition: all 0.3s ease;
            pointer-events: none;
        `;

        return tooltip;
    }

    getDeviceInfo(device) {
        const deviceData = {
            'Desktop': {
                description: 'Postazione desktop con VoIP integrato e funzioni avanzate.',
                quality: 'HD+',
                features: 'Complete'
            },
            'Mobile': {
                description: 'App mobile per chiamate e chat ovunque ti trovi.',
                quality: 'HD',
                features: 'Mobile'
            },
            'Tablet': {
                description: 'Interfaccia touch ottimizzata per tablet e dispositivi ibridi.',
                quality: 'HD',
                features: 'Touch'
            },
            'Sala Riunioni': {
                description: 'Sistema conferenza con audio e video di qualità professionale.',
                quality: '4K+',
                features: 'Conference'
            }
        };

        return deviceData[device.type] || {
            description: 'Dispositivo VoIP professionale.',
            quality: 'HD',
            features: 'Standard'
        };
    }

    hideDeviceTooltip() {
        const tooltip = document.getElementById('device-tooltip');
        if (tooltip) {
            tooltip.style.opacity = '0';
            tooltip.style.transform = 'translateY(-10px)';
            setTimeout(() => tooltip.remove(), 300);
        }
    }

    updateLiveStatistics() {
        if (!this.isActive) return;

        // Update connectivity bar statistics
        const usersElement = document.getElementById('liveUsers');
        if (usersElement) {
            const baseUsers = 2847;
            const variance = Math.sin(Date.now() * 0.0001) * 50;
            const currentUsers = Math.floor(baseUsers + variance);
            usersElement.textContent = currentUsers.toLocaleString();
        }

        const qualityElement = document.getElementById('callQuality');
        if (qualityElement) {
            const qualities = ['HD', 'HD+', '4K'];
            const activeDevices = this.deviceNodes.filter(d => d.status === 'active').length;
            const qualityIndex = Math.min(activeDevices, qualities.length - 1);
            qualityElement.textContent = qualities[qualityIndex];
        }

        // Schedule next update
        setTimeout(() => this.updateLiveStatistics(), 5000);
    }

    showSystemStatus() {
        const status = {
            totalDevices: this.deviceNodes.length,
            activeDevices: this.deviceNodes.filter(d => d.status === 'active').length,
            uptime: '99.9%',
            quality: 'HD+'
        };

        this.announceCallUpdate(
            `System status: ${status.activeDevices} of ${status.totalDevices} devices active, ${status.uptime} uptime`,
            'assertive'
        );
    }

    announceCallUpdate(message, priority = 'polite') {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', priority);
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 3000);
    }

    // Public API methods
    setDemoMode(mode) {
        // mode: 'quiet', 'normal', 'busy'
        switch (mode) {
            case 'quiet':
                this.deviceNodes.forEach(device => {
                    if (device.status !== 'idle') {
                        this.endCall(device);
                    }
                });
                break;
            case 'busy':
                this.deviceNodes.forEach((device, index) => {
                    setTimeout(() => {
                        if (device.status === 'idle') {
                            this.simulateIncomingCall(device);
                        }
                    }, index * 500);
                });
                break;
        }
    }

    destroy() {
        this.pauseDemo();
        this.hideDeviceTooltip();
        
        // Remove all event listeners
        this.deviceNodes.forEach(device => {
            device.element.removeEventListener('click', this.handleDeviceClick);
            device.element.removeEventListener('mouseenter', this.highlightDevice);
            device.element.removeEventListener('mouseleave', this.resetDeviceHighlight);
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const phoneSystemDemo = new PhoneSystemDemo();
    
    // Make available globally for external control
    window.phoneSystemDemo = phoneSystemDemo;
    
    // Demo control functions
    window.setVoipDemo = function(mode) {
        if (window.phoneSystemDemo) {
            window.phoneSystemDemo.setDemoMode(mode);
        }
    };
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhoneSystemDemo;
}