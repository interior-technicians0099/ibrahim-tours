---
name: responsive-web-mastery
description: >-
  Advanced responsive design and adaptive layout strategies for modern devices.
  Use when building fluid layouts, multi-column responsive grids, mobile drawer navigation,
  dynamic viewport units (dvh/svh), container queries, and touch-optimized interfaces.
---

# Responsive Web Mastery & Adaptive Layouts

Ensure interfaces look stunning, performant, and flawless across all screen sizes: from 320px mobile viewports to 4K ultra-wides.

---

## 1. Responsive Viewport Strategy & Modern CSS Units

- Use `dvh` (Dynamic Viewport Height) for full-screen hero sections to prevent mobile address bar jump.
- Use `clamp()` for fluid typography and responsive spacing without breakpoint clutter.

```css
.hero-fullscreen {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: clamp(1.5rem, 5vw, 5rem);
}
```

---

## 2. Intrinsic CSS Grid (Auto-Fit without Media Queries)

```css
.responsive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
  gap: clamp(1rem, 2.5vw, 2rem);
}

.responsive-grid-large {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr));
  gap: 2rem;
}
```

---

## 3. Container Queries (@container)

Style components based on the size of their parent container rather than the entire browser viewport:

```css
.card-container {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 500px) {
  .tour-card {
    display: grid;
    grid-template-columns: 200px 1fr;
  }
  
  .card-image-wrapper {
    border-radius: 1rem 0 0 1rem;
    height: 100%;
  }
}
```

---

## 4. Mobile Navigation & Drawer Pattern

### Accessible Mobile Drawer Script
```javascript
function initMobileNavigation() {
  const toggleBtn = document.getElementById('mobile-menu-btn');
  const nav = document.getElementById('primary-nav');
  const body = document.body;

  if (!toggleBtn || !nav) return;

  function toggleMenu(open) {
    const isOpen = open !== undefined ? open : toggleBtn.getAttribute('aria-expanded') !== 'true';
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
    nav.classList.toggle('nav-open', isOpen);
    body.classList.toggle('no-scroll', isOpen);
  }

  toggleBtn.addEventListener('click', () => toggleMenu());

  // Close when clicking nav items
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => toggleMenu(false));
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('nav-open')) {
      toggleMenu(false);
      toggleBtn.focus();
    }
  });
}
```

### Mobile Drawer CSS
```css
@media (max-width: 768px) {
  .nav-links {
    position: fixed;
    top: 0;
    right: -100%;
    width: 80%;
    max-width: 320px;
    height: 100dvh;
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(20px);
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    flex-direction: column;
    padding: 6rem 2rem 2rem;
    gap: 1.5rem;
    transition: right 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 490;
    box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5);
  }

  .nav-links.nav-open {
    right: 0;
  }

  .mobile-menu-toggle {
    display: flex;
  }
}
```
