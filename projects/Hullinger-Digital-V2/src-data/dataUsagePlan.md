Hullinger Digital V2 — Data Usage Plan

This file explains what all of the src-data files are for, how they fit together, how they will be used in the future React/Vite build, and what to do next when development continues.

This is the main direction file for continuing the Hullinger Digital V2 project later.

Open this file first before creating the React/Vite app, moving files, building components, or editing project data.

⸻

Main Purpose

The src-data folder is the planning, content, pricing, legal, SEO, brand, and builder foundation for the future Hullinger Digital V2 website.

These files are not throwaway files.

They are intended to become part of the actual React project.

The only temporary part is the folder name.

Current temporary folder:

src-data/

Future React folder:

src/data/

When the real React/Vite project is created, the files should be moved into src/data/.

They should not be recreated from scratch.

⸻

Big Picture

The future Hullinger Digital V2 website will have two major parts:

1. Marketing website
2. Website builder/configurator

The marketing website will explain:

* Hullinger Digital
* Website service levels
* Custom vs template websites
* SEO structure
* Pricing
* Advanced website tools
* Website review process
* Terms and expectations

The website builder will allow users to:

* Choose a website package
* Select add-ons
* Choose care plans
* Choose payment options
* Answer intake questions
* Provide design direction
* Review their estimated project total
* Accept required acknowledgements
* Move toward agreement and payment

The JavaScript files in this folder provide the data and structure for both parts.

⸻

Why These Files Exist

The goal is to avoid hardcoding important information directly inside React components.

Bad future pattern:

<h2>Starter Web Page</h2>
<p>$395</p>

Better future pattern:

import { websitePackages } from "../data";
const starterPackage = websitePackages.find(
  (item) => item.id === "starter-web-page"
);

That way, prices, package names, features, legal terms, page copy, and builder logic can be managed from the data files.

This makes the project easier to maintain, easier to update, and harder to accidentally contradict across pages.

⸻

How Everything Fits Together

The future React app will use the data like this:

src/data/
  packages.js
      ↓
  Service pages
  Pricing page
  Builder package selector
  Package cards
  Price summary
  addons.js
      ↓
  Builder add-on selector
  Pricing add-on overview
  Project total calculator
  Scope review logic
  carePlans.js
      ↓
  Pricing care plan section
  Builder care plan selector
  Monthly service total
  paymentPlans.js
      ↓
  Builder payment selector
  Due-today calculation
  Payment plan display
  Ownership/payment notices
  builderSteps.js
      ↓
  Builder progress bar
  Step order
  Required acknowledgements
  Review summary
  intakeQuestions.js
      ↓
  Builder intake forms
  Website review form
  Project summary
  Internal review
  sitePages.js
      ↓
  Routes
  Header navigation
  Footer navigation
  Page metadata
  Hero copy
  Page section outlines
  brandSystem.js
      ↓
  CSS variables
  Global design rules
  Colors
  Typography
  Layout
  Buttons
  Cards
  Forms
  contentBlocks.js
      ↓
  Reusable copy sections
  FAQs
  SEO explanation
  Template vs custom explanation
  Review notices
  Payment notices
  visualSections.js
      ↓
  Mockup plans
  Visual placeholders
  Diagrams
  Future animations/reels
  projectRoadmap.js
      ↓
  Build phases
  Project order
  Development plan
  componentMap.js
      ↓
  React component architecture
  Component build order
  Future file paths
  copyDrafts.js
      ↓
  Page copy drafts
  Section copy
  Future page content
  schemaPlan.js
      ↓
  SEO metadata
  Structured data
  Sitemap planning
  Robots planning
  legalTermsPlan.js
      ↓
  Terms page
  Builder acknowledgements
  Agreement preview
  Scope/payment protection
  index.js
      ↓
  Central export file
  Clean imports into React

⸻

File-by-File Usage Plan

packages.js

Purpose:

Defines the four main website packages:

* Starter Web Page
* Launch Website
* Lead-Generating Website
* Advanced Website

This file should be used by:

* Homepage service selector
* Pricing page
* Starter Web Page page
* Launch Website page
* Lead-Generating Website page
* Advanced Website page
* Builder package selection step
* Price summary
* Review summary

Future React components that will use this:

