# greeting card

## Overview
> A simple "Happy Birthday" greeting card built with HTML + CSS to **practice and preserve** common CSS **pseudo-elements** and **pseudo-classes** in one place.
This project initially keeps the HTML small and uses CSS to demonstrate interaction states and UI behaviors.

---

## Goals
- Build a clean mini UI (card + buttons/links)
- Demonstrate **pseudo-elements** (`::before`, `::after`)
- Demonstrate **Pseudo-calsses** (`::hover`, `::active`, `::focus`, `::visited`, `::target`)
- Keep it "reference-friendly" for future copy/past patterns

---

## Non-Goals
- Not a real sending/sharing app (no backend)
- No javaScript (the behavior is CSS-ONLY)
- Not optimized for production UX-this is a learning/reference build

---

## Tech Stack
- HTML
- CSS
- No frameworks

---

## How It Works (High Level)
- The “Send Card” and “Share on Social Media” elements are anchor links.
- Each link points to a matching section ID (`#send`, `#share`).
- All sections are hidden by default using CSS.
- The `:target` pseudo-class is used to reveal the selected section when its hash is active in the URL.

## What’s Being Demonstrated

### Pseudo-elements
- `h1::before` — decorative icon before the heading
- `h1::after` — decorative icon after the heading

### Pseudo-classes
- `.card:hover` — card hover interaction (scale + color)
- `.card-links a:hover` — hover state for links
- `.card-links a:active` — active/pressed state
- `.card-links a:focus` — keyboard focus outline for accessibility
- `.card-links a:visited` — visited link state (within browser limitations)
- `section:target` — CSS-only conditional display based on URL hash

## Key CSS Patterns Used
- Card layout: `max-width`, `padding`, `border-radius`, `box-shadow`
- Transitions: smooth `transform` and `background-color` changes
- Flexbox for link layout: `display: flex` with spacing
- CSS-only state control using `:target` instead of JavaScript

## How to Run
1. Open `index.html` in a browser  
   *(Optional: use VS Code Live Server for auto-refresh)*

## Notes / Decisions
- HTML is intentionally small to keep focus on CSS behavior.
- Anchor links + `:target` were chosen to demonstrate interaction without JavaScript.
- This file acts as the **primary documentation** to avoid over-commenting in CSS.

## Future Improvements
- Add a “reset” or back link to clear the URL hash
- Add `:focus-visible` for improved keyboard navigation
- Add a reduced-motion fallback using `prefers-reduced-motion`
- Extract reusable pseudo patterns into a dedicated reference file

## Author & Reference
- **Author:** William Hullinger  
- **Date Created:** February 2026  
- **Course Reference:** freeCodeCamp (FCC)
