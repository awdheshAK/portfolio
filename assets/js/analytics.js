/**
 * analytics.js
 * MJ Oswal Exports' own GTM container + GA4-through-GTM wiring. Replace
 * the placeholder IDs below with the real container/measurement IDs
 * before launch.
 *
 * GA4 is expected to be configured as a tag *inside* the GTM container
 * (not loaded separately here) so there is exactly one analytics script
 * on the page and no duplicate pageview/event counting.
 */
(function (window, document) {
  'use strict';

  var MJO = (window.MJO = window.MJO || {});

  // ------------------------------------------------------------------
  // Central config — the only place IDs should ever be edited.
  // ------------------------------------------------------------------
  var CONFIG = {
    GTM_ID: '[MJ_OSWAL_GTM_ID]', // e.g. "GTM-XXXXXXX"
    GA4_ID: '[MJ_OSWAL_GA4_ID]', // e.g. "G-XXXXXXXXXX" — configured inside GTM, kept here for reference only
    DEBUG: false
  };
  MJO.analyticsConfig = CONFIG;

  function isConfigured(id) {
    return typeof id === 'string' && id.length > 0 && id.indexOf('[') !== 0;
  }

  // ------------------------------------------------------------------
  // dataLayer + consent scaffolding
  // ------------------------------------------------------------------
  window.dataLayer = window.dataLayer || [];
  function pushEvent(payload) {
    window.dataLayer.push(payload);
    if (CONFIG.DEBUG && window.console) {
      window.console.log('[MJO analytics]', payload);
    }
  }
  MJO.pushEvent = pushEvent;

  // Consent-ready hook: defaults to "granted" so the site works standalone.
  // A future cookie/consent-management tool can call MJO.setConsent(false)
  // before this script runs (must load earlier in <head>) to block GTM
  // until the visitor opts in, then call MJO.setConsent(true) on consent.
  MJO.consent = window.MJO_CONSENT_DEFAULT !== false ? { analytics: true } : { analytics: false };

  var gtmLoaded = false;

  function loadGTM() {
    if (gtmLoaded || !isConfigured(CONFIG.GTM_ID)) {
      if (!isConfigured(CONFIG.GTM_ID) && CONFIG.DEBUG) {
        window.console && window.console.info('[MJO analytics] GTM_ID not configured — skipping load.');
      }
      return;
    }
    gtmLoaded = true;

    pushEvent({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });

    var script = document.createElement('script');
    script.async = true; // never blocks rendering
    script.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(CONFIG.GTM_ID);
    document.head.appendChild(script);
  }

  MJO.setConsent = function (granted) {
    MJO.consent.analytics = !!granted;
    pushEvent({ event: 'consent_update', analytics_consent: granted ? 'granted' : 'denied' });
    if (granted) loadGTM();
  };

  // ------------------------------------------------------------------
  // Interaction tracking
  // ------------------------------------------------------------------
  function trackCTAClicks() {
    document.addEventListener('click', function (event) {
      var el = event.target.closest('[data-track="cta_click"]');
      if (!el) return;
      pushEvent({
        event: 'cta_click',
        cta_label: el.getAttribute('data-track-label') || (el.textContent || '').trim(),
        cta_href: el.getAttribute('href') || ''
      });
    });
  }

  function trackNavigationClicks() {
    document.addEventListener('click', function (event) {
      var el = event.target.closest('[data-nav-link], .site-nav__sublist a, .site-footer__col a');
      if (!el) return;
      pushEvent({
        event: 'navigation_click',
        nav_label: (el.textContent || '').trim(),
        nav_href: el.getAttribute('href') || ''
      });
    });
  }

  function trackPhoneAndEmailClicks() {
    document.addEventListener('click', function (event) {
      var tel = event.target.closest('a[href^="tel:"]');
      if (tel) {
        pushEvent({ event: 'phone_click', phone_number: tel.getAttribute('href').replace('tel:', '') });
        return;
      }
      var mail = event.target.closest('a[href^="mailto:"]');
      if (mail) {
        pushEvent({ event: 'email_click', email_address: mail.getAttribute('href').replace('mailto:', '') });
        return;
      }
      var whatsapp = event.target.closest('a[href*="wa.me"], a[data-track="whatsapp_click"]');
      if (whatsapp) {
        pushEvent({ event: 'whatsapp_click', whatsapp_href: whatsapp.getAttribute('href') || '' });
      }
    });
  }

  // Ready for a future contact form: any <form data-track-form="contact">
  // on this or another page will report a contact_form_submit event.
  // No contact form currently exists on the homepage.
  function trackFormSubmissions() {
    document.addEventListener('submit', function (event) {
      var form = event.target.closest('[data-track-form]');
      if (!form) return;
      pushEvent({
        event: 'contact_form_submit',
        form_name: form.getAttribute('data-track-form')
      });
    });
  }

  function trackPageView() {
    pushEvent({
      event: 'page_view',
      page_path: window.location.pathname + window.location.search,
      page_title: document.title
    });
  }

  function init() {
    trackPageView();
    trackCTAClicks();
    trackNavigationClicks();
    trackPhoneAndEmailClicks();
    trackFormSubmissions();

    if (MJO.consent.analytics) loadGTM();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window, document);
