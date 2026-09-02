# Integrity Transmission & Drivetrain Website

Official website for Integrity Transmission & Drivetrain, serving Springfield and Southwest Missouri.

**Live site:** https://integritydrivetrain.com/

The website is designed as a fast, mobile-friendly, SEO-focused business site for transmission repair, professional transmission rebuilding, remanufactured transmission replacement, drivetrain service, and selected automotive repair.

The project is intentionally built without a large framework or template system. It uses semantic HTML, modular CSS, lightweight JavaScript, reusable partials, structured data, and purpose-built content so the site remains fast, maintainable, expandable, and highly optimized for organic search.

---

## Primary Goals

- Generate qualified transmission leads and quote requests
- Rank competitively for transmission-related searches in Springfield and Southwest Missouri
- Compete against template-based automotive and transmission shop websites with stronger content and technical SEO
- Make transmission pricing and service options easy to understand
- Position remanufactured transmission replacement alongside traditional rebuilding
- Educate customers enough to make informed decisions without overwhelming them
- Demonstrate real transmission knowledge and actual shop experience
- Build trust through clear warranty, process, repair, and pricing information
- Create a strong mobile experience for customers searching from their phones
- Make VIN-based quote requests fast and simple
- Maintain a scalable architecture for future SEO growth without unnecessarily overbuilding the site

---

## Business Positioning

Integrity Transmission & Drivetrain specializes in automatic transmission and drivetrain service.

Primary transmission services include:

- Complete transmission replacement
- Remanufactured transmission replacement
- Transmission rebuilding
- Bench transmission rebuilds
- Partner-coordinated removal and installation when included in the quote
- Transmission diagnosis and repair
- Towing and heavy-duty builds
- Longevity-focused builds
- Performance transmission builds
- Custom transmission configurations
- Programming and adaptive relearn when applicable
- Transmission fluid and supporting service
- Drivetrain and transfer-case service

Selected general automotive services may also be offered, including:

- Brake service
- Steering and suspension repair
- Wheel bearings and hubs
- CV axles
- Selected routine maintenance

Transmission and drivetrain work remain the primary specialty.

---

## Transmission Philosophy

The website intentionally presents both rebuilding and remanufactured replacement rather than treating one solution as correct for every vehicle.

### Traditional Rebuilds

A rebuild begins with the customer's existing transmission.

Standard rebuild work generally focuses on normal rebuild components and soft parts while inspecting the transmission for additional damage.

Hard parts that are damaged or outside reusable specifications may require additional replacement.

Builds can also be tailored for:

- longevity
- towing
- heavy-duty use
- performance
- increased horsepower and torque
- known application-specific failure points

### Remanufactured Transmission Replacement

For many newer vehicles, a professionally remanufactured transmission may provide better overall value than rebuilding the original unit.

Depending on the supplier and application, remanufacturing may include:

- standardized teardown and inspection
- hard-part inspection or replacement
- valve-body work
- solenoid/electronic service
- known-failure corrections
- updated components
- testing before shipment
- nationwide warranty options

The website is designed to help customers compare these options rather than automatically pushing every customer toward the same repair.

---

## Rebuild Quality & Testing

Transmission content throughout the site emphasizes proper inspection and measurement rather than simple parts replacement.

Depending on the transmission and repair, processes may include:

- air testing
- vacuum testing
- clutch clearance measurement
- end-play measurement
- dimensional inspection
- micrometer measurements
- hydraulic inspection
- valve-body inspection
- hard-part inspection
- torque verification
- known-failure correction
- application-specific upgrades

The purpose is to communicate that a professional transmission rebuild involves inspection, measurement, verification, and correction—not simply installing a rebuild kit.

---

## Warranty Structure

Warranty information varies by repair type.

### Bench Rebuilds

- Integrity-provided warranty
- Typically 1 year
- Transmission must be returned to Integrity for warranty evaluation/service
- Installation-related failures may void warranty coverage

### Coordinated R&R Rebuilds