PackageSelector.jsx
ServiceSelectorSection.jsx
PricingPreview.jsx
PackageHero.jsx
IncludedFeatures.jsx
NotIncluded.jsx
BestForList.jsx
UpgradePath.jsx
PriceSummary.jsx
ReviewSummary.jsx

Important rule:

Do not hardcode package prices in components. Pull package prices from packages.js.

⸻

addons.js

Purpose:

Defines add-on categories and add-on pricing.

This includes:

* Extra pages
* SEO add-ons
* Design/media add-ons
* Forms
* Payments
* Booking
* Automations
* Customer tools
* Employee/internal tools
* AI tools

This file should be used by:

* Builder add-on selection steps
* Pricing add-ons overview
* Price calculator
* Scope review logic
* Advanced review warnings

Future React components that will use this:

AddOnSelector.jsx
QuantitySelector.jsx
NotesField.jsx
PriceSummary.jsx
ReviewSummary.jsx
Pricing.jsx

Important rule:

Add-ons should not be duplicated manually in React components.

If an add-on price changes, change it in addons.js.

⸻

carePlans.js

Purpose:

Defines monthly care plans after launch.

This file should be used by:

* Pricing page care plan section
* Builder care plan selector
* Monthly service total calculation
* Review summary
* Agreement/payment step

Future React components that will use this:

CarePlanSelector.jsx
PriceSummary.jsx
ReviewSummary.jsx
Pricing.jsx

Important rule:

Care plans are monthly services and should be shown separately from one-time website build totals.

⸻

paymentPlans.js

Purpose:

Defines payment options and payment rules.

This file should be used by:

* Builder payment step
* Pricing payment explanation
* Price summary
* Review summary
* Agreement/payment acknowledgements

Future React components that will use this:

PaymentPlanSelector.jsx
PriceSummary.jsx
ReviewSummary.jsx
Pricing.jsx
TermsPreview.jsx

Important rule:

Payment plans affect:

* Amount due today
* Total paid over time
* Monthly payment amount
* Ownership transfer language
* Missed payment notices

Do not treat payment plans as simple discounts. They have terms attached.

⸻

builderSteps.js

Purpose:

Defines the builder process and step order.

This file should be used by:

* Builder progress bar
* Builder layout
* Step navigation
* Step validation
* Review summary
* Required acknowledgements

Future React components that will use this:

BuilderLayout.jsx
BuilderProgress.jsx
ReviewSummary.jsx
AcknowledgementList.jsx
WebsiteBuilder.jsx

Important rule:

The builder step order should come from this file, not from random component order.

⸻

intakeQuestions.js

Purpose:

Defines project intake questions.

This includes:

* Design direction
* Business details
* Project goals
* Asset/access details
* Advanced project details

This file should be used by:

* Website builder intake steps
* Website Review page form
* Project summary
* Internal project review flow

Future React components that will use this:

IntakeQuestionRenderer.jsx
FormField.jsx
TextInput.jsx
TextareaInput.jsx
SingleSelect.jsx
MultiSelect.jsx
WebsiteReview.jsx
ReviewSummary.jsx

Important rule:

Questions should be rendered from this file when possible.

Do not manually rewrite all questions inside form components.

⸻

sitePages.js

Purpose:

Defines the main website pages, slugs, metadata, hero copy, and navigation.

This file should be used by:

* React routes
* Header navigation
* Footer navigation
* Page metadata
* Page hero sections
* Page section outlines

Future React components that will use this:

Header.jsx
Footer.jsx
NavMenu.jsx
HeroSection.jsx
Home.jsx
StarterWebPage.jsx
LaunchWebsite.jsx
LeadGeneratingWebsite.jsx
AdvancedWebsite.jsx
Pricing.jsx
About.jsx
WebsiteReview.jsx
TermsPreview.jsx

Important rule:

Main page URLs and navigation should come from sitePages.js.

Do not hardcode navigation links separately in multiple components.

⸻

brandSystem.js

Purpose:

Defines the visual identity and design rules for the site.

This includes:

* Brand positioning
* Tone
* Color palette
* Typography
* Layout rules
* Buttons
* Cards
* Forms
* Motion
* Accessibility
* Responsive rules

This file should be used by:

* CSS variable setup
* Global styles
* Button styles
* Card styles
* Form styles
* Layout decisions
* Visual consistency

