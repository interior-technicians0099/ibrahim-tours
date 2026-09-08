---
name: web-accessibility-a11y-standards
description: >-
  Web Accessibility (a11y) and WCAG 2.1 AA/AAA compliance skill.
  Use when implementing semantic HTML, ARIA landmarks, keyboard navigation, focus traps,
  screen reader announcements, contrast verification, and form accessibility.
---

# Web Accessibility (a11y) & WCAG 2.1 Guidelines

Building inclusive, accessible, and high-standard web interfaces for all users.

---

## 1. Core Accessibility Rules

1. **Semantic HTML First**: Use `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`, `<button>`, `<a>`, and `<dialog>` before adding custom `div` with ARIA.
2. **Keyboard Navigable**: Every interactive control must be operable via `Tab`, `Shift+Tab`, `Enter`, `Space`, `Escape`, and Arrow keys.
3. **Never Remove Focus Outlines**: Replace default outlines with custom high-contrast focus rings:
   ```css
   :focus-visible {
     outline: 2px solid var(--primary-light, #3b82f6);
     outline-offset: 3px;
     border-radius: 4px;
   }
   ```

---

## 2. Skip to Content Link

Provide an accessible skip link for keyboard & screen reader users:

```html
<a href="#main-content" class="skip-to-content">Skip to main content</a>
```

```css
.skip-to-content {
  position: absolute;
  top: -100px;
  left: 1rem;
  background: var(--primary, #2563eb);
  color: #ffffff;
  padding: 0.75rem 1.25rem;
  border-radius: var(--radius-md);
  font-weight: 700;
  z-index: 9999;
  transition: top 0.2s ease-in-out;
  text-decoration: none;
}

.skip-to-content:focus {
  top: 1rem;
}
```

---

## 3. Accessible Forms & Modals

### Accessible Input with Associated Label & Validation
```html
<div class="form-group">
  <label for="user-email">Email Address <span aria-hidden="true">*</span></label>
  <input 
    type="email" 
    id="user-email" 
    name="email" 
    required 
    aria-required="true"
    aria-describedby="email-hint email-error"
    autocomplete="email"
    placeholder="you@example.com"
  />
  <span id="email-hint" class="input-hint">We'll send your booking confirmation here.</span>
  <span id="email-error" class="input-error" role="alert" aria-live="polite"></span>
</div>
```

---

## 4. Color Contrast Ratios (WCAG AA & AAA)

- **Normal text (< 18pt/24px or < 14pt/18.5px bold)**: Minimum `4.5:1` contrast ratio.
- **Large text (>= 18pt/24px or >= 14pt bold)**: Minimum `3:1` contrast ratio.
- **UI Components & Graphical Objects**: Minimum `3:1` contrast against adjacent colors.
