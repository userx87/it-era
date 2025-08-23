/**
 * Cloudflare Worker - API Calcolo Preventivi IT-ERA
 * Calcola prezzi dinamici in base a parametri aziendali
 */

// Configurazione prezzi base
const PRICING = {
  // Pacchetti base mensili
  packages: {
    helpdesk: {
      name: 'Help Desk',
      basePrice: 290,
      maxWorkstations: 20,
      included: ['remote_support', 'ticket_system', 'business_hours'],
    },
    full: {
      name: 'Assistenza Full',
      basePrice: 590,
      maxWorkstations: 50,
      included: ['remote_support', 'onsite_support', 'monitoring', 'backup_management', 'sla_4h'],
    },
    enterprise: {
      name: 'Enterprise',
      basePrice: 1290,
      maxWorkstations: 200,
      included: ['all_services', 'dedicated_technician', 'sla_2h', 'quarterly_audit'],
    }
  },
  
  // Servizi aggiuntivi
  addons: {
    cybersecurity: {
      name: 'Cybersecurity Avanzata',
      basePrice: 150,
      pricePerWorkstation: 8,
    },
    backup: {
      name: 'Backup & Disaster Recovery',
      basePrice: 200,
      pricePerGB: 0.05,
    },
    microsoft365: {
      name: 'Microsoft 365 Management',
      pricePerUser: 5,
    },
    monitoring: {
      name: 'Monitoraggio 24/7',
      basePrice: 100,
      pricePerDevice: 3,
    },
  },
  
  // Monte ore
  hourlyPackages: {
    30: { hours: 30, price: 2100, discount: 0.07 },
    50: { hours: 50, price: 3375, discount: 0.10 },
    80: { hours: 80, price: 5100, discount: 0.15 },
    custom: { pricePerHour: 75 },
  },
  
  // Moltiplicatori per settore
  sectorMultipliers: {
    healthcare: 1.3,      // Sanità - requisiti compliance alti
    finance: 1.25,        // Finanza - sicurezza critica
    manufacturing: 1.1,   // Manifatturiero - uptime critico
    retail: 1.05,         // Retail - standard
    professional: 1.0,    // Studi professionali
    education: 0.9,       // Scuole - sconto education
    nonprofit: 0.85,      // No-profit - sconto sociale
  },
  
  // Sconti quantità
  volumeDiscounts: {
    10: 0.05,   // 5% sconto per 10-30 postazioni
    30: 0.10,   // 10% sconto per 30-50 postazioni
    50: 0.15,   // 15% sconto per 50-100 postazioni
    100: 0.20,  // 20% sconto per 100+ postazioni
  },
  
  // Sconti durata contratto
  contractDiscounts: {
    12: 0.0,    // Mensile standard
    24: 0.05,   // 5% sconto biennale
    36: 0.10,   // 10% sconto triennale
  },
};

// Calcola pacchetto consigliato
function recommendPackage(params) {
  const workstations = parseInt(params.workstations) || 1;
  
  if (workstations <= 20 && !params.needsOnsite) {
    return 'helpdesk';
  } else if (workstations <= 50) {
    return 'full';
  } else {
    return 'enterprise';
  }
}

// Calcola prezzo servizi
function calculateServicesPrice(params) {
  let total = 0;
  let breakdown = [];
  
  // Pacchetto base
  const packageType = params.package || recommendPackage(params);
  const basePackage = PRICING.packages[packageType];
  
  if (basePackage) {
    total += basePackage.basePrice;
    breakdown.push({
      item: basePackage.name,
      price: basePackage.basePrice,
      type: 'package',
    });
  }
  
  // Aggiungi servizi extra
  if (params.addons && Array.isArray(params.addons)) {
    params.addons.forEach(addon => {
      const addonConfig = PRICING.addons[addon];
      if (addonConfig) {
        let addonPrice = addonConfig.basePrice || 0;
        
        // Calcola prezzo variabile
        if (addon === 'cybersecurity' && params.workstations) {
          addonPrice += addonConfig.pricePerWorkstation * params.workstations;
        } else if (addon === 'backup' && params.storageGB) {
          addonPrice += addonConfig.pricePerGB * params.storageGB;
        } else if (addon === 'microsoft365' && params.users) {
          addonPrice = addonConfig.pricePerUser * params.users;
        } else if (addon === 'monitoring' && params.devices) {
          addonPrice += addonConfig.pricePerDevice * params.devices;
        }
        
        total += addonPrice;
        breakdown.push({
          item: addonConfig.name,
          price: addonPrice,
          type: 'addon',
        });
      }
    });
  }
  
  return { total, breakdown };
}

