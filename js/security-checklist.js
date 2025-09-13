/**
 * IT-ERA Security Checklist - Interactive PMI Security Guide
 * Checklist interattiva per la sicurezza informatica delle PMI
 */

class ITERASecurityChecklist {
    constructor() {
        this.checklist = [
            {
                id: 'firewall',
                category: 'Protezione Perimetrale',
                title: 'Firewall Aziendale Configurato',
                description: 'Firewall hardware o software configurato per bloccare traffico non autorizzato',
                priority: 'high',
                difficulty: 'medium'
            },
            {
                id: 'antivirus',
                category: 'Protezione Endpoint',
                title: 'Antivirus Enterprise su Tutti i Dispositivi',
                description: 'Soluzione antivirus/anti-malware professionale su PC, server e dispositivi mobili',
                priority: 'high',
                difficulty: 'easy'
            },
            {
                id: 'backup',
                category: 'Backup e Recovery',
                title: 'Backup Automatici Giornalieri',
                description: 'Sistema di backup automatico con copie multiple (locale + cloud)',
                priority: 'critical',
                difficulty: 'medium'
            },
            {
                id: 'updates',
                category: 'Aggiornamenti',
                title: 'Aggiornamenti Automatici di Sicurezza',
                description: 'Sistema operativo e software sempre aggiornati con patch di sicurezza',
                priority: 'high',
                difficulty: 'easy'
            },
            {
                id: '2fa',
                category: 'Autenticazione',
                title: 'Autenticazione a Due Fattori (2FA)',
                description: '2FA attivato su tutti gli account critici (email, cloud, amministrazione)',
                priority: 'high',
                difficulty: 'easy'
            },
            {
                id: 'passwords',
                category: 'Gestione Password',
                title: 'Password Manager Aziendale',
                description: 'Gestore password condiviso per password complesse e uniche',
                priority: 'medium',
                difficulty: 'easy'
            },
            {
                id: 'wifi',
                category: 'Rete Wireless',
                title: 'Wi-Fi Aziendale Sicuro',
                description: 'Rete Wi-Fi con crittografia WPA3 e rete ospiti separata',
                priority: 'medium',
                difficulty: 'medium'
            },
            {
                id: 'training',
                category: 'Formazione',
                title: 'Training Anti-Phishing Dipendenti',
                description: 'Formazione periodica del personale su riconoscimento phishing e social engineering',
                priority: 'high',
                difficulty: 'medium'
            },
            {
                id: 'policies',
                category: 'Policy Aziendali',
                title: 'Policy di Sicurezza Documentate',
                description: 'Procedure scritte per sicurezza IT, uso dispositivi, gestione incidenti',
                priority: 'medium',
                difficulty: 'medium'
            },
            {
                id: 'access',
                category: 'Controllo Accessi',
                title: 'Controllo Accessi Basato su Ruoli',
                description: 'Accesso ai dati limitato in base al ruolo lavorativo (principio del minimo privilegio)',
                priority: 'high',
                difficulty: 'hard'
            },
            {
                id: 'monitoring',
                category: 'Monitoraggio',
                title: 'Monitoraggio Attività di Rete',
                description: 'Sistema di monitoraggio per rilevare attività sospette e intrusioni',
                priority: 'medium',
                difficulty: 'hard'
            },
            {
                id: 'encryption',
                category: 'Crittografia',
                title: 'Crittografia Dati Sensibili',
                description: 'Dati sensibili crittografati sia in transito che a riposo',
                priority: 'high',
                difficulty: 'hard'
            },
            {
                id: 'incident',
                category: 'Gestione Incidenti',
                title: 'Piano di Risposta agli Incidenti',
                description: 'Procedura documentata per gestire violazioni di sicurezza e recovery',
                priority: 'medium',
                difficulty: 'medium'
            },
            {
                id: 'gdpr',
                category: 'Compliance',
                title: 'Conformità GDPR',
                description: 'Adeguamento al GDPR con privacy policy, consensi e registro trattamenti',
                priority: 'critical',
                difficulty: 'hard'
            },
            {
                id: 'mobile',
                category: 'Dispositivi Mobili',
                title: 'Mobile Device Management (MDM)',
                description: 'Gestione centralizzata di smartphone e tablet aziendali',
                priority: 'medium',
                difficulty: 'medium'
            }
        ];
        
        this.completedItems = this.loadProgress();
        this.init();
    }
    
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.render());
        } else {
            this.render();
        }
    }
    
    render() {
        const container = document.getElementById('security-checklist');
        if (!container) return;
        
        // Group by category
        const categories = this.groupByCategory();
        
        let html = '';
        Object.keys(categories).forEach(category => {
            html += this.renderCategory(category, categories[category]);
        });
        
        // Add progress bar
        html = this.renderProgressBar() + html;
        
        container.innerHTML = html;
        
        // Add event listeners
        this.attachEventListeners();
        
        console.log('✅ Security checklist rendered');
    }
    
    groupByCategory() {
        const categories = {};
        this.checklist.forEach(item => {
            if (!categories[item.category]) {
                categories[item.category] = [];
            }
            categories[item.category].push(item);
        });
        return categories;
    }
    
    renderProgressBar() {
        const completed = this.completedItems.length;
        const total = this.checklist.length;
        const percentage = Math.round((completed / total) * 100);
        
        let statusColor = 'bg-red-500';
        let statusText = 'Rischio Alto';
        
        if (percentage >= 80) {
            statusColor = 'bg-green-500';
            statusText = 'Protezione Ottima';
        } else if (percentage >= 60) {
            statusColor = 'bg-yellow-500';
            statusText = 'Protezione Buona';
        } else if (percentage >= 40) {
            statusColor = 'bg-orange-500';
            statusText = 'Protezione Sufficiente';
        }
        
        return `
            <div class="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="font-semibold text-gray-900">Livello di Sicurezza</h4>
                    <span class="text-sm font-medium text-gray-600">${completed}/${total} completati</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div class="${statusColor} h-3 rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-sm font-medium text-gray-700">${statusText}</span>
                    <span class="text-lg font-bold text-gray-900">${percentage}%</span>
                </div>
            </div>
        `;
    }
    
    renderCategory(categoryName, items) {
        const categoryId = categoryName.toLowerCase().replace(/\s+/g, '-');
        
        return `
            <div class="mb-6">
                <h4 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <i class="fas fa-folder text-blue-600 mr-2"></i>
                    ${categoryName}
                </h4>
                <div class="space-y-3">
                    ${items.map(item => this.renderChecklistItem(item)).join('')}
                </div>
            </div>
        `;
    }
    
    renderChecklistItem(item) {
        const isCompleted = this.completedItems.includes(item.id);
        const priorityColors = {
            critical: 'border-red-500 bg-red-50',
            high: 'border-orange-500 bg-orange-50',
            medium: 'border-yellow-500 bg-yellow-50',
            low: 'border-green-500 bg-green-50'
        };
        
        const difficultyIcons = {
            easy: 'fas fa-star text-green-500',
            medium: 'fas fa-star-half-alt text-yellow-500',
            hard: 'fas fa-star text-red-500'
        };
        
        const priorityLabels = {
            critical: 'CRITICO',
            high: 'ALTO',
            medium: 'MEDIO',
            low: 'BASSO'
        };
        
        return `
            <div class="flex items-start space-x-3 p-4 border-l-4 ${priorityColors[item.priority]} rounded-r-lg">
                <div class="flex-shrink-0 mt-1">
                    <input type="checkbox" 
                           id="check-${item.id}" 
                           class="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                           ${isCompleted ? 'checked' : ''}
                           onchange="window.securityChecklist.toggleItem('${item.id}')">
                </div>
                <div class="flex-grow">
                    <div class="flex items-center justify-between mb-1">
                        <label for="check-${item.id}" class="font-medium text-gray-900 cursor-pointer ${isCompleted ? 'line-through text-gray-500' : ''}">
                            ${item.title}
                        </label>
                        <div class="flex items-center space-x-2">
                            <span class="text-xs font-bold px-2 py-1 rounded ${item.priority === 'critical' ? 'bg-red-100 text-red-800' : item.priority === 'high' ? 'bg-orange-100 text-orange-800' : item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">
                                ${priorityLabels[item.priority]}
                            </span>
                            <i class="${difficultyIcons[item.difficulty]}" title="Difficoltà: ${item.difficulty}"></i>
                        </div>
                    </div>
                    <p class="text-sm text-gray-600 ${isCompleted ? 'line-through' : ''}">
                        ${item.description}
                    </p>
                </div>
            </div>
        `;
    }
    
    toggleItem(itemId) {
        const index = this.completedItems.indexOf(itemId);
        if (index > -1) {
            this.completedItems.splice(index, 1);
        } else {
            this.completedItems.push(itemId);
        }
        
        this.saveProgress();
        this.updateProgressBar();
        
        // Track analytics
        if (window.ITERAAnalytics) {
            window.ITERAAnalytics.trackEvent('security_checklist_item_toggled', {
                item_id: itemId,
                completed: this.completedItems.includes(itemId),
                total_completed: this.completedItems.length,
                completion_percentage: Math.round((this.completedItems.length / this.checklist.length) * 100)
            });
        }
    }
    
    updateProgressBar() {
        // Re-render just the progress bar
        const container = document.getElementById('security-checklist');
        if (!container) return;
        
        const progressBarHtml = this.renderProgressBar();
        const firstChild = container.firstElementChild;
        
        if (firstChild && firstChild.classList.contains('mb-6')) {
            firstChild.outerHTML = progressBarHtml;
        }
    }
    
    attachEventListeners() {
        // Event listeners are handled inline in the HTML for simplicity
        // This method can be used for additional event handling if needed
    }
    
    saveProgress() {
        try {
            localStorage.setItem('itera_security_checklist', JSON.stringify(this.completedItems));
        } catch (error) {
            console.warn('Could not save checklist progress:', error);
        }
    }
    
    loadProgress() {
        try {
            const saved = localStorage.getItem('itera_security_checklist');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.warn('Could not load checklist progress:', error);
            return [];
        }
    }
    
    resetProgress() {
        this.completedItems = [];
        this.saveProgress();
        this.render();
    }
    
    getCompletionStats() {
        const completed = this.completedItems.length;
        const total = this.checklist.length;
        const percentage = Math.round((completed / total) * 100);
        
        const criticalItems = this.checklist.filter(item => item.priority === 'critical');
        const completedCritical = criticalItems.filter(item => this.completedItems.includes(item.id));
        
        return {
            completed,
            total,
            percentage,
            criticalTotal: criticalItems.length,
            criticalCompleted: completedCritical.length,
            criticalPercentage: Math.round((completedCritical.length / criticalItems.length) * 100)
        };
    }
}

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
    window.securityChecklist = new ITERASecurityChecklist();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ITERASecurityChecklist;
}
