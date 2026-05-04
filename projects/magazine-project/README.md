# Magazine Layout (freeCodeCamp) — HTML + CSS Grid

A responsive magazine-style article layout built as part of freeCodeCamp’s Responsive Web Design curriculum. This project focuses on **CSS Grid**, **typography**, **multi-column text flow**, and **responsive media queries** to create a clean editorial layout that adapts across screen sizes.

## Preview / What This Builds
- A hero header with a featured image, title, subtitle, author line, publish date, and social icons
- Multi-column article text using `column-width`
- A two-column “text + images” section that becomes single-column on smaller screens
- Responsive typography scaling through media queries

## Tech Used
- HTML5 semantic structure (`main`, `section`, `header`, `article`, `aside`, `blockquote`)
- CSS Grid (page layout + internal component grids)
- Multi-column text (`column-width`)
- Responsive design (media queries at 720px / 600px / 550px / 420px)
- Google Fonts (Anton, Baskervville, Raleway)
- Font Awesome (social icons)

## Project Structure
- index.html
- styles.css

## How To Run (VS Code)
1. Open this folder in VS Code.
2. Right-click `index.html` → “Open with Live Server” (recommended), or just open `index.html` in your browser.

## Key Layout Notes (Good Reference)
### Page Grid (Centered Content)
The main page uses a 3-column grid to keep content centered with responsive side gutters:
- Left gutter: `minmax(2rem, 1fr)`
- Content column: `minmax(min-content, 94rem)`
- Right gutter: `minmax(2rem, 1fr)`

### Typography Strategy
- Base font sizing set to `62.5%` so `1rem = 10px` (easy mental math).
- Heading fonts:
  - `h1` uses Anton
  - `h2–h6` use Raleway
  - Body uses Baskervville

### Readable Article Flow
Article content uses:
- `column-width: 25rem` for magazine-like multi-column reading
- `text-align: justify` for editorial style
- A drop-cap effect via `.first-paragraph::first-letter`

### Responsive Behavior
- 720px: image grid becomes 1-column
- 600px: text+images becomes 1-column
- 550px and below: typography scales down, social icons shrink
- 420px: hero title scales down further

## Notable CSS Features
- `minmax()` for flexible grid columns
- `object-fit: cover` for consistent image cropping
- Drop cap: `.first-paragraph::first-letter`
- Quote styling with automatic quotation marks using `::before` and `::after`
- Component-level grids:
  - `.heading` grid for hero + author + icons
  - `.text-with-images` grid for article section + image collage
  - `.image-wrapper` grid for image collage layout

## Credits
- Project concept and assets: freeCodeCamp Responsive Web Design curriculum
- Fonts: Google Fonts
- Icons: Font Awesome

## Ideas To Reuse This As A Template
- Swap the hero image + headline for your own “feature article” layout
- Replace the “Brief History” list with:
  - product timeline
  - changelog
  - case study milestones
- Reuse the centered `main` grid for any site that needs a clean content column
- Keep the responsive typography rules as a starting point for future builds

## License
This project is for learning and portfolio reference. Replace content/assets as needed for your own use.