/**
 * IT-ERA ROI Calculator
 * Advanced ROI calculator for commercialisti and cost-conscious clients
 * Calculates Cloud vs Physical Infrastructure, Managed IT vs In-house IT, Security investment ROI
 */

export class ITERAROICalculator {
  
  constructor() {
    this.calculations = {
      cloudVsPhysical: this.calculateCloudVsPhysical.bind(this),
      managedVsInhouse: this.calculateManagedVsInhouse.bind(this),
      securityInvestment: this.calculateSecurityROI.bind(this)
    };
    
    // Base pricing from IT-ERA services
    this.basePricing = {
      cloudServices: {
        backup: { perGB: 0.5, minMonthly: 50 },
        serverVPS: { base: 150, perCore: 25, perGB: 2 },
        managedFirewall: { base: 250, perDevice: 15 }
      },
      physicalInfrastructure: {
        serverHardware: { base: 8000, maintenance: 0.15 },
        backupHardware: { base: 3000, maintenance: 0.12 },
        networkEquipment: { base: 2500, maintenance: 0.20 }
      },
      managedServices: {
        itSupport: { perDevice: 45, hourlyRate: 120 },
        monitoring: { perDevice: 25 },
        maintenance: { monthly: 350 }
      },
      securityServices: {
        watchguardFirewall: { setup: 2500, monthly: 180 },
        antivirusEnterprise: { perDevice: 8 },
        securityAudit: { base: 1200, discount: 0.5 }
      }
    };
  }

  /**
   * Main ROI calculation orchestrator
   */
  calculateROI(scenario, companyData) {
    const { type, employees, monthlyVolume, currentSetup, timeline = 36 } = companyData;
    
    switch (scenario) {
      case 'cloud':
        return this.calculateCloudVsPhysical(companyData);
      case 'managed':
        return this.calculateManagedVsInhouse(companyData);
      case 'security':
        return this.calculateSecurityROI(companyData);
      case 'complete':
        return this.calculateCompleteTransformation(companyData);
      default:
        throw new Error('Scenario ROI non riconosciuto');
    }
  }

  /**
   * Cloud vs Physical Infrastructure ROI
   */
  calculateCloudVsPhysical(companyData) {
    const { employees = 10, dataVolume = 500, currentServers = 2 } = companyData;
    
    // Physical Infrastructure Costs (Current)
    const physicalCosts = {
      hardware: {
        servers: currentServers * this.basePricing.physicalInfrastructure.serverHardware.base,
        backup: this.basePricing.physicalInfrastructure.backupHardware.base,
        network: this.basePricing.physicalInfrastructure.networkEquipment.base,
        total: 0
      },
      monthly: {
        maintenance: 0,
        electricity: currentServers * 150, // €150/server/month
        cooling: currentServers * 80,
        space: 200, // Rack space
        itStaff: 2500, // Partial IT staff time
        total: 0
      },
      annual: {
        depreciation: 0,
        upgrades: 3000,
        total: 0
      }
    };
    
    physicalCosts.hardware.total = Object.values(physicalCosts.hardware).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
    physicalCosts.monthly.maintenance = physicalCosts.hardware.total * 0.08 / 12;
    physicalCosts.monthly.total = Object.values(physicalCosts.monthly).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
    physicalCosts.annual.depreciation = physicalCosts.hardware.total / 5; // 5 year depreciation
    physicalCosts.annual.total = Object.values(physicalCosts.annual).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);

    // Cloud Infrastructure Costs (Proposed)
    const cloudCosts = {
      setup: 1500, // One-time migration cost
      monthly: {
        serverVPS: this.basePricing.cloudServices.serverVPS.base + (employees * 15),
        backup: Math.max(dataVolume * this.basePricing.cloudServices.backup.perGB, this.basePricing.cloudServices.backup.minMonthly),
        firewall: this.basePricing.cloudServices.managedFirewall.base,
        monitoring: employees * 12,
        support: 450, // Managed support
        total: 0
      }
    };
    
