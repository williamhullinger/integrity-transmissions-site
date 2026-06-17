Hullinger Digital V2 — Data Foundation

This folder contains the planning and data foundation for the future Hullinger Digital V2 React/Vite website.

These files were created before installing React/Vite so the project can move forward without requiring Node, dependencies, or a large node_modules folder on a storage-limited computer.

When the full React/Vite project is created later, this folder can be moved into:

src/data/

Then React components can import from:

import { websitePackages, addons, sitePages } from "./data";

⸻

Folder Purpose

The goal of this folder is to keep important website content, pricing, scope rules, builder logic, brand direction, and project planning separate from React components.

This makes the final build easier to maintain because package prices, add-ons, page copy, terms, builder steps, and SEO details should not be hardcoded all over the website.

⸻

Files

packages.js

Defines the main website packages:

* Starter Web Page
* Launch Website
* Lead-Generating Website
* Advanced Website

Includes pricing, package descriptions, included features, exclusions, revision counts, timeline expectations, payment options, upgrade rules, and review notices.

Use this file later for:

* Package cards
* Pricing page
* Website builder package selection
* Service pages
* Package comparison sections

⸻

addons.js

Defines all website add-ons and add-on categories.

Includes add-ons for:

* Pages and content
* SEO and local visibility
* Design and media
* Forms and lead capture
* Online sales and payments
* Booking and scheduling
* Automations
* Customer tools
* Employee/internal tools
* AI tools

Use this file later for:

* Builder add-on selection
* Pricing page add-on overview
* Scope review
* Price calculations
* Advanced project review logic

⸻

carePlans.js

Defines ongoing monthly care plans.

Includes:

* Essential Care
* Professional Care
* Growth Care
* Advanced Care

Use this file later for:

* Pricing page care plan comparison
* Builder care plan selection
* Post-launch support explanation
* Monthly service total calculation

⸻

paymentPlans.js

Defines payment option types and package-specific payment plans.

Includes:

* Pay-in-full options
* Deposit and balance options
* Milestone options
* Monthly payment options
* Due-today amounts
* Total payment plan cost
* Ownership and payment plan rules

Use this file later for:

* Builder payment step
* Pricing page payment explanation
* Price summary
* Agreement/payment acknowledgements

⸻

builderSteps.js

Defines the website builder flow.

Includes steps for:

* Choosing a package
* Selecting pages/content add-ons
* Selecting design/media add-ons
* Selecting SEO features
* Selecting forms and lead capture
* Selecting payment/booking features
* Selecting automations
* Selecting advanced tools
* Providing design direction
* Providing business/project intake
* Reviewing the summary
* Agreement and payment

Use this file later for:

* Builder progress navigation
* Step-by-step builder UI
* Validation rules
* Review summary
* Required acknowledgements

⸻

intakeQuestions.js

Defines questions used to collect project details.

Includes questions for:

* Design direction
* Business details
* Project goals
* Assets and access
* Advanced project requirements

Use this file later for:

* Website builder intake steps
* Website review form
* Conditional questions
* Project summary generation
* Internal project review

⸻

sitePages.js

Defines the main website pages and navigation structure.

Includes:

* Homepage
* Starter Web Page
* Launch Website
* Lead-Generating Website
* Advanced Website
* Website Builder
* Pricing
* About
* Website Review
* Terms Preview

Use this file later for:

* React routes
* Navigation menu
* Footer links
* Page metadata
* Hero content
* Page section outlines

⸻

brandSystem.js

Defines the brand direction and design rules.

Includes:

* Brand positioning
* Tone
* Color palette
* Typography direction
* Layout rules
* Component styling rules
* Visual language
* Motion rules
* Accessibility rules
* SEO defaults
* Responsive design rules

Use this file later for:

* Global CSS variables
* Design system setup
* Buttons
* Cards
* Forms
* Section styling
* Visual consistency

⸻

contentBlocks.js

Defines reusable website copy blocks.

Includes:

* Custom vs template explanation
* SEO foundation explanation
* Hands-on builder notice
* Structured review process
* Scope review clause
* Payment plan notice
* Advanced website explanation
* Package upgrade logic
* Client responsibilities
* FAQ blocks
* Reusable microcopy

