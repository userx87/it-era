/**
 * Security Shield Interactive Component
 * Manages the animated security visualization for backup & disaster recovery
 */

class SecurityShield {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.isVisible = false;
        this.animationId = null;
        this.layers = [];
        this.particles = [];
        this.init();
    }

    init() {
        if (!this.container) return;
        
        this.setupObserver();
        this.bindEvents();
        this.createParticles();
    }

    setupObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.startAnimations();
                } else {
                    this.pauseAnimations();
                }
            });
        }, {
            threshold: 0.3,
            rootMargin: '50px'
        });

        observer.observe(this.container);
    }

    bindEvents() {
        // Pause animations when tab is not visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAnimations();
            } else if (this.isVisible) {
                this.startAnimations();
            }
        });

        // Add hover interactions to layers
        const layers = this.container.querySelectorAll('.layer');
        layers.forEach((layer, index) => {
            layer.addEventListener('mouseenter', () => {
                this.highlightLayer(layer, index);
            });

            layer.addEventListener('mouseleave', () => {
                this.resetLayer(layer);
            });

            // Accessibility: keyboard navigation
            layer.setAttribute('tabindex', '0');
            layer.setAttribute('role', 'button');
            layer.setAttribute('aria-label', `Security layer: ${layer.dataset.protection}`);

            layer.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.showLayerInfo(layer);
                }
            });
        });
    }

    createParticles() {
        const particleContainer = this.container.querySelector('.data-flow');
        if (!particleContainer) return;

        // Create additional animated particles for enhanced effect
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'data-particle';
            particle.style.setProperty('--delay', `${i * 0.4}s`);
            
            // Random positioning and movement
            const angle = (i / 8) * Math.PI * 2;
            const radius = 100 + Math.random() * 50;
            const x = Math.cos(angle) * radius + 150;
            const y = Math.sin(angle) * radius + 150;
            
            particle.style.setProperty('--start-x', `${x}px`);
            particle.style.setProperty('--start-y', `${y}px`);
            
            particleContainer.appendChild(particle);
            this.particles.push(particle);
        }
    }

    startAnimations() {
        this.isVisible = true;
        
        // Resume CSS animations
        const layers = this.container.querySelectorAll('.layer');
        layers.forEach(layer => {
            layer.style.animationPlayState = 'running';
        });

        const particles = this.container.querySelectorAll('.data-particle');
        particles.forEach(particle => {
            particle.style.animationPlayState = 'running';
        });

        // Start custom animations
        this.animateSecurityPulse();
    }

    pauseAnimations() {
        this.isVisible = false;
        
        // Pause CSS animations
        const layers = this.container.querySelectorAll('.layer');
        layers.forEach(layer => {
            layer.style.animationPlayState = 'paused';
        });

        const particles = this.container.querySelectorAll('.data-particle');
        particles.forEach(particle => {
            particle.style.animationPlayState = 'paused';
        });

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    animateSecurityPulse() {
        if (!this.isVisible) return;

        const pulse = this.container.querySelector('.connection-pulse');
        if (pulse) {
            // Add dynamic pulse effect based on "threat level"
            const intensity = Math.sin(Date.now() * 0.002) * 0.3 + 0.7;
            pulse.style.opacity = intensity;
            
            // Change pulse color based on security status
            const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
            const colorIndex = Math.floor((Date.now() * 0.0005) % colors.length);
            pulse.style.borderColor = colors[colorIndex];
        }

        this.animationId = requestAnimationFrame(() => this.animateSecurityPulse());
    }

    highlightLayer(layer, index) {
        // Enhance layer on hover
        layer.style.transform = 'scale(1.05)';
        layer.style.opacity = '1';
        layer.style.zIndex = '10';
        layer.style.boxShadow = '0 0 30px rgba(59, 130, 246, 0.5)';

        // Show tooltip with layer information
        this.showLayerTooltip(layer, index);

        // Temporarily pause rotation for better visibility
        layer.style.animationPlayState = 'paused';
    }

    resetLayer(layer) {
        layer.style.transform = '';
        layer.style.opacity = '';
        layer.style.zIndex = '';
        layer.style.boxShadow = '';
        layer.style.animationPlayState = 'running';

        this.hideLayerTooltip();
    }

    showLayerTooltip(layer, index) {
        const tooltip = this.createTooltip(layer, index);
        if (tooltip) {
            document.body.appendChild(tooltip);
            
            // Position tooltip
            const layerRect = layer.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();
            
            tooltip.style.left = `${layerRect.left + layerRect.width / 2 - tooltipRect.width / 2}px`;
            tooltip.style.top = `${layerRect.top - tooltipRect.height - 10}px`;
            
            // Animate tooltip appearance
            requestAnimationFrame(() => {
                tooltip.style.opacity = '1';
                tooltip.style.transform = 'translateY(0)';
            });
        }
    }

    createTooltip(layer, index) {
        const existingTooltip = document.getElementById('security-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }

        const tooltip = document.createElement('div');
        tooltip.id = 'security-tooltip';
        tooltip.className = 'security-tooltip';
        
        const protectionType = layer.dataset.protection;
        const tooltipContent = this.getTooltipContent(protectionType);
        
        tooltip.innerHTML = `
            <div class="tooltip-arrow"></div>
            <h4>${protectionType}</h4>
            <p>${tooltipContent.description}</p>
            <div class="tooltip-stats">
                <span class="stat">
                    <strong>${tooltipContent.effectiveness}</strong>
                    Effectiveness
                </span>
                <span class="stat">
                    <strong>${tooltipContent.coverage}</strong>
                    Coverage
                </span>
            </div>
        `;

        // Add tooltip styles
        tooltip.style.cssText = `
            position: fixed;
            background: white;
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            border: 1px solid #e5e7eb;
            max-width: 280px;
            z-index: 1000;
            opacity: 0;
            transform: translateY(-10px);
            transition: all 0.3s ease;
            pointer-events: none;
        `;

        return tooltip;
    }

    hideLayerTooltip() {
        const tooltip = document.getElementById('security-tooltip');
        if (tooltip) {
            tooltip.style.opacity = '0';
            tooltip.style.transform = 'translateY(-10px)';
            setTimeout(() => tooltip.remove(), 300);
        }
    }

    getTooltipContent(protectionType) {
        const content = {
            'Firewall': {
                description: 'Blocca accessi non autorizzati e monitora il traffico di rete in tempo reale.',
                effectiveness: '99.8%',
                coverage: '24/7'
            },
            'Crittografia': {
                description: 'Protegge i dati con algoritmi AES-256 per garantire riservatezza assoluta.',
                effectiveness: '100%',
                coverage: 'End-to-End'
            },
            'Backup': {
                description: 'Copie multiple dei dati distribuite geograficamente per massima sicurezza.',
                effectiveness: '99.9%',
                coverage: 'Multi-site'
            },
            'Monitoraggio': {
                description: 'Sorveglianza continua con AI per rilevare anomalie e minacce in tempo reale.',
                effectiveness: '95%',
                coverage: 'Real-time'
            }
        };

        return content[protectionType] || {
            description: 'Sistema di protezione avanzato per la sicurezza dei dati.',
            effectiveness: '99%',
            coverage: 'Full'
        };
    }

    showLayerInfo(layer) {
        const protectionType = layer.dataset.protection;
        const info = this.getTooltipContent(protectionType);
        
        // Announce to screen readers
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'sr-only';
        announcement.textContent = `${protectionType}: ${info.description} Effectiveness: ${info.effectiveness}`;
        
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 3000);
    }

    // Public methods for external control
    updateThreatLevel(level) {
        // level: 'low', 'medium', 'high', 'critical'
        const colors = {
            low: '#10b981',
            medium: '#f59e0b', 
            high: '#f97316',
            critical: '#ef4444'
        };

        const pulse = this.container.querySelector('.connection-pulse');
        if (pulse) {
            pulse.style.borderColor = colors[level] || colors.low;
            pulse.style.animationDuration = level === 'critical' ? '0.5s' : '2s';
        }
    }

    simulateAttack() {
        // Visual effect for demonstrating protection
        const layers = this.container.querySelectorAll('.layer');
        
        layers.forEach((layer, index) => {
            setTimeout(() => {
                layer.style.boxShadow = '0 0 20px #ef4444';
                layer.style.borderColor = '#ef4444';
                
                setTimeout(() => {
                    layer.style.boxShadow = '';
                    layer.style.borderColor = '';
                }, 500);
            }, index * 200);
        });
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.hideLayerTooltip();
        
        // Remove event listeners
        const layers = this.container.querySelectorAll('.layer');
        layers.forEach(layer => {
            layer.removeEventListener('mouseenter', this.highlightLayer);
            layer.removeEventListener('mouseleave', this.resetLayer);
            layer.removeEventListener('keydown', this.showLayerInfo);
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const securityShield = new SecurityShield('securityShield');
    
    // Make available globally for demo purposes
    window.securityShield = securityShield;
    
    // Demo functions for interactive elements
    window.simulateSecurityTest = function() {
        if (window.securityShield) {
            window.securityShield.simulateAttack();
        }
    };
    
    window.updateSecurityLevel = function(level) {
        if (window.securityShield) {
            window.securityShield.updateThreatLevel(level);
        }
    };
});

// Additional security-themed interactions
class RecoveryTimelineAnimator {
    constructor() {
        this.timeline = document.querySelector('.recovery-timeline');
        this.init();
    }

    init() {
        if (!this.timeline) return;
        
        this.animateTimeline();
        this.addProgressBar();
    }

    animateTimeline() {
        const items = this.timeline.querySelectorAll('.timeline-item');
        
        items.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateX(-20px)';
            
            setTimeout(() => {
                item.style.transition = 'all 0.6s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateX(0)';
            }, index * 200);
        });
    }

    addProgressBar() {
        const progressBar = document.createElement('div');
        progressBar.className = 'recovery-progress-bar';
        progressBar.innerHTML = `
            <div class="progress-track">
                <div class="progress-fill"></div>
            </div>
            <span class="progress-label">Recovery Progress</span>
        `;

        progressBar.style.cssText = `
            margin-top: 20px;
            padding: 16px;
            background: rgba(59, 130, 246, 0.1);
            border-radius: 12px;
            border: 1px solid rgba(59, 130, 246, 0.2);
        `;

        this.timeline.appendChild(progressBar);
        
        // Animate progress fill
        const fill = progressBar.querySelector('.progress-fill');
        if (fill) {
            fill.style.cssText = `
                height: 8px;
                background: linear-gradient(90deg, #3b82f6, #10b981);
                border-radius: 4px;
                width: 0%;
                transition: width 3s ease;
            `;
            
            // Start progress animation
            setTimeout(() => {
                fill.style.width = '85%';
            }, 1000);
        }
    }
}

// Initialize recovery timeline animator
document.addEventListener('DOMContentLoaded', function() {
    new RecoveryTimelineAnimator();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SecurityShield, RecoveryTimelineAnimator };
}