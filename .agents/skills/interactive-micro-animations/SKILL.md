---
name: interactive-micro-animations
description: >-
  Motion design and interactive animation skill for creating fluid, dynamic, and responsive web animations.
  Use when implementing scroll reveals, magnetic buttons, hover micro-interactions, skeleton loaders,
  parallax effects, accordion/drawer transitions, and view transitions.
---

# Interactive Micro-Animations & Motion Design

Transform static web pages into alive, responsive, and delightful user experiences through intentional motion design.

---

## 1. Principles of Web Motion

1. **Purposeful**: Animations must provide feedback, guide attention, or establish spatial relationships—never distract or cause motion sickness.
2. **Snappy & Smooth**: Optimal UI transitions take between `150ms` and `350ms`. Never make users wait for an animation to finish to click.
3. **Respect User Settings**: Always include `@media (prefers-reduced-motion: reduce)`.

---

## 2. Scroll-Triggered Reveal Engine (Zero Dependencies)

### CSS Animation Classes
```css
.reveal-fade-up {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform;
}

.reveal-fade-up.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* Stagger Children Delays */
.stagger-1 { transition-delay: 100ms; }
.stagger-2 { transition-delay: 200ms; }
.stagger-3 { transition-delay: 300ms; }
.stagger-4 { transition-delay: 400ms; }
```

### Intersection Observer Script
```javascript
function initScrollReveals() {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target); // Trigger once
      }
    });
  }, {
    root: null,
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  document.querySelectorAll('.reveal-fade-up, .reveal-fade-in, .reveal-scale').forEach(el => {
    observer.observe(el);
  });
}
```

---

## 3. High-End Micro-Interactions

### A. Magnetic / Glow Button Effect
```javascript
function initGlowButtons() {
  document.querySelectorAll('.btn-glow-interactive').forEach(button => {
    button.addEventListener('mousemove', (e) => {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      button.style.setProperty('--mouse-x', `${x}px`);
      button.style.setProperty('--mouse-y', `${y}px`);
    });
  });
}
```
```css
.btn-glow-interactive {
  position: relative;
  overflow: hidden;
}

.btn-glow-interactive::after {
  content: '';
  position: absolute;
  top: var(--mouse-y, -100px);
  left: var(--mouse-x, -100px);
  width: 150px;
  height: 150px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.25) 0%, transparent 70%);
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.btn-glow-interactive:hover::after {
  opacity: 1;
}
```

### B. Skeleton Shimmer Loader
```css
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.04) 25%,
    rgba(255, 255, 255, 0.12) 37%,
    rgba(255, 255, 255, 0.04) 63%
  );
  background-size: 400% 100%;
  animation: skeleton-shimmer 1.5s ease infinite;
  border-radius: var(--radius-md);
}

@keyframes skeleton-shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}
```

### C. Floating Hero Animation
```css
@keyframes floating {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-12px) rotate(1deg);
  }
}

.floating-element {
  animation: floating 6s ease-in-out infinite;
}
```

---

## 4. Accessibility & Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  .reveal-fade-up {
    opacity: 1 !important;
    transform: none !important;
  }
}
```