- Integrity-provided warranty
- Typically 18 months / 18,000 miles
- Vehicle removal and installation are arranged through the approved partner included in the quote
- Warranty inspection and approved rebuild-related service are coordinated through Integrity

### Remanufactured Transmissions

Warranty is provided through the remanufacturer rather than Integrity's in-house rebuild warranty.

Available programs may include:

- 18-month / 18,000-mile coverage
- 3-year / unlimited-mile coverage
- nationwide coverage
- approved labor reimbursement
- labor reimbursement programs that may provide $70/hour or $125/hour depending on the selected transmission/warranty package

Exact warranty terms depend on the transmission, supplier, and package quoted.

The website should never imply that Integrity's in-house rebuild warranty is a nationwide warranty.

---

## Current Site Architecture

Core pages include:

- `index.html` — Homepage
- `services.html` — Services overview
- `transmissions.html` — Automatic transmission information and transmission families
- `rebuild-guide.html` — Rebuild types, components, testing, upgrades, towing, longevity, and performance information
- `warranty.html` — Warranty options and differences between Integrity and remanufacturer coverage
- `contact.html` — VIN-first quote and contact flow
- `thank-you.html` — Quote submission confirmation
- `reviews.html` — Customer reviews / reputation content
- `about.html` — Business information and company positioning

Focused service pages include:

- `/services/transmission-repair`
- `/services/transmission-replacement`
- `/services/transmission-rebuild`
- `/services/bench-transmission-rebuild`
- `/services/torque-converter`
- `/services/transfer-case`
- `/services/differential`

Focused transmission pages include:

- `/transmissions/4l60e`
- `/transmissions/6l80-6l90`
- `/transmissions/10r80`
- `/transmissions/68rfe`
- `/transmissions/700r4`
- `/transmissions/4l80e`

The site also includes `/service-area`, two noindexed confirmation pages, and a custom `404.html` page. The campaign now contains 22 indexable canonical URLs.

The site should not create thin pages solely to increase page count.

---

## Transmission Coverage

The site is intentionally broader than the original GM-focused version.

Content should demonstrate experience across domestic and import applications, including examples from:

- GM / Chevrolet / GMC / Cadillac
- Ford / Lincoln
- Ram / Dodge / Chrysler / Jeep
- Toyota / Lexus
- Honda / Acura
- Nissan / Infiniti
- selected European applications
- conventional automatics
- selected CVT applications

Examples should rotate between manufacturers when practical so the site does not appear focused on only one transmission family.

Individual transmission pages may be created later when search demand, customer value, and available content justify dedicated landing pages.

---

## Mobile UX Strategy

Most prospective customers are expected to interact with the site from a phone.

Mobile usability is therefore a primary design requirement.

Important mobile features include:

- large touch-friendly buttons
- responsive layouts
- readable typography
- single-column forms where appropriate
- direct phone links
- direct SMS links
- VIN-first quote flow
- section jump navigation on longer pages
- manufacturer/category jump buttons
- minimal friction between search landing and quote request

Long educational pages use section navigation so customers can jump directly to information relevant to their vehicle or intended transmission build.

---

## Quote / Conversion Flow

The primary conversion path is:

**Search / Landing Page → Relevant Information → Request Quote → VIN / Vehicle Details → Thank You**

The Contact page is intentionally simpler and less sales-heavy than the educational pages.

Customers are encouraged to provide:

- VIN
- name
- phone number
- email if desired
- year / make / model
- engine
- drivetrain
- transmission if known
- mileage
- requested service
- whether the transmission is installed or removed
- vehicle use
- symptoms
- towing, performance, or modification information when relevant

Customers are not required to diagnose their own vehicle before requesting help.

Text messaging is also emphasized because customers can easily send:

- VIN
- photos
- videos
- diagnostic information
- vehicle information

---

## Forms

The quote form uses Netlify Forms.

Current form:

`quote-request`

The form includes:

- Netlify form detection
- honeypot spam protection
- redirect to `thank-you.html`
- mobile-friendly inputs
- VIN and vehicle-specific information

