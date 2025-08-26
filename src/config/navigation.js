/**
 * Canonical Navigation Configuration - IT-ERA
 * Single source of truth for all navigation elements
 * Used across all templates and components
 */

// Emergency contact number
export const EMERGENCY_PHONE = '+390398882041';
export const EMERGENCY_DISPLAY = '039 888 2041';

// Main navigation structure with exact URLs matching current implementation
export const NAVIGATION_ITEMS = [
  {
    id: 'services',
    label: 'Servizi',
    type: 'dropdown',
    children: [
      {
        section: 'ASSISTENZA IMMEDIATA',
        items: [
          {
            label: '🔧 Assistenza IT',
            url: '/pages/assistenza-it-milano.html',
            badge: { text: '15min', variant: 'danger' }
          },
          {
            label: '🛡️ Sicurezza Informatica',
            url: '/pages/sicurezza-informatica-milano.html'
          }
        ]
      },
      {
        section: 'SOLUZIONI CLOUD',
        items: [
          {
            label: '☁️ Cloud Storage',
            url: '/pages/cloud-storage-milano.html'
          },
          {
            label: '💾 Backup Automatico',
            url: '/pages/backup-automatico.html'
          }
        ]
      },
      {
        section: 'PACCHETTI SPECIALI',
        items: [
          {
            label: '⭐ All-Inclusive PMI',
            url: '/pages/all-inclusive-pmi.html',
            badge: { text: '-30%', variant: 'success' }
          }
        ]
      }
    ]
  },
  {
    id: 'sectors',
    label: 'Settori',
    type: 'dropdown',
    children: [
      {
        items: [
          {
            label: '🏢 PMI e Startup',
            url: '/pages/settori-pmi-startup.html'
          },
          {
            label: '⚕️ Studi Medici',
            url: '/pages/settori-studi-medici.html'
          },
          {
            label: '📊 Commercialisti',
            url: '#commercialisti'
          },
          {
            label: '⚖️ Studi Legali',
            url: '#avvocati'
          },
          {
            label: '🏭 Industria 4.0',
            url: '#industria'
          },
          {
            label: '🛍️ Retail e GDO',
            url: '#retail'
          }
        ]
      }
    ]
  },
  {
    id: 'coverage',
    label: 'Zone Coperte',
    type: 'dropdown',
    multiColumn: true,
    children: [
      {
        section: 'MILANO E BRIANZA',
        items: [
          { label: 'Milano', url: '/pages/assistenza-it-milano.html' },
          { label: 'Monza', url: '/pages/assistenza-it-monza.html' },
          { label: 'Vimercate', url: '/pages/assistenza-it-vimercate.html' },
          { label: 'Seregno', url: '/pages/assistenza-it-seregno.html' },
          { label: 'Lissone', url: '/pages/assistenza-it-lissone.html' }
        ]
      },
      {
        section: 'COMO E LECCO',
        items: [
          { label: 'Como', url: '/pages/assistenza-it-como.html' },
          { label: 'Lecco', url: '/pages/assistenza-it-lecco.html' },
          { label: 'Cantù', url: '/pages/assistenza-it-cantu.html' },
          { label: 'Merate', url: '/pages/assistenza-it-merate.html' },
          { label: 'Vedi tutte →', url: '#', class: 'text-primary' }
        ]
      }
    ]
  },
  {
    id: 'why',
    label: 'Perché IT-ERA',
    type: 'link',
    url: '/pages/perche-it-era.html'
  },
  {
    id: 'blog',
    label: '📝 Blog',
    type: 'link',
    url: '/blog/'
  },
  {
    id: 'contact',
    label: 'Contatti',
    type: 'link',
    url: '/pages/contatti.html'
  }
];

// Brand configuration
export const BRAND = {
  name: 'IT-ERA',
  logo: '<span style="color: #0056cc;">IT</span>-ERA',
  url: '/'
};

// CTA configuration
export const PRIMARY_CTA = {
  text: `📞 ${EMERGENCY_DISPLAY}`,
  url: `tel:${EMERGENCY_PHONE}`,
  class: 'btn btn-primary'
};

export const EMERGENCY_CTA = {
  text: '🚨 Supporto Urgente',
  url: `tel:${EMERGENCY_PHONE}`,
  class: 'nav-link text-danger fw-bold'
};

export const MOBILE_EMERGENCY_CTA = {
  text: '🚨 Emergenza',
  url: `tel:${EMERGENCY_PHONE}`,
  class: 'btn btn-danger btn-sm'
};

// CSS classes for consistent styling
export const STYLES = {
  navbar: 'navbar navbar-expand-lg navbar-light bg-white fixed-top shadow-sm',
  container: 'container',
  brand: 'navbar-brand fw-bold',
  toggler: 'navbar-toggler',
  collapse: 'collapse navbar-collapse',
  navList: 'navbar-nav ms-auto align-items-lg-center',
  navItem: 'nav-item',
  navLink: 'nav-link',
  dropdown: 'nav-item dropdown',
  dropdownToggle: 'nav-link dropdown-toggle',
  dropdownMenu: 'dropdown-menu',
  dropdownItem: 'dropdown-item',
  dropdownHeader: 'dropdown-header text-muted small',
  dropdownDivider: 'dropdown-divider',
  multiColumnDropdown: 'dropdown-menu dropdown-menu-columns',
  badge: 'badge',
  badgeDanger: 'badge bg-danger ms-2',
  badgeSuccess: 'badge bg-success ms-2'
};

/**
 * Generate Bootstrap navigation HTML from configuration
 * @param {Object} options - Configuration options
 * @returns {string} HTML string
 */
export function generateNavigation(options = {}) {
  const { includeMobileEmergency = true, includeDesktopEmergency = true } = options;
  
  // This would generate the full HTML based on the configuration
  // Implementation would go here based on the current navigation-optimized.html structure
  return '<!-- Navigation HTML would be generated here based on config -->';
}

/**
 * Get all navigation URLs for sitemap generation
 * @returns {Array} Array of URLs
 */
export function getAllNavigationUrls() {
  const urls = [];
  
  function extractUrls(items) {
    items.forEach(item => {
      if (item.url && !item.url.startsWith('#')) {
        urls.push(item.url);
      }
      if (item.children) {
        item.children.forEach(section => {
          if (section.items) {
            extractUrls(section.items);
          }
        });
      }
    });
  }
  
  extractUrls(NAVIGATION_ITEMS);
  return [...new Set(urls)]; // Remove duplicates
}

export default {
  EMERGENCY_PHONE,
  EMERGENCY_DISPLAY,
  NAVIGATION_ITEMS,
  BRAND,
  PRIMARY_CTA,
  EMERGENCY_CTA,
  MOBILE_EMERGENCY_CTA,
  STYLES,
  generateNavigation,
  getAllNavigationUrls
};