Future files/components that will use this:

src/styles/variables.css
src/styles/global.css
Button.jsx
Card.jsx
Section.jsx
Callout.jsx
Header.jsx
Footer.jsx

Important rule:

The site should feel premium, professional, and system-minded.

Avoid cheap, generic, hype-heavy, or local-only language/design.

⸻

contentBlocks.js

Purpose:

Defines reusable copy and explanation blocks.

This includes:

* Custom vs template explanation
* SEO foundation explanation
* Hands-on builder notice
* Structured review process
* Scope review clause
* Payment plan notice
* Advanced website explanation
* FAQs
* Reusable microcopy

This file should be used by:

* Homepage sections
* Pricing page
* Service pages
* Builder review step
* FAQ sections
* Terms page
* Agreement acknowledgements

Future React components that will use this:

CustomVsTemplateSection.jsx
SeoFoundationSection.jsx
ProcessSection.jsx
ReviewProcessSection.jsx
AdvancedToolsPreview.jsx
FinalCtaSection.jsx
Pricing.jsx
TermsPreview.jsx
ReviewSummary.jsx
AcknowledgementList.jsx

Important rule:

If the same explanation appears in multiple places, use contentBlocks.js instead of rewriting it.

⸻

visualSections.js

Purpose:

Defines planned visuals, mockups, diagrams, and future animation ideas.

This file should be used by:

* Homepage visuals
* Service page mockups
* SEO path diagrams
* Template vs custom visuals
* Builder process visuals
* Advanced dashboard visuals
* Future animation/reel planning

Future React components that will use this:

DeviceMockup.jsx
FloatingUICards.jsx
ProcessDiagram.jsx
DashboardMockup.jsx
HeroSection.jsx
Home.jsx
AdvancedWebsite.jsx
WebsiteBuilder.jsx

Important rule:

Do not let the website become text-only.

Every major concept should have a planned visual area.

⸻

projectRoadmap.js

Purpose:

Defines the full project build phases.

This file should be used by:

* Future planning
* Build order
* Development roadmap
* Avoiding random next steps

This file is more of a planning file than a customer-facing website data file.

Future use:

* Open this file when unsure what phase comes next.
* Use it to keep the build in order.
* Use it to avoid skipping into advanced builder logic too early.

Important rule:

Build the foundation first, then layout, then homepage, then service pages, then builder.

Do not start with the most complex builder logic before the base site exists.

⸻

componentMap.js

Purpose:

Defines the future React component architecture.

This file should be used by:

* Creating folders
* Creating React component files
* Deciding build order
* Avoiding duplicate components
* Knowing which data each component should use

Future use:

* Open this before creating new component files.
* Follow the listed file paths where possible.
* Use the component build order.

Important rule:

If a component is already planned in componentMap.js, use that plan instead of inventing a new random file name.

⸻

copyDrafts.js

Purpose:

Defines polished page copy drafts.

This file should be used by:

* Homepage
* Service pages
* Pricing page
* About page
* Website Review page
* Terms Preview page

Future React components that will use this:

Home.jsx
StarterWebPage.jsx
LaunchWebsite.jsx
LeadGeneratingWebsite.jsx
AdvancedWebsite.jsx
Pricing.jsx
About.jsx
WebsiteReview.jsx
TermsPreview.jsx

Important rule:

This file contains actual page copy. It can be refined later, but it should prevent us from starting pages with blank placeholder text.

⸻

schemaPlan.js

Purpose:

Defines SEO metadata and structured data planning.

This file should be used by:

* Page metadata
* SEO helper functions
* JSON-LD structured data
* Sitemap planning
* Robots.txt planning

Future files/components that may use this:

Seo.jsx
metadata helpers
sitemap generator
schema helpers
robots.txt

Important rule:

SEO should not be left until the end.

Page title, meta description, slug, intent, internal links, and schema should be planned as pages are built.

⸻

legalTermsPlan.js

Purpose:

Defines project terms, payment language, ownership language, scope rules, and acknowledgements.

This file should be used by:

* Terms Preview page
* Builder review step
* Builder acknowledgements
* Agreement preview
* Contract drafting
* Scope protection

Future React components that will use this:

TermsPreview.jsx
ReviewSummary.jsx
AcknowledgementList.jsx
PaymentPlanSelector.jsx
WebsiteBuilder.jsx

