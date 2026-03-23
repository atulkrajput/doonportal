/* Analytics event tracking utilities */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: Record<string, unknown>[];
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  // Google Analytics / GTM
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }

  // GTM dataLayer
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({ event: eventName, ...params });
  }

  // Meta Pixel
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', eventName, params);
  }
}

export function trackFormSubmission(formType: 'demo' | 'contact', productInterest?: string) {
  trackEvent('form_submission', {
    form_type: formType,
    product_interest: productInterest || 'general',
  });

  // Meta Pixel Lead event
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Lead', {
      content_name: formType,
      content_category: productInterest || 'general',
    });
  }
}

export function trackDemoRequest(productInterest?: string) {
  trackEvent('demo_request', { product_interest: productInterest || 'general' });

  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Schedule', {
      content_name: 'demo_request',
      content_category: productInterest || 'general',
    });
  }
}

export function trackCTAClick(ctaLabel: string, location: string) {
  trackEvent('cta_click', { cta_label: ctaLabel, location });
}

// Phase 4: Landing page variant tracking
export function trackLandingPageView(variant: string, page: string) {
  trackEvent('landing_page_view', { variant, page });
}

export function trackLandingPageConversion(variant: string, page: string, conversionType: string) {
  trackEvent('landing_page_conversion', { variant, page, conversion_type: conversionType });
}

// Google Ads conversion tracking preparation
export function trackGoogleAdsConversion(conversionLabel: string, value?: number) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: conversionLabel,
      value: value || 0,
      currency: 'INR',
    });
  }
}