The thank-you page is intentionally:

`noindex, follow`

It exists as a conversion-completion page and should not become a search landing page.

---

## SEO Strategy

SEO is a core part of the project rather than an afterthought.

The site is being developed to compete with local automotive websites that often rely on generic templates and duplicated service content.

### On-Page SEO

Pages use:

- unique page titles
- unique meta descriptions
- semantic HTML5
- logical heading hierarchy
- descriptive copy
- natural keyword coverage
- internal linking
- descriptive image alt text
- local geographic relevance
- service-specific terminology
- search-intent-focused page structure

Keyword use should remain natural. Content should not be stuffed with repetitive location or service phrases.

### Technical SEO

The site includes or is being developed around:

- canonical URLs
- `robots.txt`
- XML sitemap
- Google Search Console
- indexation control
- structured data / JSON-LD
- Open Graph metadata
- Twitter/X metadata
- responsive design
- mobile usability
- lightweight frontend architecture
- crawlable HTML content
- internal navigation
- clean URL/page architecture

### Structured Data

Schema may include, where appropriate:

- `AutoRepair`
- `WebSite`
- `WebPage`
- `ContactPage`
- `FAQPage`
- `BreadcrumbList`
- service-related structured data

Structured data should describe content that actually exists on the corresponding page.

### Local SEO

Primary geographic focus includes:

- Springfield, Missouri
- Ozark, Missouri
- Rogersville, Missouri
- Nixa, Missouri
- Republic, Missouri
- Battlefield, Missouri
- Strafford, Missouri
- surrounding Southwest Missouri communities

Local SEO should be supported by useful business information and relevant content rather than excessive city-name repetition.

---

## SEO Development Philosophy

The objective is not simply to "add keywords."

The site should compete through a combination of:

1. Technical SEO
2. Search-intent alignment
3. High-quality original content
4. Strong internal linking
5. Local relevance
6. Mobile usability
7. Page speed
8. Structured data
9. Crawlability and indexation
10. Conversion optimization
11. Real-world expertise
12. Reputation and review signals

Future SEO work should be based on measurable opportunity rather than automatically creating hundreds of thin service/location pages.

---

## Sitemap & Crawling

The live domain is:

`https://integritydrivetrain.com/`

The project includes:

- `sitemap.xml`
- `robots.txt`

The previous eight-page sitemap was submitted through Google Search Console. The expanded 22-URL sitemap must be resubmitted after this campaign is deployed.

New indexable pages should be added to the sitemap when they are published.

Pages intentionally marked `noindex`, such as the quote confirmation page, should not be treated as organic landing pages.

---

## CSS Architecture

The site uses a shared global stylesheet plus page-specific stylesheets.

Example structure:

    styles.css
    index.css
    services.css
    transmissions.css
    transmission-build-guide.css
    warranty.css
    contact.css
    thank-you.css

`styles.css` contains shared/global components and design variables.

Page-specific stylesheets contain layouts and components unique to their corresponding pages.

Avoid unnecessarily duplicating global styles inside page-specific CSS.

---

## JavaScript

JavaScript is intentionally lightweight.

Primary scripts include:

    script.js
    scripts/generate-seo-pages.mjs
    scripts/generate-sitemap.mjs
    scripts/normalize-urls.mjs
    scripts/sync-partials.mjs
    scripts/audit-seo.mjs

JavaScript responsibilities may include:

- interactive gallery/carousel behavior
- reusable UI behavior
- navigation-related functionality
- privacy-safe conversion event hooks
- generation and validation of the focused SEO pages

JavaScript should not unexpectedly alter scroll position or interfere with normal page navigation.

Any new JavaScript functionality should be tested against the entire site before deployment because `script.js` may be loaded by multiple pages.

---

## Shared Partials

Reusable site elements are maintained in the `partials/` directory.

Examples:

    partials/header.html
    partials/footer.html

`scripts/sync-partials.mjs` embeds the shared header and footer into every HTML page before deployment.

This keeps navigation and footer updates centralized while ensuring search crawlers and visitors receive the complete navigation in the initial HTML response without client-side fetching.

