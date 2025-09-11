/* tracking.js - IT-ERA Bulltech
   - Safe GA4 hooks (no error if gtag undefined)
   - Phone click + form submit tracking
   - Progressive performance tweaks: lazy-load images/iframes if not set
*/
(function(){
  'use strict';
  function trackPhoneClicks(){
    document.querySelectorAll('a[href^="tel:"]').forEach(function(a){
      a.addEventListener('click', function(){
        if (typeof gtag !== 'undefined') {
          gtag('event','contact',{
            event_category:'phone_click',
            event_label: a.getAttribute('href') + '|' + location.pathname,
            value:1
          });
        }
      });
    });
  }
  function trackFormSubmits(){
    document.querySelectorAll('form').forEach(function(f){
      f.addEventListener('submit', function(){
        if (typeof gtag !== 'undefined') {
          gtag('event','conversion',{
            event_category:'lead_generation',
            event_label: (f.id || 'form') + '|' + location.pathname,
            value:1
          });
        }
      });
    });
  }
  function enableLazyLoading(){
    document.querySelectorAll('img:not([loading])').forEach(function(img){ img.loading = 'lazy'; });
    document.querySelectorAll('iframe:not([loading])').forEach(function(el){ el.loading = 'lazy'; });
  }
  document.addEventListener('DOMContentLoaded', function(){
    enableLazyLoading();
    trackPhoneClicks();
    trackFormSubmits();
  });
})();