Use this file later for:

* Homepage sections
* Pricing page
* Service pages
* Builder review step
* FAQ sections
* Agreement acknowledgements

⸻

visualSections.js

Defines planned visuals, mockups, diagrams, and future animation/reel concepts.

Includes visuals for:

* Homepage hero mockup
* Template vs custom comparison
* SEO search-to-lead path
* Builder process timeline
* Advanced tools dashboard
* Service page mockups
* Pricing comparison
* About page systems diagram

Use this file later for:

* Visual placeholders
* Mockup components
* Animation planning
* Future design assets
* Future reels/videos

⸻

projectRoadmap.js

Defines the build phases for the full Hullinger Digital V2 project.

Includes phases for:

* Foundation files
* React/Vite setup
* Core layout
* Homepage build
* Service pages
* Supporting pages
* Website builder V1
* Visual polish
* Forms and integrations
* SEO/testing/launch

Use this file later for:

* Project planning
* Build order
* Staying organized
* Moving from data files to React components

⸻

componentMap.js

Defines the React component architecture before the React build starts.

Includes planned components for:

* Layout
* UI elements
* Page sections
* Package sections
* Builder components
* Forms
* Visuals
* Pages
* Utility functions

Use this file later for:

* Creating folders
* Creating React component files
* Avoiding random file creation
* Building in the right order

⸻

copyDrafts.js

Defines polished page copy drafts.

Includes copy for:

* Homepage
* Starter Web Page
* Launch Website
* Lead-Generating Website
* Advanced Website
* Pricing
* About
* Website Review
* Terms Preview

Use this file later for:

* Page content
* Section copy
* React page components
* Copy review and editing

⸻

schemaPlan.js

Defines SEO metadata and structured data planning.

Includes:

* Default SEO settings
* Page SEO plans
* Organization schema plan
* Website schema plan
* Service schema plan
* FAQ schema plan
* Breadcrumb schema plan
* Sitemap plan
* Robots plan
* SEO build notes

Use this file later for:

* Page metadata
* JSON-LD structured data
* Sitemap
* Robots.txt
* SEO helper utilities

⸻

legalTermsPlan.js

Defines terms, agreement structure, scope rules, payment terms, ownership language, and required acknowledgements.

Includes:

* Project scope
* Order review before production
* Payment before work
* Payment options
* Balance before launch
* Monthly payment plan rules
* Missed payment language
* Ownership transfer
* Client responsibilities
* Revisions
* Change orders
* Third-party costs
* Timeline
* Launch
* Care plans
* Cancellation/refund notes
* Advanced project review terms

Use this file later for:

* Terms page
* Builder acknowledgements
* Agreement preview
* Contract drafting
* Scope protection

Important: this file is not legal advice and should be reviewed by an attorney before being used as a final agreement.

⸻

index.js

Exports all data files from one place.

Use this file later so the React build can import cleanly:

import {
  websitePackages,
  addons,
  carePlans,
  paymentPlanTypes,
  sitePages,
  brandSystem,
} from "./data";

⸻

Future React Folder Move

Current temporary folder:

src-data/

Future React folder:

src/data/

When moving into the React project, move each file from src-data into src/data.

After moving, update import paths as needed.

⸻

Build Principle

The final React build should be data-first.

That means:

* Package prices come from packages.js
* Add-ons come from addons.js
* Care plans come from carePlans.js
* Payment rules come from paymentPlans.js
* Page structure comes from sitePages.js
* Reusable copy comes from contentBlocks.js
* Page copy comes from copyDrafts.js
* Builder steps come from builderSteps.js
* Intake questions come from intakeQuestions.js
* Legal terms come from legalTermsPlan.js

Do not hardcode important prices, package names, add-on rules, page titles, or payment terms directly inside React components unless there is a specific reason.

⸻

Current Recommendation

Do not install React/Vite on the storage-limited computer yet.

Wait until the better development computer is ready, then:

1. Create the React/Vite project.
2. Move this folder into src/data.
3. Set up global styles.
4. Build layout components.
5. Build the homepage.
6. Build service pages.
7. Build pricing/about/terms/review pages.
8. Build the website builder.
9. Connect forms, payment, and agreement flow.
10. Test, polish, and launch.