// Calcola sconti applicabili
function calculateDiscounts(basePrice, params) {
  let discounts = [];
  let totalDiscount = 0;
  
  // Sconto volume
  const workstations = parseInt(params.workstations) || 1;
  for (const [threshold, discount] of Object.entries(PRICING.volumeDiscounts)) {
    if (workstations >= parseInt(threshold)) {
      const discountAmount = basePrice * discount;
      totalDiscount = discountAmount;
      discounts.push({
        type: 'volume',
        description: `Sconto volume ${workstations} postazioni`,
        percentage: discount * 100,
        amount: discountAmount,
      });
      break;
    }
  }
  
  // Sconto durata contratto
  const contractMonths = parseInt(params.contractMonths) || 12;
  const contractDiscount = PRICING.contractDiscounts[contractMonths] || 0;
  if (contractDiscount > 0) {
    const discountAmount = (basePrice - totalDiscount) * contractDiscount;
    totalDiscount += discountAmount;
    discounts.push({
      type: 'contract',
      description: `Sconto contratto ${contractMonths/12} anni`,
      percentage: contractDiscount * 100,
      amount: discountAmount,
    });
  }
  
  // Settore speciale
  if (params.sector) {
    const multiplier = PRICING.sectorMultipliers[params.sector];
    if (multiplier && multiplier !== 1.0) {
      if (multiplier < 1.0) {
        const discountAmount = basePrice * (1 - multiplier);
        totalDiscount += discountAmount;
        discounts.push({
          type: 'sector',
          description: `Sconto settore ${params.sector}`,
          percentage: (1 - multiplier) * 100,
          amount: discountAmount,
        });
      } else {
        // Supplemento per settori critici
        const supplementAmount = basePrice * (multiplier - 1);
        totalDiscount -= supplementAmount;
        discounts.push({
          type: 'sector_supplement',
          description: `Supplemento settore ${params.sector}`,
          percentage: (multiplier - 1) * 100,
          amount: -supplementAmount,
        });
      }
    }
  }
  
  return { discounts, totalDiscount };
}

// Calcola monte ore
function calculateHourlyPackage(hours) {
  const hourlyPackage = PRICING.hourlyPackages[hours];
  
  if (hourlyPackage && hourlyPackage.price) {
    return {
      hours,
      totalPrice: hourlyPackage.price,
      pricePerHour: hourlyPackage.price / hours,
      discount: hourlyPackage.discount,
      savings: (PRICING.hourlyPackages.custom.pricePerHour * hours) - hourlyPackage.price,
    };
  } else {
    // Pacchetto custom
    const customHours = parseInt(hours) || 10;
    return {
      hours: customHours,
      totalPrice: PRICING.hourlyPackages.custom.pricePerHour * customHours,
      pricePerHour: PRICING.hourlyPackages.custom.pricePerHour,
      discount: 0,
      savings: 0,
    };
  }
}

// API Handler
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Content-Type': 'application/json',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }
    
    try {
      // GET /api/pricing - Ottieni listino prezzi
      if (url.pathname === '/api/pricing' && request.method === 'GET') {
        return new Response(JSON.stringify({
          success: true,
          pricing: PRICING,
        }), { headers });
      }
      
      // POST /api/quote - Calcola preventivo
      if (url.pathname === '/api/quote' && request.method === 'POST') {
        const params = await request.json();
        
        // Calcola prezzi servizi
        const { total: servicesTotal, breakdown } = calculateServicesPrice(params);
        
        // Calcola sconti
        const { discounts, totalDiscount } = calculateDiscounts(servicesTotal, params);
        
        // Prezzo finale
        const finalPrice = Math.max(servicesTotal - totalDiscount, 0);
        
        // Genera preventivo
        const quote = {
          id: `Q-${Date.now()}`,
          createdAt: new Date().toISOString(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 giorni
          params: params,
          pricing: {
            services: breakdown,
            subtotal: servicesTotal,
            discounts: discounts,
            totalDiscount: totalDiscount,
            finalMonthlyPrice: finalPrice,
            finalYearlyPrice: finalPrice * 12,
          },
          recommendedPackage: recommendPackage(params),
          notes: generateNotes(params, finalPrice),
        };
        
        // Salva preventivo su KV se disponibile
        if (env.QUOTES_KV) {
          await env.QUOTES_KV.put(
            quote.id,
            JSON.stringify(quote),
            { expirationTtl: 86400 * 30 } // 30 giorni
          );
        }
        
        return new Response(JSON.stringify({
          success: true,
          quote: quote,
        }), { headers });
      }
      
      // GET /api/quote/:id - Recupera preventivo salvato
      if (url.pathname.startsWith('/api/quote/') && request.method === 'GET') {
        const quoteId = url.pathname.split('/').pop();
        
        if (env.QUOTES_KV) {
          const quote = await env.QUOTES_KV.get(quoteId);
          if (quote) {
            return new Response(JSON.stringify({
              success: true,
              quote: JSON.parse(quote),
            }), { headers });
          }
        }
        
        return new Response(JSON.stringify({
          success: false,
          error: 'Preventivo non trovato',
        }), { status: 404, headers });
      }
      
      // POST /api/hourly-quote - Calcola monte ore
      if (url.pathname === '/api/hourly-quote' && request.method === 'POST') {
        const { hours } = await request.json();
        const hourlyQuote = calculateHourlyPackage(hours);
        
        return new Response(JSON.stringify({
          success: true,
          quote: hourlyQuote,
        }), { headers });
      }
      
      return new Response(JSON.stringify({
        error: 'Endpoint not found',
      }), { status: 404, headers });
      
    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Errore nel calcolo del preventivo',
      }), { status: 500, headers });
    }
  },
};

// Genera note e consigli
function generateNotes(params, finalPrice) {
  const notes = [];
  
  if (params.workstations > 50) {
    notes.push('Con oltre 50 postazioni, consigliamo un contratto Enterprise con tecnico dedicato.');
  }
  
  if (params.sector === 'healthcare' || params.sector === 'finance') {
    notes.push('Il tuo settore richiede compliance speciali. Includiamo audit trimestrali e reportistica dedicata.');
  }
  
  if (!params.addons || !params.addons.includes('backup')) {
    notes.push('⚠️ Consigliamo fortemente di aggiungere il servizio Backup & Disaster Recovery.');
  }
  
  if (finalPrice < 500 && params.workstations > 10) {
    notes.push('💡 Con il pacchetto Full a €590/mese avresti SLA garantiti e interventi in sede illimitati.');
  }
  
  return notes;
}