Important rule:

This file is not legal advice.

Before using final client agreements, have the legal terms reviewed by an attorney.

Also, do not rewrite payment/scope/ownership language casually in random components.

⸻

index.js

Purpose:

Exports all data files from one place.

This allows future React components to import cleanly.

Instead of this:

import { websitePackages } from "../data/packages";
import { addons } from "../data/addons";
import { carePlans } from "../data/carePlans";

Use this:

import { websitePackages, addons, carePlans } from "../data";

Important rule:

If a new data file is added later, also export it from index.js.

⸻

README.md

Purpose:

Explains what the src-data folder is and what each file does.

Use this when:

* You need a simple explanation of the folder
* You want to remember what files exist
* You need to understand the purpose of the data foundation

Important rule:

README is the folder explanation.

This dataUsagePlan.md file is the usage and continuation plan.

⸻

futureInstallChecklist.md

Purpose:

Explains how to set up the new computer and continue the React/Vite build.

Use this when:

* You get the new computer
* Nothing is installed yet
* You need to install VS Code, Node, Git, Chrome
* You need to create the Vite project
* You need to move src-data into src/data

Important rule:

Open this file when setting up the new computer.

Follow it before trying to build the React app.

⸻

Recommended First Files to Open Later

When coming back to the project later, open these in this order:

1. dataUsagePlan.md
2. futureInstallChecklist.md
3. README.md
4. projectRoadmap.js
5. componentMap.js
6. index.js

Why this order:

* dataUsagePlan.md explains how everything fits together.
* futureInstallChecklist.md explains how to set up the new computer.
* README.md explains what each file is.
* projectRoadmap.js explains build phases.
* componentMap.js explains the React component plan.
* index.js confirms what files are exported.

⸻

Future React Project Folder Structure

The future React/Vite project should eventually look like this:

hullinger-digital-v2/
  src/
    components/
      builder/
      forms/
      layout/
      navigation/
      packages/
      sections/
      ui/
      visuals/
    data/
      packages.js
      addons.js
      carePlans.js
      paymentPlans.js
      builderSteps.js
      intakeQuestions.js
      sitePages.js
      brandSystem.js
      contentBlocks.js
      visualSections.js
      projectRoadmap.js
      componentMap.js
      copyDrafts.js
      schemaPlan.js
      legalTermsPlan.js
      index.js
      README.md
      futureInstallChecklist.md
      dataUsagePlan.md
    pages/
      Home.jsx
      StarterWebPage.jsx
      LaunchWebsite.jsx
      LeadGeneratingWebsite.jsx
      AdvancedWebsite.jsx
      Pricing.jsx
      About.jsx
      WebsiteReview.jsx
      TermsPreview.jsx
      WebsiteBuilder.jsx
    styles/
      variables.css
      global.css
      layout.css
    utils/
      calculateProjectTotal.js
      filterAddonsByPackage.js
      getPaymentOptionsForPackage.js
      validateBuilderStep.js
    App.jsx
    main.jsx

⸻

Future Build Order

When the new computer is ready and React/Vite is installed, build in this order:

Step 1 — Move data

Move:

src-data/

Into:

src/data/

Do not recreate the files.

⸻

Step 2 — Confirm imports work

Temporarily test:

import { websitePackages, sitePages } from "./data";

If the app can display package names and page names, the data is working.

⸻

Step 3 — Create global styles

Create:

src/styles/variables.css
src/styles/global.css
src/styles/layout.css

Use brandSystem.js as the design reference.

The first CSS goal is:

* Colors
* Fonts
* Body background
* Text styles
* Section spacing
* Buttons
* Cards
* Layout widths

⸻

Step 4 — Build layout components

Create:

MainLayout.jsx
Header.jsx
Footer.jsx
NavMenu.jsx
Button.jsx
Section.jsx
Card.jsx
Badge.jsx
Callout.jsx

Use:

sitePages.js
brandSystem.js
contentBlocks.js

⸻

Step 5 — Build visual placeholder components

Create:

DeviceMockup.jsx
FloatingUICards.jsx
ProcessDiagram.jsx
DashboardMockup.jsx

Use:

visualSections.js
brandSystem.js

Do this early so pages do not become text-only.

