/* =========================================================
  GLOBAL SITE JAVASCRIPT
========================================================= */

function initSiteNavigation() {
  const navToggle = document.querySelector("[data-nav-toggle]");
  const siteNav = document.querySelector("[data-site-nav]");

  if (!navToggle || !siteNav) return;

  // Prevent duplicate init
  if (navToggle.dataset.navInitialized === "true") return;
  navToggle.dataset.navInitialized = "true";

  const openNav = () => {
    siteNav.classList.add("is-open");
    navToggle.classList.add("is-active");
    document.body.classList.add("nav-open");

    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Close navigation");
  };

  const closeNav = () => {
    siteNav.classList.remove("is-open");
    navToggle.classList.remove("is-active");
    document.body.classList.remove("nav-open");

    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation");
  };

  // Toggle
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.contains("is-open");
    isOpen ? closeNav() : openNav();
  });

  // Close on nav link click
  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeNav);
  });

  // Close on outside click
  document.addEventListener("click", (event) => {
    const isInsideNav = siteNav.contains(event.target);
    const isToggle = navToggle.contains(event.target);

    if (!isInsideNav && !isToggle && siteNav.classList.contains("is-open")) {
      closeNav();
    }
  });

  // Close on ESC (only if open)
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !siteNav.classList.contains("is-open")) return;
    closeNav();
  });

  // Fix resize issues
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1120) {
      closeNav();
    }
  });
}

function initCurrentYear() {
  const yearElement = document.querySelector("#current-year");
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

function initActiveNavLink() {
  const navLinks = document.querySelectorAll("[data-nav-link]");
  if (!navLinks.length) return;

  const currentPath = window.location.pathname;
  const currentFile = currentPath.split("/").pop() || "index.html";
  const currentPage = currentFile.replace(".html", "") || "index";

  navLinks.forEach((link) => {
    const linkPage = link.getAttribute("data-nav-link");

    const isActive =
      linkPage === currentPage ||
      (currentPage === "" && linkPage === "index");

    if (isActive) {
      link.classList.add("site-nav__link--active");
      link.setAttribute("aria-current", "page");
    } else {
      link.classList.remove("site-nav__link--active");
      link.removeAttribute("aria-current");
    }
  });
}

function initSiteScripts() {
  initSiteNavigation();
  initCurrentYear();
  initActiveNavLink();
}

/* =========================================================
  PARTIALS SUPPORT
========================================================= */

document.addEventListener("partialsLoaded", initSiteScripts);

/* =========================================================
  FALLBACK (no partials)
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  if (!document.querySelector("[data-include]")) {
    initSiteScripts();
  }
});
