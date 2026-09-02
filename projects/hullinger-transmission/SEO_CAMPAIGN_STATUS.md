# Integrity Transmission SEO Campaign Status

Updated: September 2, 2026

## Campaign Scope

This campaign is for **Integrity Transmission & Drivetrain** and the production domain `https://integritydrivetrain.com/`.

The staged site contains 25 indexable canonical URLs, two noindexed conversion-confirmation pages, and a noindexed custom 404 page.

### Core URLs

- `/`
- `/about`
- `/services`
- `/transmissions`
- `/reman-transmissions`
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

### Search-Demand Guide URLs

- `/guides/transmission-problems`
- `/guides/cvt-transmission-problems`

## Completed On-Site Work

- Unique titles, descriptions, H1s, canonicals, Open Graph metadata, and structured data
- Original service- and transmission-specific copy
- Four useful FAQs on every new landing page
- Sixteen distinct optimized focused-page hero images with reserved dimensions
- Static crawlable header and footer on every page
- Clean extensionless internal links and canonical URLs
- Permanent redirects from legacy `.html` URLs
- 25-URL XML sitemap with `lastmod`
- `robots.txt`, custom 404, and production response headers
- Internal topic links from the homepage, services, transmissions, rebuild guide, footer, and related-page sections
- Noindexed quote and review confirmation pages
- Privacy-safe `dataLayer` conversion hooks for call, text, quote CTA, and form-submit actions
- Root-hosted IndexNow verification key and a guarded sitemap submission script
- Generator, partial-sync, URL-normalization, sitemap, and automated SEO audit scripts
- Nationwide reman landing page and top-level **Reman Transmissions** navigation tab
- Customer-facing live VIN catalog using the protected remanufacturer account connection
- Search-demand-driven transmission warning-sign and symptom guide
- Search-demand-driven CVT problems guide with manufacturer references and an original hero
- Documented content roadmap, real-case-study workflow, backlink campaign, and reman commerce roadmap
- Private ACE staff connector and noindexed quote desk for live VIN, fitment, wholesale pricing, warranty, core and per-upgrade stock review
- Public allowlisted reman results with wholesale cost and supplier-account data removed
- Exact wholesale-plus-$500 Integrity pricing, separate refundable core deposit and unavailable/discontinued blocking
- Current carrier freight lookup with outbound and round-trip core-return options
- ACE-supplied Base/1000/2000/3000 upgrade-selection guide
- Expanded reman intake fields for freight, warranty, labor, programming and core-return review

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
node scripts/preview-site.mjs
node scripts/submit-indexnow.mjs
```

Expected audit baseline:

- 28 HTML files
- 25 indexable pages
- 16 unique focused-page heroes
- No SEO audit errors

## Deployment and Search Engine Submission

Initial 22-page campaign completed September 2, 2026:

- Confirmed all 22 canonical URLs return successful live pages.
- Confirmed 24 legacy `.html` URLs permanently redirect to clean canonicals and the custom 404 works.
- Resubmitted `https://integritydrivetrain.com/sitemap.xml` in Google Search Console; status is **Success**.
- Confirmed the homepage is indexed in Google.
- Requested Google indexing for the five highest-priority new pages:
  - `/services/transmission-replacement`
  - `/services/transmission-repair`
  - `/services/transmission-rebuild`
  - `/transmissions/6l80-6l90`
  - `/transmissions/10r80`
- Added and verified `integritydrivetrain.com` in Bing Webmaster Tools.
- Submitted the sitemap in Bing Webmaster Tools; status is **Success**.
- Submitted all 22 canonical URLs through Bing URL Submission.
- Submitted all 22 canonical URLs through IndexNow; Bing accepted the batch with HTTP 202.
- Scheduled an Integrity-only SEO performance review for the first day of every month at approximately 9:00 AM Central Time, beginning October 1, 2026.

Current 24-page expansion deployed September 2, 2026:

