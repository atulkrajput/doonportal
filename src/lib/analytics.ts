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
