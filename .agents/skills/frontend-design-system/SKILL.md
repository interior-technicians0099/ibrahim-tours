---
name: frontend-design-system
description: >-
  Systematic guide for building scalable, tokenized frontend design systems and CSS architectures.
  Use when setting up CSS variables, theme switching (dark/light), component structure, layout grids,
  design tokens, and reusable UI foundations.
---

# Frontend Design System Architecture

A modular blueprint for scalable, consistent, and maintainable CSS/UI architectures.

---

## 1. Design Token Taxonomy

Structure design tokens across 3 tiers:
1. **Global Tokens (Primitives)**: Pure values (e.g., `blue-500: #3b82f6`, `font-sans: 'Inter', sans-serif`).
2. **Semantic Tokens (Contextual)**: Applied meaning (e.g., `bg-surface-elevated`, `text-primary`, `border-focus`).
3. **Component Tokens (Scoped)**: Element-specific overrides (e.g., `btn-primary-bg`, `navbar-height`).

```css
/* ==========================================================================
   DESIGN TOKENS (CSS Custom Properties)
   ========================================================================== */
:root {
  /* Spacing Scale */
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-5: 1.25rem;  /* 20px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-12: 3rem;    /* 48px */
  --space-16: 4rem;    /* 64px */
  --space-24: 6rem;    /* 96px */

  /* Border Radii */
  --radius-sm: 0.375rem; /* 6px */
  --radius-md: 0.5rem;   /* 8px */
  --radius-lg: 0.75rem;  /* 12px */
  --radius-xl: 1rem;     /* 16px */
  --radius-2xl: 1.5rem;  /* 24px */
  --radius-full: 9999px;

  /* Transitions & Easing */
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
  --ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;

  /* Z-Index Hierarchy */
  --z-base: 0;
  --z-card: 10;
  --z-sticky: 100;
  --z-header: 500;
  --z-drawer: 800;
  --z-modal: 1000;
  --z-toast: 1100;
}
```

---

## 2. Dynamic Theme Switching (Light & Dark Mode)

```css
/* Dark Theme (Default) */
[data-theme="dark"], :root:not([data-theme="light"]) {
  --bg-app: #090d16;
  --bg-card: #131b2e;
  --bg-card-subtle: #1e293b;
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --border-color: rgba(255, 255, 255, 0.08);
  --glass-bg: rgba(19, 27, 46, 0.8);
}

/* Light Theme */
[data-theme="light"] {
  --bg-app: #f8fafc;
  --bg-card: #ffffff;
  --bg-card-subtle: #f1f5f9;
  --text-main: #0f172a;
  --text-muted: #64748b;
  --border-color: rgba(0, 0, 0, 0.08);
  --glass-bg: rgba(255, 255, 255, 0.85);
}
```

### Theme Switcher JavaScript Controller
```javascript
function initThemeToggle() {
  const savedTheme = localStorage.getItem('app-theme') || 
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  
  document.documentElement.setAttribute('data-theme', savedTheme);

  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('app-theme', next);
    });
  }
}
```

---

## 3. Atomic CSS Component Architecture

Organize CSS into logical layers:
1. `tokens.css` - Custom properties, typography, colors, animations.
2. `reset.css` - Box-sizing border-box, fluid images, margin zeroing.
3. `layout.css` - Grid systems, container widths, header/footer shells.
4. `components.css` - Buttons, cards, modals, navigation, forms.
5. `utilities.css` - Flex helpers, text align, responsive visibility.

---

## 4. Reusable Button Utility Blueprint

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-family: inherit;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-full);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-smooth);
  text-decoration: none;
  white-space: nowrap;
  user-select: none;
}

.btn-primary {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.5);
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-main);
  border-color: var(--border-color);
  backdrop-filter: blur(8px);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}
```
