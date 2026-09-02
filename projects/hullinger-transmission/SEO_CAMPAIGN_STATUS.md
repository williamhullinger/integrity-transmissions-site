# Integrity Transmission SEO Campaign Status

Updated: September 2, 2026

## Campaign Scope

This campaign is for **Integrity Transmission & Drivetrain** and the production domain `https://integritydrivetrain.com/`.

The site contains 22 indexable canonical URLs, two noindexed conversion-confirmation pages, and a noindexed custom 404 page.

### Core URLs

- `/`
- `/about`
- `/services`
- `/transmissions`
- `/rebuild-guide`
- `/reviews`
- `/warranty`
- `/contact`

### Focused Service and Local URLs

- `/service-area`
- `/services/transmission-repair`
- `/services/transmission-replacement`
- `/services/transmission-rebuild`
- `/services/bench-transmission-rebuild`
- `/services/torque-converter`
- `/services/transfer-case`
- `/services/differential`

### Focused Transmission URLs

- `/transmissions/4l60e`
- `/transmissions/6l80-6l90`
- `/transmissions/10r80`
- `/transmissions/68rfe`
- `/transmissions/700r4`
- `/transmissions/4l80e`

## Completed On-Site Work

- Unique titles, descriptions, H1s, canonicals, Open Graph metadata, and structured data
- Original service- and transmission-specific copy
- Four useful FAQs on every new landing page
- Fourteen distinct optimized hero images with reserved dimensions
- Static crawlable header and footer on every page
- Clean extensionless internal links and canonical URLs
- Permanent redirects from legacy `.html` URLs
- 22-URL XML sitemap with `lastmod`
- `robots.txt`, custom 404, and production response headers
- Internal topic links from the homepage, services, transmissions, rebuild guide, footer, and related-page sections
- Noindexed quote and review confirmation pages
- Privacy-safe `dataLayer` conversion hooks for call, text, quote CTA, and form-submit actions
- Root-hosted IndexNow verification key and a guarded sitemap submission script
- Generator, partial-sync, URL-normalization, sitemap, and automated SEO audit scripts

## Business Rules Reflected in the Site

- Remanufactured replacement is the primary solution for many modern vehicles
- Rebuilding and bench work are selective
- Vehicle removal and installation may be coordinated through an approved partner when included in the quote
- Service is appointment-based; no private property address is published
- Transmission work is paid before the unit and supporting parts are ordered
- Bench rebuild coverage is generally one year / 12,000 miles
- Coordinated R&R rebuild coverage is generally 18 months / 18,000 miles
- Qualifying reman programs may offer 18-month / 18,000-mile or three-year / unlimited-mile nationwide coverage
- The written quote and written warranty terms always control

## Rebuild and Audit Commands

Run these from the `projects/hullinger-transmission` directory:

```bash
node scripts/generate-seo-pages.mjs
node scripts/normalize-urls.mjs
node scripts/sync-partials.mjs
node scripts/generate-sitemap.mjs
node scripts/audit-seo.mjs
node scripts/test-production-routes.mjs
node scripts/submit-indexnow.mjs
```

Expected audit baseline:

- 25 HTML files
- 22 indexable pages
- 14 unique focused-page heroes
- No SEO audit errors

## Required After Deployment

1. Confirm all 22 canonical URLs return successful live pages.
2. Confirm every `.html` URL permanently redirects to its clean canonical.
3. Resubmit `https://integritydrivetrain.com/sitemap.xml` in Google Search Console.
4. Use URL Inspection on the homepage and the highest-priority new service/model pages.
5. Add or import the site in Bing Webmaster Tools and submit the sitemap.
6. Verify the live IndexNow key, then submit all changed canonical URLs with `node scripts/submit-indexnow.mjs --submit`.
7. Review indexing, queries, click-through rate, Core Web Vitals, and conversions monthly.
8. Align Google Business Profile and third-party listings with the appointment-based service-area model.

## Next Content Phase

Do not create thin city pages. Use Search Console and customer demand to select the next pages, likely symptom-based guides, application-specific transmission content, and evidence-backed case studies.