- Added `/reman-transmissions` and `/guides/transmission-problems`.
- Updated the shared header/footer, sitemap, redirect map, internal links, and production route test.
- Production-route test passes with 24 canonical pages, 26 redirects, and the custom 404.
- Automated audit passes with 27 HTML files, 24 indexable pages, and 15 unique focused-page heroes.
- Verified both new production pages, canonicals, H1s, structured data, navigation, and the legacy reman `.html` redirect.
- Verified the VIN decoder on production with a non-customer sample VIN; it identified and prefilled basic vehicle, engine, and drive data without submitting the form.
- Verified the production reman quote form name, POST method, honeypot, VIN requirement, and thank-you route.
- Resubmitted the 24-URL sitemap in Google Search Console; Google reported **Success** and 24 discovered pages.
- Requested Google indexing for `/reman-transmissions` and `/guides/transmission-problems`.
- Resubmitted the sitemap in Bing Webmaster Tools and submitted both new URLs successfully.
- Submitted all 24 canonical URLs through IndexNow; the endpoint accepted the batch with HTTP 200.

Current 25-page CVT expansion deployed September 2, 2026:

- Added `/guides/cvt-transmission-problems` from verified Bing search demand.
- Added internal links from the homepage, supported-units page, reman page, symptom hub, and shared footer.
- Added a unique CVT-specific hero, Article/Breadcrumb/FAQ structured data, manufacturer references, sitemap entry, and legacy `.html` redirect.
- Verified the live guide returns HTTP 200 with the correct title, H1, canonical, structured data, original WebP hero, and internal links.
- Verified the legacy `.html` route permanently redirects to the clean canonical.
- Verified the live sitemap contains all 25 canonical URLs.
- Submitted all 25 canonical URLs through IndexNow; the endpoint accepted the batch with HTTP 200.
- Google Search Console and Bing Webmaster Tools submission for the new CVT URL remain pending action-time approval.

Customer reman storefront expansion prepared September 2, 2026:

- Replaced the NHTSA-only vehicle decoder with a live, server-side remanufacturer catalog lookup.
- The customer sees only the VIN-matched application, current Integrity price, core deposit, offered upgrade levels, included items, stock/build-time state, warranty choices and customer-safe warnings.
- Integrity price is the current wholesale package cost plus exactly $500; ACE suggested retail and the previous $1,000 margin floor are ignored.
- Each upgrade level receives its own inventory request; returned warehouse/location names and quantities are displayed without inventing inventory.
- Returned lead times are labeled as remanufacturer build time and explicitly exclude carrier transit time.
- Discontinued/unavailable applications are blocked from ordinary selection; uncertain and non-returnable applications require assisted review.
- Current freight rates can be requested after package selection and address entry, including residential/liftgate and round-trip core-return inputs.
- The public response is allowlisted and tested so credentials, wholesale pricing, account levels, raw supplier responses and internal UIDs remain server-side.
- The core copy requires an upfront deposit, a 30-day customer return window from delivery, and acceptance of the eligible matching core before refund.
- Automated tests pass for staff authorization, $500 pricing, per-upgrade stock, build lead-time parsing, redaction and round-trip freight normalization.
- Stripe card collection is intentionally not enabled until the restricted key, webhook, tax treatment, final terms and staff order notification are configured and tested.

## Search-Demand Baseline

Google Search Console, last three months as reviewed September 2, 2026:

- 12 clicks
- 1,132 impressions
- 1.1% click-through rate
- 14.8 average position
- 112 queries

Highest visible local demand includes `transmission repair springfield mo`, `transmission shop springfield mo`, `transmission warranty springfield mo`, `transmission rebuild springfield mo`, `transmission diagnostics springfield mo`, and `transmission replacement springfield mo`.

Bing's three-month keyword view showed meaningful symptom demand around `cvt transmission problems`, with narrower Nissan and Honda CVT demand. The exact priorities and limitations are recorded in `SEO_CONTENT_ROADMAP.md`.

## Ongoing Growth Work

1. Review indexing, queries, click-through rate, Core Web Vitals, and conversions monthly.
2. Align Google Business Profile and third-party listings with the appointment-based service-area model.
3. Execute the documented backlink campaign through real supplier, association, directory, and partner relationships after the new assets are live.
4. Publish evidence-backed case studies using the job-intake and privacy workflow; never invent a vehicle, diagnosis, outcome, or testimonial.
5. Continue collecting authentic customer reviews and respond to them consistently.

## Next Content Phase

Do not create thin city pages. Next content priorities are focused slipping and delayed-engagement guides plus the first evidence-backed case study. The commerce priority is hosted Stripe Checkout with server-side price revalidation, an itemized refundable core deposit, webhook-confirmed payment, manual ACE ordering, written terms and staff order tracking.
