---
name: ui-ux-pro-max
description: >-
  Expert UI/UX design skill for creating stunning, modern, high-converting, and visually premium web interfaces.
  Use when designing layouts, picking color palettes, establishing typography systems, creating glassmorphism,
  dark mode, luxury aesthetics, visual hierarchy, micro-interactions, and high-impact hero sections.
---

# UI/UX Pro Max Design Mastery

A comprehensive guide and execution framework for creating industry-leading, aesthetically breathtaking, and user-centric web applications.

---

## 1. Visual Hierarchy & Spatial Harmony

### The 8-Point & 4-Point Grid
- **Spatial Rhythm**: All spacing (`margin`, `padding`, `gap`, `height`, `width`) should strictly follow multiples of `4px` or `8px`.
  - Tight: `4px` (`0.25rem`), `8px` (`0.5rem`)
  - Standard: `12px` (`0.75rem`), `16px` (`1rem`), `24px` (`1.5rem`)
  - Generous: `32px` (`2rem`), `48px` (`3rem`), `64px` (`4rem`), `96px` (`6rem`)
- **Visual Weight**: Use contrast, size, weight, and depth to direct user attention:
  1. Primary focal point (Hero headline, main CTA)
  2. Secondary context (Subheading, badges, feature icons)
  3. Tertiary details (Metadata, captions, footer links)

---

## 2. Color Mastery & Palette Architectures

### The 60-30-10 Rule
- **60% Dominant Background**: Clean Canvas / Deep Midnight Slate (`#0B0F19`, `#0F172A`, `#FAFAFA`).
- **30% Secondary Structure**: Card surfaces, sidebars, borders, subtle contrast (`#1E293B`, `#F1F5F9`, `rgba(255, 255, 255, 0.05)`).
- **10% High-Impact Accent**: Primary CTA, glow effects, key badges, status markers (`#3B82F6` Electric Blue, `#10B981` Emerald, `#6366F1` Indigo, `#F59E0B` Amber, `#EC4899` Rose).

### Premium Color Palettes for Modern Web & Travel / Experiences
```css
:root {
  /* Luxury Modern / Dark Mode */
  --bg-primary: #090d16;
  --bg-secondary: #0f172a;
  --bg-surface: rgba(30, 41, 59, 0.7);
  --bg-surface-hover: rgba(51, 65, 85, 0.8);
  
  /* Text & Contrast */
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  
  /* Vibrant Accents */
  --primary: #2563eb;
  --primary-light: #3b82f6;
  --primary-glow: rgba(59, 130, 246, 0.35);
  
  --accent: #f59e0b;
  --accent-light: #fbbf24;
  --accent-glow: rgba(245, 158, 11, 0.3);
  
  --success: #10b981;
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-active: rgba(59, 130, 246, 0.5);
  
  /* Glassmorphism & Shadows */
  --glass-bg: rgba(15, 23, 42, 0.75);
  --glass-border: 1px solid rgba(255, 255, 255, 0.12);
  --glass-blur: blur(16px);
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.2);
  --shadow-lg: 0 12px 32px -4px rgba(0, 0, 0, 0.4), 0 4px 12px -2px rgba(0, 0, 0, 0.2);
  --shadow-glow: 0 0 25px var(--primary-glow);
}
```

---

## 3. Typography Architecture

### Font Selection & Stacks
- **Modern / Clean / Tech**: `Inter`, `Outfit`, `Plus Jakarta Sans`, `Geist Sans`, sans-serif.
- **Luxury / Editorial / Travel**: `Playfair Display`, `Cormorant Garamond`, `Cinzel` for headings paired with `Inter` or `Plus Jakarta Sans` for body copy.

### Fluid Typography System
```css
h1 {
  font-size: clamp(2.25rem, 5vw + 1rem, 4.5rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
}

h2 {
  font-size: clamp(1.75rem, 3.5vw + 0.5rem, 3rem);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

p {
  font-size: clamp(1rem, 0.5vw + 0.85rem, 1.125rem);
  line-height: 1.65;
  color: var(--text-secondary);
}
```

---

## 4. Glassmorphism & Modern Aesthetic Techniques

### Glass Card Blueprint
```css
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: var(--glass-border);
  border-radius: 1.25rem;
  box-shadow: var(--shadow-lg);
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.glass-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
}

.glass-card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.25);
  box-shadow: var(--shadow-lg), var(--shadow-glow);
}
```

### Ambient Gradient Mesh (Background Glows)
```css
.ambient-glow {
  position: absolute;
  width: 450px;
  height: 450px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--primary-glow) 0%, transparent 70%);
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
}
```

---

## 5. Micro-Interactions & Interactive States

Every interactive element MUST implement 5 states:
1. **Default**: Clear visual signifier of affordance.
2. **Hover**: Smooth elevation, scale (`1.02`), or subtle border luminescence.
3. **Active/Pressed**: Slight shrink (`scale(0.98)`), immediate tactile response.
4. **Focus-visible**: High-contrast, accessible outline with offset (`outline: 2px solid var(--primary); outline-offset: 2px`).
5. **Disabled**: Reduced opacity (`0.5`), `cursor: not-allowed`, no hover transformations.

---

## 6. UI/UX Quality Checklist

- [ ] **Instant WOW factor**: Modern hero with gradients, crisp photography, bold typography.
- [ ] **Contrast Verification**: Text contrast ratio meets WCAG AA (>= 4.5:1 for normal text).
- [ ] **Responsive Breakpoints**: Seamless scaling on 320px (Mobile), 768px (Tablet), 1024px (Laptop), 1440px+ (Ultra-wide).
- [ ] **Touch Target Sizing**: All buttons and tappable links are at least 44x44px on mobile devices.
- [ ] **Never Use Placeholder Wireframes**: Use high-fidelity curated visuals, realistic copy, and rich dynamic states.