⸻

Step 6 — Build homepage

Create:

Home.jsx

Use:

sitePages.js
copyDrafts.js
contentBlocks.js
packages.js
visualSections.js

Homepage should include:

* Hero
* Website should do more section
* Template vs custom section
* SEO foundation section
* Service selector
* Hands-on process
* Advanced possibilities
* Pricing preview
* Review process
* Final CTA

⸻

Step 7 — Build service pages

Create:

StarterWebPage.jsx
LaunchWebsite.jsx
LeadGeneratingWebsite.jsx
AdvancedWebsite.jsx

Use:

packages.js
sitePages.js
copyDrafts.js
contentBlocks.js
visualSections.js

⸻

Step 8 — Build supporting pages

Create:

Pricing.jsx
About.jsx
WebsiteReview.jsx
TermsPreview.jsx

Use:

packages.js
addons.js
carePlans.js
paymentPlans.js
copyDrafts.js
contentBlocks.js
legalTermsPlan.js
schemaPlan.js

⸻

Step 9 — Build website builder

Create:

WebsiteBuilder.jsx
BuilderLayout.jsx
BuilderProgress.jsx
PackageSelector.jsx
AddOnSelector.jsx
QuantitySelector.jsx
NotesField.jsx
CarePlanSelector.jsx
PaymentPlanSelector.jsx
IntakeQuestionRenderer.jsx
PriceSummary.jsx
ReviewSummary.jsx
AcknowledgementList.jsx

Use:

packages.js
addons.js
carePlans.js
paymentPlans.js
builderSteps.js
intakeQuestions.js
legalTermsPlan.js
contentBlocks.js

⸻

Step 10 — Build utility functions

Create:

calculateProjectTotal.js
filterAddonsByPackage.js
getPaymentOptionsForPackage.js
validateBuilderStep.js

These should keep the builder logic out of React components.

⸻

Step 11 — Add forms/integrations later

Later integrations may include:

* Website review form submission
* Builder submission
* Email confirmation
* Internal notification
* Payment processor
* E-signature/contract flow
* Project record storage
* File uploads

Do not start here first.

Build the front-end structure before integrations.

⸻

Step 12 — SEO and launch prep

Use:

schemaPlan.js
sitePages.js
copyDrafts.js

Prepare:

* Page titles
* Meta descriptions
* JSON-LD schema
* Sitemap
* Robots.txt
* Open Graph image
* Analytics
* Search Console
* Responsive testing
* Form testing
* Performance testing

⸻

What Not To Do

Do not restart from scratch.

Do not recreate these data files manually later.

Do not hardcode package prices in React components.

Do not hardcode navigation in multiple places.

Do not rewrite legal/payment language in random page components.

Do not build the website builder before the basic layout and homepage exist.

Do not leave major visual sections as blank placeholders.

Do not install React/Vite on a computer without enough storage unless absolutely necessary.

Do not keep both src-data/ and src/data/ inside the same React project.

⸻

What Can Change Later

These files are real project files, but they are not frozen forever.

They can be edited later when needed.

Acceptable future edits:

* Adjust package pricing
* Add or remove add-ons
* Improve copy
* Add FAQ questions
* Add SEO details
* Add new pages
* Refine builder steps
* Improve legal language after attorney review
* Add new component plans
* Add new visual ideas

But changes should be intentional.

Important business rules should not be changed casually.

⸻

The Final Plan

The plan is:

1. Finish the src-data foundation.
2. Back it up safely.
3. Get the new computer.
4. Install Chrome, VS Code, Node.js LTS, and Git.
5. Create the Vite React app.
6. Move src-data into src/data.
7. Confirm imports work through index.js.
8. Build global styles from brandSystem.js.
9. Build layout and UI components from componentMap.js.
10. Build the homepage from sitePages.js, copyDrafts.js, contentBlocks.js, packages.js, and visualSections.js.
11. Build package pages.
12. Build pricing, about, review, and terms pages.
13. Build the website builder.
14. Add calculator utilities.
15. Add forms, payment, agreement, and submission integrations.
16. Add SEO metadata and schema.
17. Test, polish, and launch.

⸻

One-Sentence Summary

The src-data folder is the source of truth for the future Hullinger Digital V2 React website, and the React components should be built around these files instead of replacing them.