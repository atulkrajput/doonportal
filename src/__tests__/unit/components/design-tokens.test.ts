import { describe, it, expect } from 'vitest';
import config from '../../../../tailwind.config';

describe('Design Tokens — tailwind.config.ts', () => {
  const theme = config.theme?.extend;

  describe('Accent color scale', () => {
    const accentColors = (theme?.colors as Record<string, Record<string, string>>)?.accent;

    it('defines accent-50 through accent-950', () => {
      expect(accentColors).toBeDefined();
      const expectedShades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
      expectedShades.forEach((shade) => {
        expect(accentColors[shade]).toBeDefined();
        expect(typeof accentColors[shade]).toBe('string');
      });
    });

    it('accent-50 is #faf5ff', () => {
      expect(accentColors['50']).toBe('#faf5ff');
    });

    it('accent-500 is #a855f7', () => {
      expect(accentColors['500']).toBe('#a855f7');
    });

    it('accent-950 is #3b0764', () => {
      expect(accentColors['950']).toBe('#3b0764');
    });
  });

  describe('Brand color preservation', () => {
    const brandColors = (theme?.colors as Record<string, Record<string, string>>)?.brand;

    it('preserves all brand color tokens (brand-50 through brand-950)', () => {
      expect(brandColors).toBeDefined();
      const expectedShades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
      expectedShades.forEach((shade) => {
        expect(brandColors[shade]).toBeDefined();
      });
    });

    it('brand-500 is #30a3f0', () => {
      expect(brandColors['500']).toBe('#30a3f0');
    });

    it('brand-600 is #1a8ad6', () => {
      expect(brandColors['600']).toBe('#1a8ad6');
    });
  });

  describe('Shadow tokens', () => {
    const shadows = theme?.boxShadow as Record<string, string>;

    it('defines elevated shadow token', () => {
      expect(shadows?.elevated).toBeDefined();
      expect(typeof shadows.elevated).toBe('string');
    });

    it('defines glow shadow token', () => {
      expect(shadows?.glow).toBeDefined();
      expect(typeof shadows.glow).toBe('string');
    });

    it('defines glow-lg shadow token', () => {
      expect(shadows?.['glow-lg']).toBeDefined();
      expect(typeof shadows['glow-lg']).toBe('string');
    });

    it('defines soft shadow token', () => {
      expect(shadows?.soft).toBeDefined();
    });

    it('defines card shadow token', () => {
      expect(shadows?.card).toBeDefined();
    });

    it('defines nav shadow token', () => {
      expect(shadows?.nav).toBeDefined();
    });

    it('elevated shadow contains expected rgba values', () => {
      expect(shadows.elevated).toContain('rgba');
      expect(shadows.elevated).toContain('16px');
    });

    it('glow shadow references brand color rgba', () => {
      // Brand-600 is #1a8ad6 → rgb(26,138,214)
      expect(shadows.glow).toContain('26,138,214');
    });
  });

  describe('Transition duration tokens', () => {
    const durations = theme?.transitionDuration as Record<string, string>;

    it('defines micro transition duration as 200ms', () => {
      expect(durations?.micro).toBe('200ms');
    });

    it('defines section transition duration as 500ms', () => {
      expect(durations?.section).toBe('500ms');
    });
  });

  describe('Border radius tokens', () => {
    const radii = theme?.borderRadius as Record<string, string>;

    it('defines rounded-xl as 0.75rem', () => {
      expect(radii?.xl).toBe('0.75rem');
    });

    it('defines rounded-2xl as 1rem', () => {
      expect(radii?.['2xl']).toBe('1rem');
    });

    it('defines rounded-3xl as 1.5rem', () => {
      expect(radii?.['3xl']).toBe('1.5rem');
    });

    it('defines rounded-4xl as 2rem', () => {
      expect(radii?.['4xl']).toBe('2rem');
    });
  });

  describe('Font family tokens', () => {
    const fontFamily = theme?.fontFamily as Record<string, string[]>;

    it('defines sans font family with Inter', () => {
      expect(fontFamily?.sans).toBeDefined();
      expect(fontFamily.sans).toContain('Inter');
    });

    it('defines heading font family with Inter', () => {
      expect(fontFamily?.heading).toBeDefined();
      expect(fontFamily.heading).toContain('Inter');
    });

    it('sans font family includes var(--font-inter)', () => {
      expect(fontFamily.sans[0]).toBe('var(--font-inter)');
    });
  });
});
