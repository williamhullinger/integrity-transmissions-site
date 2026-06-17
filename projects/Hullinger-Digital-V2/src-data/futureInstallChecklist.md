Future Install Checklist — Hullinger Digital V2

This checklist is for setting up a brand-new computer for the Hullinger Digital V2 React/Vite build.

The goal is to quickly get the new computer ready, move the existing src-data files into the real React project, and continue the build without starting over.

⸻

Important Reminder

The files already created in src-data are not throwaway files.

They are the real planning and data foundation for the future React build.

The temporary folder is:

src-data/

Later, inside the real React/Vite project, those files should live here:

src/data/

The work already completed should be moved, not recreated.

⸻

Phase 1 — New Computer Setup

1. Set up the computer normally

Complete the normal first-time computer setup:

* Sign into Windows
* Connect to Wi-Fi
* Run Windows updates
* Restart if needed
* Make sure the computer has plenty of free storage

Recommended before starting development:

At least 50 GB free space

More is better.

⸻

2. Install Google Chrome

Install Google Chrome for testing the website in a modern browser.

Use Chrome for:

* Local website preview
* Responsive testing
* DevTools
* Form testing
* Performance checks

⸻

3. Install Visual Studio Code

Install Visual Studio Code.

Use it as the main code editor for:

* React files
* JavaScript files
* CSS files
* Markdown notes
* Project folders

After installing VS Code, open it once to make sure it works.

⸻

4. Install Node.js

Install Node.js using the LTS version.

Use the LTS version, not the experimental/current version.

Node.js is needed for:

* npm
* Vite
* React
* Running the local development server
* Installing packages

After installing Node.js, restart the computer or close and reopen the terminal.

⸻

5. Confirm Node and npm are installed

Open Command Prompt, PowerShell, or the VS Code terminal.

Run:

node -v

Then run:

npm -v

If both commands show version numbers, Node and npm are installed correctly.

If either command says it is not recognized, restart the computer and try again.

⸻

6. Install Git

Install Git for Windows.

Git is needed for:

* Version control
* Saving project history
* Future GitHub connection
* Safer development

After installing Git, open a new terminal and run:

git --version

If it shows a version number, Git is installed correctly.

⸻

Phase 2 — Move Existing Project Files to the New Computer

1. Copy the current project folder

Copy the current project folder from the old computer to the new computer.

Current folder:

Hullinger-Digital-V2/

It should contain:

src-data/

Inside src-data, confirm these files exist:

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

Do not rebuild these files from scratch.

⸻

2. Save a backup copy

Before creating the React app, make a backup copy of the current folder.

Example backup folder name:

Hullinger-Digital-V2-Backup

This protects the data files in case something gets moved into the wrong place later.

⸻

Phase 3 — Create the React/Vite Project

1. Open the parent folder in VS Code

Open VS Code.

Choose:

File > Open Folder

Open the folder where the new React project should live.

Example:

Documents/Projects/

⸻

2. Open the VS Code terminal

In VS Code, open:

Terminal > New Terminal

⸻

3. Create the Vite React project

Run:

npm create vite@latest hullinger-digital-v2 -- --template react

This creates a new React/Vite project folder named:

hullinger-digital-v2

⸻

4. Go into the project folder

Run:

cd hullinger-digital-v2

⸻

5. Install project dependencies

Run:

npm install

This creates the node_modules folder.

This is why we waited for the new computer.

⸻

6. Start the development server

Run:

npm run dev

Vite should show a local development address that looks similar to:

http://localhost:5173/

Open that address in Chrome.

If the default Vite React page loads, the React setup works.

⸻

Phase 4 — Move src-data Into the React Project

1. Stop the dev server first

In the terminal, press:

Ctrl + C

If it asks to confirm, type:

Y

Then press Enter.

⸻

2. Create the data folder

Inside the React project, go to:

src/

Create a folder named:

data

The path should now be:

src/data/

⸻

3. Move all files from src-data into src/data

Move the files from:

src-data/

Into:

hullinger-digital-v2/src/data/

After moving, the React project should look like this:

hullinger-digital-v2/
  src/
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

⸻

4. Do not keep duplicate copies inside the React project

Inside the React project, the data files should live in one place:

src/data/

Avoid having both of these inside the same React project:

src-data/
src/data/

That can cause confusion later.

Keep one clean version inside:

src/data/

⸻