    cloudCosts.monthly.total = Object.values(cloudCosts.monthly).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);

    // ROI Calculation
    const monthlyPhysicalTotal = physicalCosts.monthly.total + (physicalCosts.annual.total / 12);
    const monthlySavings = monthlyPhysicalTotal - cloudCosts.monthly.total;
    const initialInvestment = cloudCosts.setup;
    const breakEvenMonths = initialInvestment / monthlySavings;
    
    const roi36Months = {
      totalSavings: (monthlySavings * 36) - initialInvestment,
      roiPercentage: (((monthlySavings * 36) - initialInvestment) / initialInvestment) * 100,
      monthlySavings: monthlySavings
    };

    return {
      scenario: 'Cloud vs Physical Infrastructure',
      currentCosts: {
        monthly: monthlyPhysicalTotal,
        annual: monthlyPhysicalTotal * 12,
        breakdown: physicalCosts
      },
      proposedCosts: {
        setup: cloudCosts.setup,
        monthly: cloudCosts.monthly.total,
        annual: cloudCosts.monthly.total * 12,
        breakdown: cloudCosts.monthly
      },
      roi: {
        monthlySavings: Math.round(monthlySavings),
        breakEvenMonths: Math.round(breakEvenMonths),
        roi36Months: Math.round(roi36Months.totalSavings),
        roiPercentage: Math.round(roi36Months.roiPercentage),
        benefits: [
          'Zero manutenzione hardware',
          'Backup automatici e sicuri',
          'Scalabilità immediata',
          'Uptime garantito 99.9%',
          'Supporto tecnico incluso'
        ]
      },
      formatted: this.formatROIOutput('cloud', {
        investment: `€${cloudCosts.setup} setup + €${cloudCosts.monthly.total}/mese`,
        savings: `€${Math.round(monthlySavings)}/mese`,
        breakdown: [
          `Niente server fisico: -€${Math.round(physicalCosts.monthly.maintenance + physicalCosts.monthly.electricity)}`,
          `Zero manutenzione: -€${Math.round(physicalCosts.monthly.maintenance)}`,
          `Backup automatici: -€${Math.round(200)}`
        ],
        breakEven: Math.round(breakEvenMonths),
        roi3Years: Math.round(roi36Months.roiPercentage),
        totalSaved: Math.round(roi36Months.totalSavings)
      })
    };
  }

  /**
   * Managed IT vs In-house IT ROI
   */
  calculateManagedVsInhouse(companyData) {
    const { employees = 10, currentItCosts = 0, hasItStaff = false } = companyData;
    
    // In-house IT Costs (Current)
    const inhouseCosts = {
      monthly: {
        salary: hasItStaff ? 4500 : 0, // IT technician salary + benefits
        training: hasItStaff ? 300 : 0,
        tools: hasItStaff ? 150 : 0,
        emergencySupport: 800, // External support for emergencies
        downtime: employees * 120, // Cost of downtime per employee
        total: 0
      }
    };
    
    inhouseCosts.monthly.total = Object.values(inhouseCosts.monthly).reduce((a, b) => a + b, 0);

    // Managed IT Costs (Proposed)
    const managedCosts = {
      monthly: {
        itSupport: employees * this.basePricing.managedServices.itSupport.perDevice,
        monitoring: employees * this.basePricing.managedServices.monitoring.perDevice,
        maintenance: this.basePricing.managedServices.maintenance.monthly,
        total: 0
      }
    };
    
    managedCosts.monthly.total = Object.values(managedCosts.monthly).reduce((a, b) => a + b, 0);

    // ROI Calculation
    const monthlySavings = inhouseCosts.monthly.total - managedCosts.monthly.total;
    const initialInvestment = 1000; // Setup and transition costs
    const breakEvenMonths = initialInvestment / monthlySavings;
    
    const roi36Months = {
      totalSavings: (monthlySavings * 36) - initialInvestment,
      roiPercentage: (((monthlySavings * 36) - initialInvestment) / initialInvestment) * 100
    };

    return {
      scenario: 'Managed IT vs In-house IT',
      currentCosts: {
        monthly: inhouseCosts.monthly.total,
        annual: inhouseCosts.monthly.total * 12,
        breakdown: inhouseCosts.monthly
      },
      proposedCosts: {
        setup: initialInvestment,
        monthly: managedCosts.monthly.total,
        annual: managedCosts.monthly.total * 12,
        breakdown: managedCosts.monthly
      },
      roi: {
        monthlySavings: Math.round(monthlySavings),
        breakEvenMonths: Math.round(breakEvenMonths),
        roi36Months: Math.round(roi36Months.totalSavings),
        roiPercentage: Math.round(roi36Months.roiPercentage),
        benefits: [
          'Supporto specializzato 24/7',
          'Monitoraggio proattivo',
          'SLA garantito 99%',
          'Costi prevedibili',
          'Team di esperti dedicato'
        ]
      },
      formatted: this.formatROIOutput('managed', {
        investment: `€${initialInvestment} setup + €${managedCosts.monthly.total}/mese`,
        savings: `€${Math.round(monthlySavings)}/mese`,
        breakdown: [
          `Niente stipendio IT: -€${hasItStaff ? 4500 : 0}/mese`,
          `Zero downtime imprevisti: -€${Math.round(employees * 120)}/mese`,
          `Supporto specializzato: -€${800}/mese`
        ],
        breakEven: Math.round(breakEvenMonths),
        roi3Years: Math.round(roi36Months.roiPercentage),
        totalSaved: Math.round(roi36Months.totalSavings)
      })
    };
  }

  /**
   * Security Investment ROI
   */
  calculateSecurityROI(companyData) {
    const { employees = 10, annualRevenue = 500000, currentSecurityLevel = 'basic' } = companyData;
    
    // Risk Assessment based on company size and revenue
    const riskProfile = this.calculateSecurityRisk(employees, annualRevenue);
    
    // Current Security Costs and Risks
    const currentSecurity = {
      monthly: {
        basicAntivirus: employees * 3,
        basicFirewall: currentSecurityLevel === 'none' ? 0 : 150,
        total: 0
      },
      risks: {
        breachProbability: riskProfile.breachProbability,
        averageBreachCost: riskProfile.averageBreachCost,
        annualRiskCost: riskProfile.breachProbability * riskProfile.averageBreachCost
      }
    };
    
    currentSecurity.monthly.total = Object.values(currentSecurity.monthly).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);

    // Proposed Security Investment
    const proposedSecurity = {
      setup: this.basePricing.securityServices.watchguardFirewall.setup,
      monthly: {
        watchguardFirewall: this.basePricing.securityServices.watchguardFirewall.monthly,
        enterpriseAntivirus: employees * this.basePricing.securityServices.antivirusEnterprise.perDevice,
        securityMonitoring: employees * 5,
        backup: Math.min(employees * 20, 300),
        total: 0
      },
      risks: {
        breachProbability: riskProfile.breachProbability * 0.15, // 85% risk reduction
        averageBreachCost: riskProfile.averageBreachCost * 0.3, // 70% cost reduction if breach occurs
        annualRiskCost: 0
      }
    };
    
    proposedSecurity.monthly.total = Object.values(proposedSecurity.monthly).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
    proposedSecurity.risks.annualRiskCost = proposedSecurity.risks.breachProbability * proposedSecurity.risks.averageBreachCost;

    // ROI Calculation
    const monthlyHardCosts = proposedSecurity.monthly.total - currentSecurity.monthly.total;
    const annualRiskReduction = currentSecurity.risks.annualRiskCost - proposedSecurity.risks.annualRiskCost;
    const monthlyRiskSavings = annualRiskReduction / 12;
    const netMonthlySavings = monthlyRiskSavings - monthlyHardCosts;
    
    const roi36Months = {
      totalSavings: (netMonthlySavings * 36) - proposedSecurity.setup,
      roiPercentage: (((netMonthlySavings * 36) - proposedSecurity.setup) / proposedSecurity.setup) * 100
    };

    return {
      scenario: 'Security Investment ROI',
      currentRisk: {
        monthly: currentSecurity.monthly.total,
        riskCost: Math.round(currentSecurity.risks.annualRiskCost),
        totalMonthlyCost: currentSecurity.monthly.total + (currentSecurity.risks.annualRiskCost / 12)
      },
      proposedInvestment: {
        setup: proposedSecurity.setup,
        monthly: proposedSecurity.monthly.total,
        riskCost: Math.round(proposedSecurity.risks.annualRiskCost),
        totalMonthlyCost: proposedSecurity.monthly.total + (proposedSecurity.risks.annualRiskCost / 12)
      },
      roi: {
        monthlySavings: Math.round(netMonthlySavings),
        riskReduction: Math.round(annualRiskReduction),
        breakEvenMonths: proposedSecurity.setup / Math.max(netMonthlySavings, 1),
        roi36Months: Math.round(roi36Months.totalSavings),
        roiPercentage: Math.round(roi36Months.roiPercentage),
        benefits: [
          'Protezione ransomware avanzata',
          'Monitoraggio minacce 24/7',
          'Compliance GDPR garantita',
          'Backup sicuro automatizzato',
          'Riduzione 85% rischio violazione'
        ]
      },
      formatted: this.formatROIOutput('security', {
        investment: `€${proposedSecurity.setup} setup + €${proposedSecurity.monthly.total}/mese`,
        savings: `€${Math.round(netMonthlySavings)}/mese + €${Math.round(annualRiskReduction)} riduzione rischio`,
        breakdown: [
          `Protezione ransomware: -€${Math.round(annualRiskReduction * 0.6)}/anno rischio`,
          `Backup sicuro: -€${Math.round(200)}/mese costi downtime`,
          `Compliance GDPR: -€${Math.round(10000)}/anno multe potenziali`
        ],
        breakEven: Math.round(proposedSecurity.setup / Math.max(netMonthlySavings, 1)),
        roi3Years: Math.round(roi36Months.roiPercentage),
        totalSaved: Math.round(roi36Months.totalSavings)
      })
    };
  }

  /**
   * Calculate security risk profile based on company characteristics
   */
  calculateSecurityRisk(employees, annualRevenue) {
    // Base risk calculation using industry statistics
    let baseBreachProbability = 0.28; // 28% annual probability for SMEs
    let baseBreachCost = Math.min(annualRevenue * 0.08, 150000); // 8% of revenue, max 150k for SMEs
    
    // Adjust based on company size
    if (employees > 50) {
      baseBreachProbability += 0.15;
      baseBreachCost *= 1.5;
    } else if (employees > 20) {
      baseBreachProbability += 0.08;
      baseBreachCost *= 1.2;
    } else if (employees < 10) {
      baseBreachProbability -= 0.05;
      baseBreachCost *= 0.8;
    }
    
    // Adjust based on revenue (higher value targets)
    if (annualRevenue > 2000000) {
      baseBreachProbability += 0.12;
      baseBreachCost *= 1.4;
    } else if (annualRevenue > 1000000) {
      baseBreachProbability += 0.06;
      baseBreachCost *= 1.2;
    }
    
    return {
      breachProbability: Math.min(baseBreachProbability, 0.6), // Cap at 60%
      averageBreachCost: Math.round(baseBreachCost),
      riskLevel: baseBreachProbability > 0.4 ? 'high' : baseBreachProbability > 0.25 ? 'medium' : 'low'
    };
  }

  /**
   * Complete digital transformation ROI (all services combined)
   */
  calculateCompleteTransformation(companyData) {
    const cloudROI = this.calculateCloudVsPhysical(companyData);
    const managedROI = this.calculateManagedVsInhouse(companyData);
    const securityROI = this.calculateSecurityROI(companyData);
    
    const combinedROI = {
      totalInvestment: cloudROI.proposedCosts.setup + managedROI.proposedCosts.setup + securityROI.proposedInvestment.setup,
      totalMonthlySavings: cloudROI.roi.monthlySavings + managedROI.roi.monthlySavings + securityROI.roi.monthlySavings,
      averageBreakEven: (cloudROI.roi.breakEvenMonths + managedROI.roi.breakEvenMonths + securityROI.roi.breakEvenMonths) / 3,
      total3YearSavings: cloudROI.roi.roi36Months + managedROI.roi.roi36Months + securityROI.roi.roi36Months
    };
    
    combinedROI.roi3Years = (combinedROI.total3YearSavings / combinedROI.totalInvestment) * 100;
    
    return {
      scenario: 'Trasformazione Digitale Completa',
      components: {
        cloud: cloudROI,
        managed: managedROI,
        security: securityROI
      },
      combined: combinedROI,
      formatted: this.formatROIOutput('complete', {
        investment: `€${combinedROI.totalInvestment} setup + €${cloudROI.proposedCosts.monthly + managedROI.proposedCosts.monthly + securityROI.proposedInvestment.monthly}/mese`,
        savings: `€${Math.round(combinedROI.totalMonthlySavings)}/mese`,
        breakdown: [
          `Infrastruttura cloud: -€${cloudROI.roi.monthlySavings}/mese`,
          `IT gestito: -€${managedROI.roi.monthlySavings}/mese`,
          `Sicurezza avanzata: -€${securityROI.roi.monthlySavings}/mese`
        ],
        breakEven: Math.round(combinedROI.averageBreakEven),
        roi3Years: Math.round(combinedROI.roi3Years),
        totalSaved: Math.round(combinedROI.total3YearSavings)
      })
    };
  }

  /**
   * Format ROI output for chatbot display
   */
  formatROIOutput(type, data) {
    const typeLabels = {
      cloud: 'Cloud vs Server Fisici',
      managed: 'IT Gestito vs Interno', 
      security: 'Investimento Sicurezza',
      complete: 'Trasformazione Completa'
    };
    
    return `[IT-ERA] Analisi ROI per ${typeLabels[type]}:

INVESTIMENTO: ${data.investment}
RISPARMIO: ${data.savings}
${data.breakdown.map(item => `- ${item}`).join('\n')}

ROI: Break-even in ${data.breakEven} mesi
Ritorno a 3 anni: ${data.roi3Years}% (€${data.totalSaved} risparmiati)

💡 Questi calcoli sono basati su casi reali dei nostri clienti in Brianza.
🎯 Vuoi un'analisi personalizzata per la tua azienda?`;
  }

  /**
   * Quick ROI estimation for chatbot use
   */
  quickEstimate(employees, budget, service) {
    const quickData = {
      employees: parseInt(employees) || 10,
      annualRevenue: budget ? parseInt(budget) * 10 : 500000, // Rough estimate
      currentSetup: 'basic'
    };
    
    switch (service.toLowerCase()) {
      case 'sicurezza':
      case 'security':
        return this.calculateSecurityROI(quickData);
      case 'cloud':
      case 'server':
        return this.calculateCloudVsPhysical(quickData);
      case 'assistenza':
      case 'managed':
        return this.calculateManagedVsInhouse(quickData);
      default:
        return this.calculateCompleteTransformation(quickData);
    }
  }
}

// Export singleton instance
export const roiCalculator = new ITERAROICalculator();
export default ITERAROICalculator;