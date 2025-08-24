/**
 * Digital Transformation Journey Component
 * Interactive visualization of transformation stages with ROI metrics
 */

class TransformationJourney {
    constructor(containerId) {
        this.container = document.getElementById(containerId) || document.querySelector('.transformation-journey');
        this.isVisible = false;
        this.animationId = null;
        this.currentMaturity = 35;
        this.targetMaturity = 85;
        this.animationProgress = 0;
        
        this.init();
    }

    init() {
        if (!this.container) return;
        
        this.setupObserver();
        this.bindEvents();
        this.setupAccessibility();
        this.createInteractiveElements();
    }

    setupObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.startAnimation();
                } else {
                    this.pauseAnimation();
                }
            });
        }, {
            threshold: 0.3,
            rootMargin: '50px'
        });

        observer.observe(this.container);
    }

    bindEvents() {
        // Interactive elements for current and future states
        const currentState = this.container.querySelector('.current-state');
        const futureState = this.container.querySelector('.future-state');
        
        if (currentState) {
            this.setupStateInteractions(currentState, 'current');
        }
        
        if (futureState) {
            this.setupStateInteractions(futureState, 'future');
        }

        // Arrow interaction
        const transformationArrow = this.container.querySelector('.transformation-arrow');
        if (transformationArrow) {
            transformationArrow.addEventListener('click', () => {
                this.animateTransformation();
            });
            
            transformationArrow.style.cursor = 'pointer';
            transformationArrow.setAttribute('tabindex', '0');
            transformationArrow.setAttribute('role', 'button');
            transformationArrow.setAttribute('aria-label', 'Start transformation animation');
            
            transformationArrow.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.animateTransformation();
                }
            });
        }

        // ROI metric interactions
        this.setupROIMetrics();
        
        // Pause animations when not visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAnimation();
            } else if (this.isVisible) {
                this.startAnimation();
            }
        });
    }

    setupStateInteractions(stateElement, stateType) {
        const elements = stateElement.querySelectorAll('.element');
        
        elements.forEach((element, index) => {
            element.addEventListener('click', () => {
                this.showElementDetails(element, stateType, index);
            });
            
            element.addEventListener('mouseenter', () => {
                this.highlightElement(element, stateType);
            });
            
            element.addEventListener('mouseleave', () => {
                this.resetElementHighlight(element);
            });
            
            // Accessibility
            element.setAttribute('tabindex', '0');
            element.setAttribute('role', 'button');
            element.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.showElementDetails(element, stateType, index);
                }
            });
        });
    }

    setupROIMetrics() {
        const metrics = this.container.querySelectorAll('.metric');
        
        metrics.forEach((metric, index) => {
            metric.addEventListener('click', () => {
                this.showMetricDetails(metric, index);
            });
            
            metric.style.cursor = 'pointer';
            metric.setAttribute('tabindex', '0');
            metric.setAttribute('role', 'button');
            
            metric.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.showMetricDetails(metric, index);
                }
            });
        });
    }

    setupAccessibility() {
        // Add ARIA labels and descriptions
        const currentState = this.container.querySelector('.current-state');
        const futureState = this.container.querySelector('.future-state');
        
        if (currentState) {
            currentState.setAttribute('aria-label', 'Current digital maturity state');
        }
        
        if (futureState) {
            futureState.setAttribute('aria-label', 'Target digital maturity state');
        }
        
        // Live region for announcements
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.id = 'transformation-announcements';
        document.body.appendChild(liveRegion);
    }

    createInteractiveElements() {
        // Add progress indicators
        this.createProgressIndicators();
        
        // Add interactive timeline
        this.createTimelineControls();
        
        // Add comparison slider
        this.createComparisonSlider();
    }

    createProgressIndicators() {
        const progressContainer = document.createElement('div');
        progressContainer.className = 'transformation-progress';
        progressContainer.innerHTML = `
            <div class="progress-header">
                <h4>Transformation Progress</h4>
                <span class="progress-percentage">0%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
                <div class="progress-milestones">
                    <div class="milestone" data-progress="25">Planning</div>
                    <div class="milestone" data-progress="50">Implementation</div>
                    <div class="milestone" data-progress="75">Adoption</div>
                    <div class="milestone" data-progress="100">Optimization</div>
                </div>
            </div>
        `;
        
        progressContainer.style.cssText = `
            margin-top: 32px;
            padding: 24px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            border: 1px solid #e5e7eb;
        `;
        
        this.container.appendChild(progressContainer);
    }

    createTimelineControls() {
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'timeline-controls';
        controlsContainer.innerHTML = `
            <div class="control-buttons">
                <button class="control-btn" data-action="reset">
                    <span class="btn-icon">⟲</span>
                    Reset
                </button>
                <button class="control-btn primary" data-action="play">
                    <span class="btn-icon">▶</span>
                    Simulate
                </button>
                <button class="control-btn" data-action="skip">
                    <span class="btn-icon">⏭</span>
                    Skip to End
                </button>
            </div>
        `;
        
        controlsContainer.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 16px;
            margin-top: 24px;
        `;
        
        this.container.appendChild(controlsContainer);
        
        // Bind control events
        controlsContainer.addEventListener('click', (e) => {
            const button = e.target.closest('.control-btn');
            if (!button) return;
            
            const action = button.dataset.action;
            switch (action) {
                case 'reset':
                    this.resetTransformation();
                    break;
                case 'play':
                    this.animateTransformation();
                    break;
                case 'skip':
                    this.skipToEnd();
                    break;
            }
        });
    }

    createComparisonSlider() {
        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'comparison-slider';
        sliderContainer.innerHTML = `
            <div class="slider-header">
                <h4>Compare Scenarios</h4>
                <div class="scenario-labels">
                    <span class="current-label">Current</span>
                    <span class="future-label">Transformed</span>
                </div>
            </div>
            <div class="slider-track">
                <input type="range" min="0" max="100" value="0" class="slider-input" 
                       aria-label="Compare current and transformed states">
                <div class="slider-fill"></div>
            </div>
        `;
        
        sliderContainer.style.cssText = `
            margin-top: 24px;
            padding: 20px;
            background: linear-gradient(135deg, rgba(124, 58, 237, 0.05), rgba(6, 182, 212, 0.05));
            border-radius: 12px;
            border: 1px solid rgba(124, 58, 237, 0.2);
        `;
        
        this.container.appendChild(sliderContainer);
        
        // Bind slider events
        const sliderInput = sliderContainer.querySelector('.slider-input');
        sliderInput.addEventListener('input', (e) => {
            this.updateComparison(e.target.value);
        });
    }

    startAnimation() {
        this.isVisible = true;
        this.animateElements();
        this.updateMaturityScore();
    }

    pauseAnimation() {
        this.isVisible = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    animateElements() {
        if (!this.isVisible) return;

        // Animate floating elements
        const elements = this.container.querySelectorAll('.element');
        elements.forEach((element, index) => {
            const time = Date.now() * 0.001 + index;
            const offsetY = Math.sin(time) * 3;
            element.style.transform = `translateY(${offsetY}px)`;
        });

        // Animate metric values
        this.animateMetricValues();

        // Animate connection lines
        this.animateConnections();

        this.animationId = requestAnimationFrame(() => this.animateElements());
    }

    animateMetricValues() {
        const metrics = this.container.querySelectorAll('.metric-value');
        metrics.forEach(metric => {
            const baseValue = parseFloat(metric.dataset.baseValue || metric.textContent);
            const variance = Math.sin(Date.now() * 0.002) * 0.1;
            const currentValue = baseValue * (1 + variance);
            
            if (metric.textContent.includes('€')) {
                metric.textContent = `€${(currentValue / 1000000).toFixed(1)}M`;
            } else if (metric.textContent.includes('%')) {
                metric.textContent = `${Math.round(currentValue)}%`;
            }
        });
    }

    animateConnections() {
        // Add dynamic connection lines between states
        const arrow = this.container.querySelector('.transformation-arrow');
        if (arrow) {
            const pulse = Math.sin(Date.now() * 0.003) * 0.2 + 0.8;
            arrow.style.opacity = pulse;
        }
    }

    updateMaturityScore() {
        const scoreElement = document.getElementById('maturityScore');
        if (!scoreElement) return;

        // Animate score increase over time
        const targetScore = this.currentMaturity + (this.targetMaturity - this.currentMaturity) * this.animationProgress;
        scoreElement.textContent = Math.round(targetScore);
        
        // Update progress indicators
        this.updateProgressIndicators();
    }

    updateProgressIndicators() {
        const progressFill = this.container.querySelector('.progress-fill');
        const progressPercentage = this.container.querySelector('.progress-percentage');
        
        if (progressFill && progressPercentage) {
            const progress = this.animationProgress * 100;
            progressFill.style.width = `${progress}%`;
            progressPercentage.textContent = `${Math.round(progress)}%`;
            
            // Update milestone states
            const milestones = this.container.querySelectorAll('.milestone');
            milestones.forEach(milestone => {
                const milestoneProgress = parseInt(milestone.dataset.progress);
                if (progress >= milestoneProgress) {
                    milestone.classList.add('completed');
                } else {
                    milestone.classList.remove('completed');
                }
            });
        }
    }

    animateTransformation() {
        this.announce('Starting digital transformation simulation');
        
        // Animate progress over time
        const duration = 5000; // 5 seconds
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            this.animationProgress = Math.min(elapsed / duration, 1);
            
            this.updateMaturityScore();
            this.updateVisualTransformation();
            
            if (this.animationProgress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.announce('Digital transformation simulation completed');
            }
        };
        
        animate();
    }

    updateVisualTransformation() {
        const currentElements = this.container.querySelectorAll('.current-state .element');
        const futureElements = this.container.querySelectorAll('.future-state .element');
        
        // Fade out current state elements
        currentElements.forEach(element => {
            element.style.opacity = 1 - this.animationProgress;
            element.style.transform = `scale(${1 - this.animationProgress * 0.2})`;
        });
        
        // Fade in future state elements
        futureElements.forEach(element => {
            element.style.opacity = this.animationProgress;
            element.style.transform = `scale(${0.8 + this.animationProgress * 0.2})`;
        });
    }

    resetTransformation() {
        this.animationProgress = 0;
        this.updateMaturityScore();
        this.updateVisualTransformation();
        this.announce('Transformation reset to initial state');
    }

    skipToEnd() {
        this.animationProgress = 1;
        this.updateMaturityScore();
        this.updateVisualTransformation();
        this.announce('Jumped to transformed state');
    }

    updateComparison(value) {
        const percentage = parseFloat(value);
        const blendedMaturity = this.currentMaturity + (this.targetMaturity - this.currentMaturity) * (percentage / 100);
        
        // Update comparison visualization
        const scoreElement = document.getElementById('maturityScore');
        if (scoreElement) {
            scoreElement.textContent = Math.round(blendedMaturity);
        }
        
        // Update slider fill
        const sliderFill = this.container.querySelector('.slider-fill');
        if (sliderFill) {
            sliderFill.style.width = `${percentage}%`;
        }
    }

    highlightElement(element, stateType) {
        element.style.transform = 'scale(1.1) translateY(-4px)';
        element.style.zIndex = '10';
        element.style.boxShadow = '0 10px 25px rgba(124, 58, 237, 0.3)';
        
        this.showElementTooltip(element, stateType);
    }

    resetElementHighlight(element) {
        element.style.transform = '';
        element.style.zIndex = '';
        element.style.boxShadow = '';
        
        this.hideElementTooltip();
    }

    showElementDetails(element, stateType, index) {
        const elementName = element.querySelector('span').textContent;
        const details = this.getElementDetails(elementName, stateType);
        
        this.announce(`${elementName}: ${details.description}`);
        
        // Show detailed modal or inline expansion
        this.showDetailModal(details);
    }

    getElementDetails(elementName, stateType) {
        const detailsMap = {
            'current': {
                'Sistemi Legacy': {
                    description: 'Sistemi datati che limitano la scalabilità e aumentano i costi di manutenzione.',
                    impact: 'Bassa efficienza operativa, costi elevati',
                    metrics: { efficiency: '45%', cost: 'Alto', scalability: 'Bassa' }
                },
                'Processi Manuali': {
                    description: 'Attività ripetitive gestite manualmente, soggette a errori e lentezza.',
                    impact: 'Spreco di risorse, alta probabilità di errori',
                    metrics: { efficiency: '35%', cost: 'Molto Alto', scalability: 'Nulla' }
                },
                'Silos Organizzativi': {
                    description: 'Dipartimenti isolati che non condividono dati e processi.',
                    impact: 'Comunicazione frammentata, duplicazione sforzi',
                    metrics: { efficiency: '40%', cost: 'Alto', scalability: 'Bassa' }
                }
            },
            'future': {
                'Cloud Native': {
                    description: 'Architettura moderna, scalabile e resiliente basata su microservizi.',
                    impact: 'Scalabilità infinita, costi ottimizzati',
                    metrics: { efficiency: '90%', cost: 'Basso', scalability: 'Alta' }
                },
                'Automazione': {
                    description: 'Processi automatizzati con AI e machine learning per massima efficienza.',
                    impact: 'Velocità 10x, zero errori umani',
                    metrics: { efficiency: '95%', cost: 'Molto Basso', scalability: 'Alta' }
                },
                'Ecosystem Integrato': {
                    description: 'Piattaforma unificata che connette tutti i sistemi e dipartimenti.',
                    impact: 'Visibilità totale, decisioni data-driven',
                    metrics: { efficiency: '85%', cost: 'Medio', scalability: 'Alta' }
                }
            }
        };
        
        return detailsMap[stateType]?.[elementName] || {
            description: 'Elemento del sistema di trasformazione digitale.',
            impact: 'Impatto sulla trasformazione',
            metrics: { efficiency: 'N/A', cost: 'N/A', scalability: 'N/A' }
        };
    }

    showElementTooltip(element, stateType) {
        const elementName = element.querySelector('span').textContent;
        const details = this.getElementDetails(elementName, stateType);
        
        const tooltip = this.createTooltip(elementName, details);
        document.body.appendChild(tooltip);
        
        // Position tooltip
        const elementRect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        tooltip.style.left = `${elementRect.left + elementRect.width / 2 - tooltipRect.width / 2}px`;
        tooltip.style.top = `${elementRect.top - tooltipRect.height - 10}px`;
        
        requestAnimationFrame(() => {
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'translateY(0)';
        });
    }

    createTooltip(title, details) {
        const existingTooltip = document.getElementById('transformation-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }

        const tooltip = document.createElement('div');
        tooltip.id = 'transformation-tooltip';
        tooltip.className = 'transformation-tooltip';
        
        tooltip.innerHTML = `
            <div class="tooltip-arrow"></div>
            <h4>${title}</h4>
            <p>${details.description}</p>
            <div class="tooltip-metrics">
                <div class="metric-item">
                    <span class="metric-label">Efficienza</span>
                    <span class="metric-value">${details.metrics.efficiency}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Costo</span>
                    <span class="metric-value">${details.metrics.cost}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Scalabilità</span>
                    <span class="metric-value">${details.metrics.scalability}</span>
                </div>
            </div>
        `;

        tooltip.style.cssText = `
            position: fixed;
            background: white;
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            border: 1px solid #e5e7eb;
            max-width: 320px;
            z-index: 1000;
            opacity: 0;
            transform: translateY(-10px);
            transition: all 0.3s ease;
            pointer-events: none;
        `;

        return tooltip;
    }

    hideElementTooltip() {
        const tooltip = document.getElementById('transformation-tooltip');
        if (tooltip) {
            tooltip.style.opacity = '0';
            tooltip.style.transform = 'translateY(-10px)';
            setTimeout(() => tooltip.remove(), 300);
        }
    }

    showMetricDetails(metric, index) {
        const metricType = metric.querySelector('.metric-label').textContent;
        const metricValue = metric.querySelector('.metric-value').textContent;
        
        const detailsMap = {
            'ROI Annuale': {
                description: 'Ritorno sull\'investimento calcolato su base annuale, considerando risparmi operativi e nuove opportunità di business.',
                calculation: 'Risparmi + Nuovi Ricavi - Investimenti',
                timeline: '12-18 mesi per ROI completo'
            },
            'Efficienza': {
                description: 'Incremento della produttività attraverso automazione, ottimizzazione processi e riduzione tempi di attività.',
                calculation: 'Tempo Risparmiato / Tempo Totale * 100',
                timeline: '3-6 mesi per risultati visibili'
            }
        };
        
        const details = detailsMap[metricType] || {
            description: 'Metrica di performance della trasformazione digitale.',
            calculation: 'Calcolata in base agli obiettivi specifici',
            timeline: 'Varia in base al progetto'
        };
        
        this.announce(`${metricType}: ${metricValue}. ${details.description}`);
    }

    showDetailModal(details) {
        const modal = document.createElement('div');
        modal.className = 'transformation-detail-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${details.title || 'Dettagli Elemento'}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p>${details.description}</p>
                    <div class="detail-metrics">
                        ${Object.entries(details.metrics).map(([key, value]) => `
                            <div class="detail-metric">
                                <span class="metric-name">${key}</span>
                                <span class="metric-result">${value}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal handlers
        const closeBtn = modal.querySelector('.modal-close');
        const overlay = modal.querySelector('.modal-overlay');
        
        [closeBtn, overlay].forEach(element => {
            element.addEventListener('click', () => {
                modal.remove();
            });
        });
        
        // Escape key handler
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    announce(message) {
        const liveRegion = document.getElementById('transformation-announcements');
        if (liveRegion) {
            liveRegion.textContent = message;
        }
    }

    // Public API methods
    setMaturityScore(score) {
        this.currentMaturity = Math.max(0, Math.min(100, score));
        this.updateMaturityScore();
    }

    setTargetScore(score) {
        this.targetMaturity = Math.max(0, Math.min(100, score));
    }

    getMaturityData() {
        return {
            current: this.currentMaturity,
            target: this.targetMaturity,
            progress: this.animationProgress
        };
    }

    destroy() {
        this.pauseAnimation();
        this.hideElementTooltip();
        
        // Clean up live region
        const liveRegion = document.getElementById('transformation-announcements');
        if (liveRegion) {
            liveRegion.remove();
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const transformationJourney = new TransformationJourney();
    
    // Make available globally
    window.transformationJourney = transformationJourney;
    
    // Global control functions
    window.setTransformationMaturity = function(current, target) {
        if (window.transformationJourney) {
            window.transformationJourney.setMaturityScore(current);
            window.transformationJourney.setTargetScore(target);
        }
    };
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TransformationJourney;
}