Phase 5 — Test That Data Imports Work

1. Open src/App.jsx

Inside the React project, open:

src/App.jsx

Temporarily replace the file with this test:

import { websitePackages, sitePages } from "./data";
function App() {
  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Hullinger Digital V2</h1>
      <h2>Packages</h2>
      <ul>
        {websitePackages.map((item) => (
          <li key={item.id}>
            {item.name}
          </li>
        ))}
      </ul>
      <h2>Pages</h2>
      <ul>
        {sitePages.map((page) => (
          <li key={page.id}>
            {page.pageTitle}
          </li>
        ))}
      </ul>
    </main>
  );
}
export default App;

⸻

2. Restart the dev server

Run:

npm run dev

Open the local Vite link in Chrome.

If the page shows the package names and page names, the data files are working.

⸻

3. If there is an error

Check these first:

* Make sure src/data/index.js exists
* Make sure the import says ./data
* Make sure the files are inside src/data/
* Make sure file names match exactly
* Make sure all files were saved
* Make sure no code block formatting like id="..." accidentally got pasted inside JavaScript code fences in .js files

⸻

Phase 6 — Clean Up the Default Vite Files

After confirming the data imports work, remove or replace default Vite demo content.

Common files to edit later:

src/App.jsx
src/App.css
src/index.css

Do not delete important files unless we are intentionally replacing them.

⸻

Phase 7 — Create the Real Folder Structure

Inside src/, create these folders later:

components/
components/layout/
components/navigation/
components/ui/
components/sections/
components/packages/
components/builder/
components/forms/
components/visuals/
pages/
styles/
utils/
data/

The data/ folder already contains the files we created.

⸻

Phase 8 — Build Order

Build in this order:

1. Global styles and CSS variables
2. Main layout
3. Header
4. Footer
5. Navigation
6. Buttons
7. Section wrapper
8. Cards
9. Basic visual mockup components
10. Homepage
11. Package pages
12. Pricing page
13. About page
14. Website Review page
15. Terms Preview page
16. Website Builder layout
17. Builder package selector
18. Builder add-on selector
19. Builder price summary
20. Builder intake questions
21. Builder review step
22. Agreement/payment step
23. Forms and submission flow
24. SEO metadata
25. Final visual polish
26. Testing and launch

⸻

Phase 9 — Recommended VS Code Extensions

Install these VS Code extensions:

* Prettier
* ESLint
* Auto Rename Tag
* GitLens
* Markdown All in One
* Error Lens

Optional:

* Live Server

For React/Vite, npm run dev is the main local preview command, so Live Server is not required.

⸻

Phase 10 — Recommended Project Commands

Start development server:

npm run dev

Stop development server:

Ctrl + C

Install a package:

npm install package-name

Build production files:

npm run build

Preview production build:

npm run preview

⸻

Phase 11 — Git Setup

After the React project is created and working, initialize Git:

git init

Add files:

git add .

Commit first version:

git commit -m "Initial Hullinger Digital V2 React setup"

Important:

Do not commit node_modules.

The default Vite .gitignore should already exclude it.

⸻

Phase 12 — Files That Should Not Be Edited Randomly

Be careful editing these files because they are core project data:

src/data/packages.js
src/data/addons.js
src/data/paymentPlans.js
src/data/builderSteps.js
src/data/intakeQuestions.js
src/data/legalTermsPlan.js

Small edits are fine when intentional, but pricing, payment, scope, and legal language should be changed carefully.

⸻

Phase 13 — What Is Already Done

These foundation areas are already planned:

* Website packages
* Add-ons
* Care plans
* Payment plans
* Builder steps
* Intake questions
* Site pages
* Brand system
* Reusable content blocks
* Visual section planning
* Project roadmap
* React component map
* Copy drafts
* SEO/schema planning
* Legal terms planning
* Data export index
* Folder README
* Future install checklist

This means the project should not start from a blank screen when the new computer is ready.

⸻

Phase 14 — What Comes After Setup

After the new computer is ready and the React/Vite project is running, the next real build step is:

Create global CSS variables from brandSystem.js

Then build:

MainLayout
Header
Footer
Button
Section
Card

After that, build the homepage.

⸻

Final Rule

Do not restart the project from scratch.

Move the existing data files into the real React project and build around them.

The data files are the foundation.
The React components are the structure.
The CSS is the design.
The builder logic turns the data into an interactive website planning tool.