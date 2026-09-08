# Frontend & UI/UX Design Standards

Always apply the following rules when building and updating frontend code:

1. **Aesthetic Excellence (WOW Factor)**:
   - Always implement rich, modern, and state-of-the-art visual design.
   - Use curated color palettes (dark luxury slates `#090D16`, glowing electric blues `#2563EB`, warm ambers `#F59E0B`).
   - Use glassmorphism (`backdrop-filter: blur()`, subtle semi-transparent borders `rgba(255, 255, 255, 0.1)`).
   - Use fluid typography with `clamp()` and Google Fonts (e.g. `Inter`, `Outfit`, `Playfair Display`).

2. **No Placeholders**:
   - Never use placeholder text like "Lorem ipsum" or empty grey placeholder blocks without real content.
   - Provide realistic, high-fidelity copy, pricing, ratings, destinations, and features.

3. **Micro-Interactions & States**:
   - Every interactive element (buttons, cards, inputs) must have defined hover, active, focus-visible, and transition states.
   - Implement smooth scroll reveals with `IntersectionObserver`.

4. **Responsive & Mobile First**:
   - Use dynamic viewport units (`dvh`, `minmax()`, `repeat(auto-fit, ...)`).
   - Ensure mobile tap targets are >= 44x44px and navigation menus feature smooth mobile drawers.

5. **Accessibility (WCAG 2.1 AA)**:
   - Ensure high text contrast ratios (>= 4.5:1).
   - Use semantic HTML tags and visible `:focus-visible` outlines.
