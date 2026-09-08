---
name: modern-frontend-components
description: >-
  Production-ready, accessible, and highly aesthetic component library blueprints.
  Use when building navigation headers, hero banners, destination/tour cards, search/filter bars,
  testimonials, stats counters, modals, drawers, and booking forms.
---

# Modern Frontend Component Library Blueprints

Production-tested, responsive, and accessible blueprints designed for maximum visual impact.

---

## 1. Glassmorphic Sticky Header / Navbar

### HTML
```html
<header id="main-header" class="site-header">
  <div class="header-container">
    <a href="#" class="brand-logo" aria-label="Home">
      <span class="logo-icon">✨</span>
      <span class="logo-text">Safari<strong>Luxe</strong></span>
    </a>

    <nav class="nav-links" id="primary-nav" aria-label="Primary Navigation">
      <a href="#destinations" class="nav-item active">Destinations</a>
      <a href="#experiences" class="nav-item">Experiences</a>
      <a href="#packages" class="nav-item">Packages</a>
      <a href="#about" class="nav-item">About</a>
      <a href="#contact" class="nav-item">Contact</a>
    </nav>

    <div class="header-actions">
      <button class="theme-btn" id="theme-toggle" aria-label="Toggle dark/light mode">
        <span class="icon-sun">☀️</span>
        <span class="icon-moon">🌙</span>
      </button>
      <a href="#book" class="btn btn-primary btn-sm">Book Now</a>
      <button class="mobile-menu-toggle" id="mobile-menu-btn" aria-expanded="false" aria-controls="primary-nav" aria-label="Open navigation menu">
        <span class="hamburger-bar"></span>
      </button>
    </div>
  </div>
</header>
```

### CSS
```css
.site-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-header, 500);
  padding: 1rem 0;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.site-header.scrolled {
  padding: 0.65rem 0;
  background: rgba(9, 13, 22, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.header-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
```

---

## 2. Interactive Tour / Experience Card

### HTML
```html
<article class="tour-card glass-card">
  <div class="card-image-wrapper">
    <img src="/images/serengeti.webp" alt="Serengeti Sunset Safari" loading="lazy" class="card-img" />
    <span class="card-badge">Bestseller</span>
    <button class="btn-favorite" aria-label="Save to favorites">
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
    <div class="card-duration">5 Days / 4 Nights</div>
  </div>

  <div class="card-content">
    <div class="card-meta">
      <span class="rating">⭐ 4.98 <em>(142 reviews)</em></span>
      <span class="location">📍 Serengeti, Tanzania</span>
    </div>

    <h3 class="card-title">Serengeti Great Migration & Luxury Camp</h3>
    <p class="card-desc">Witness millions of wildebeest crossing the Mara River with private game drives and hot air ballooning.</p>

    <div class="card-footer">
      <div class="card-price">
        <span class="price-label">From</span>
        <span class="price-value">$1,450</span>
        <span class="price-unit">/ person</span>
      </div>
      <a href="#tour-detail" class="btn btn-primary btn-sm">Explore Tour</a>
    </div>
  </div>
</article>
```

### CSS
```css
.tour-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.card-image-wrapper {
  position: relative;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border-radius: 1rem 1rem 0 0;
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.tour-card:hover .card-img {
  transform: scale(1.08);
}

.card-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: rgba(37, 99, 235, 0.9);
  backdrop-filter: blur(8px);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.card-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.card-footer {
  margin-top: auto;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  display: flex;
  align-items: center;
  justify-content: space-between;
}
```

---

## 3. Floating Search & Filter Bar

```html
<div class="search-filter-bar glass-card">
  <form class="filter-form" onsubmit="return false;">
    <div class="filter-group">
      <label for="filter-dest">Destination</label>
      <select id="filter-dest">
        <option value="">Where to?</option>
        <option value="zanzibar">Zanzibar Beach</option>
        <option value="serengeti">Serengeti National Park</option>
        <option value="kilimanjaro">Mount Kilimanjaro</option>
        <option value="ngorongoro">Ngorongoro Crater</option>
      </select>
    </div>

    <div class="filter-group">
      <label for="filter-date">Date</label>
      <input type="date" id="filter-date" />
    </div>

    <div class="filter-group">
      <label for="filter-type">Tour Type</label>
      <select id="filter-type">
        <option value="">All Experiences</option>
        <option value="wildlife">Wildlife Safari</option>
        <option value="luxury">Luxury Honeymoon</option>
        <option value="trekking">Mountain Trekking</option>
        <option value="cultural">Cultural Tour</option>
      </select>
    </div>

    <button type="submit" class="btn btn-primary btn-filter-submit">
      <span>Search Tours</span>
    </button>
  </form>
</div>
```

---

## 4. Stat Counter & Social Proof Banner

```html
<section class="stats-banner">
  <div class="stat-item">
    <span class="stat-number" data-target="15000">15,000+</span>
    <span class="stat-label">Happy Travelers</span>
  </div>
  <div class="stat-item">
    <span class="stat-number" data-target="120">120+</span>
    <span class="stat-label">Curated Destinations</span>
  </div>
  <div class="stat-item">
    <span class="stat-number" data-target="99">99.4%</span>
    <span class="stat-label">Satisfaction Rate</span>
  </div>
  <div class="stat-item">
    <span class="stat-number" data-target="15">15+</span>
    <span class="stat-label">Years of Excellence</span>
  </div>
</section>
```
