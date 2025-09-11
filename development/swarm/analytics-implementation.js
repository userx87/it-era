
<!-- Google Analytics 4 - IT-ERA SEO Pages -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA4-XXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA4-XXXXXXXXX', {
    // Enhanced measurement
    enhanced_measurement: true,
    // Custom parameters for SEO pages
    custom_map: {
      'custom_parameter_1': 'seo_page_category',
      'custom_parameter_2': 'target_keyword',
      'custom_parameter_3': 'page_branch'
    }
  });

  // Custom events for SEO pages
  function trackSEOPageView(category, keyword, branch) {
    gtag('event', 'seo_page_view', {
      'seo_page_category': category,
      'target_keyword': keyword,
      'page_branch': branch,
      'page_location': window.location.href
    });
  }

  // Track form submissions
  function trackLeadGeneration(formType, pageCategory) {
    gtag('event', 'generate_lead', {
      'form_type': formType,
      'page_category': pageCategory,
      'value': 100 // Estimated lead value
    });
  }

  // Track phone calls
  function trackPhoneCall(phoneNumber, pageCategory) {
    gtag('event', 'phone_call', {
      'phone_number': phoneNumber,
      'page_category': pageCategory,
      'value': 150 // Estimated call value
    });
  }

  // Track scroll depth
  function trackScrollDepth(percentage) {
    gtag('event', 'scroll', {
      'scroll_depth': percentage
    });
  }

  // Initialize SEO page tracking
  document.addEventListener('DOMContentLoaded', function() {
    // Auto-detect page category and keyword from meta tags
    const pageCategory = document.querySelector('meta[name="page-category"]')?.content || 'unknown';
    const targetKeyword = document.querySelector('meta[name="target-keyword"]')?.content || 'unknown';
    const pageBranch = document.querySelector('meta[name="page-branch"]')?.content || 'unknown';
    
    trackSEOPageView(pageCategory, targetKeyword, pageBranch);
    
    // Track form submissions
    document.querySelectorAll('form').forEach(form => {
      form.addEventListener('submit', function(e) {
        trackLeadGeneration(form.id || 'contact_form', pageCategory);
      });
    });
    
    // Track phone clicks
    document.querySelectorAll('a[href^="tel:"]').forEach(link => {
      link.addEventListener('click', function(e) {
        trackPhoneCall(link.href.replace('tel:', ''), pageCategory);
      });
    });
  });
</script>