---

## Images & Media

The `images/` directory contains:

- business logos
- favicon assets
- Open Graph/social images
- real shop photographs
- transmission assembly photographs
- failure/inspection photographs
- completed transmission photographs
- vehicle photographs

Real work imagery is preferred over generic stock photography whenever practical.

Images should use:

- descriptive filenames
- appropriate alt text
- reasonable dimensions
- web-appropriate compression

Image optimization and Core Web Vitals remain part of the final technical audit.

---

## Design Direction

The visual identity uses:

- orange brand accent
- black / charcoal contrast sections
- warm cream / white backgrounds
- bold Oswald headings
- Inter body typography
- modern card-based layouts
- subtle gradients
- restrained shadows
- rounded components
- strong visual hierarchy
- real shop imagery

The goal is to feel:

- professional
- modern
- technically competent
- trustworthy
- approachable
- automotive without looking like a generic repair-shop template

---

## Development Workflow

Local development is performed in VS Code.

Typical workflow:

    node scripts/generate-seo-pages.mjs
    node scripts/normalize-urls.mjs
    node scripts/sync-partials.mjs
    node scripts/generate-sitemap.mjs
    node scripts/audit-seo.mjs
    node scripts/test-production-routes.mjs
    node scripts/submit-indexnow.mjs
    git status
    git add .
    git commit -m "Describe changes"
    git push

Changes should be previewed locally before deployment.

After deployment:

1. Verify the live page
2. Hard refresh when necessary
3. Test desktop layout
4. Test mobile layout
5. Test navigation and section links
6. Test forms
7. Test interactive JavaScript
8. Verify that no unexpected scrolling or layout behavior was introduced

---

## Current Development Status

Major work completed or substantially developed:

- homepage redesign
- shared visual system
- responsive/mobile layouts
- reusable header/footer partials
- services page
- automatic transmissions page
- transmission build guide
- warranty page
- contact / quote page
- Netlify quote form
- thank-you confirmation page
- transmission gallery/carousel
- mobile section-jump navigation
- manufacturer/category navigation
- sitemap
- robots.txt
- Google Search Console sitemap submission
- structured data foundation
- local SEO foundation
- internal-linking architecture
- 14 focused service, service-area, and transmission landing pages
- clean extensionless canonical URLs
- legacy `.html` redirect rules
- static crawlable navigation and footer
- custom 404 and production headers
- automated SEO audit and sitemap generation

---

## Remaining / Ongoing Work

Primary remaining work includes:

- About page audit/refinement
- Reviews page audit/refinement
- Search Console indexing review
- Bing Webmaster Tools setup and sitemap submission
- IndexNow setup and URL submission
- mobile usability testing
- accessibility review
- performance optimization
- Core Web Vitals review
- connect the existing conversion event hooks to the selected analytics platform
- Google Business Profile alignment
- review/reputation strategy
- continued content expansion based on actual search opportunity

---

## Future Expansion

Potential future additions should be driven by customer usefulness or measurable SEO opportunity.

Possible additions include:

- symptom-specific pages supported by real search demand
- application-specific transmission guides
- additional technical FAQs
- diagnostic educational content
- towing/performance transmission content
- additional real-work galleries
- customer case studies
- review integration
- analytics and conversion reporting

The project should remain focused on generating qualified transmission business rather than becoming an unnecessarily large technical encyclopedia or a collection of thin city pages.

---

## Guiding Principle

Every significant site change should improve at least one of the following:

- search visibility
- customer understanding
- trust
- usability
- conversion rate
- technical performance
- maintainability

If a page, section, feature, or piece of content does not meaningfully improve one of those areas, it probably does not need to be added.

---

## Author / Project

Built for **Integrity Transmission & Drivetrain**.

Website:

`https://integritydrivetrain.com/`

Primary focus:

**Transmission repair, rebuilding, remanufactured transmission replacement, drivetrain service, and transmission-related automotive solutions in Springfield and Southwest Missouri.**
