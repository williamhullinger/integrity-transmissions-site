/* =========================================================
  GLOBAL SITE JAVASCRIPT
========================================================= */


/* =========================================================
  SITE NAVIGATION
========================================================= */

function initSiteNavigation() {
  const navToggle = document.querySelector("[data-nav-toggle]");
  const siteNav = document.querySelector("[data-site-nav]");

  if (!navToggle || !siteNav) return;

  // Prevent duplicate initialization
  if (navToggle.dataset.navInitialized === "true") return;

  navToggle.dataset.navInitialized = "true";

  const openNav = () => {
    siteNav.classList.add("is-open");
    navToggle.classList.add("is-active");
    document.body.classList.add("nav-open");

    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Close navigation");
    requestAnimationFrame(() => siteNav.querySelector("a")?.focus());
  };

  const closeNav = ({ returnFocus = false } = {}) => {
    siteNav.classList.remove("is-open");
    navToggle.classList.remove("is-active");
    document.body.classList.remove("nav-open");

    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation");
    if (returnFocus) navToggle.focus();
  };

  // Open / close mobile navigation
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.contains("is-open");

    if (isOpen) {
      closeNav();
    } else {
      openNav();
    }
  });

  // Close navigation after selecting a link
  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => closeNav());
  });

  // Close when clicking outside navigation
  document.addEventListener("click", (event) => {
    const clickedInsideNav = siteNav.contains(event.target);
    const clickedToggle = navToggle.contains(event.target);

    if (
      !clickedInsideNav &&
      !clickedToggle &&
      siteNav.classList.contains("is-open")
    ) {
      closeNav();
    }
  });

  // Close with Escape
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      siteNav.classList.contains("is-open")
    ) {
      closeNav({ returnFocus: true });
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Tab" || !siteNav.classList.contains("is-open")) return;
    const focusable = [navToggle, ...siteNav.querySelectorAll("a[href]")];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  // Reset mobile navigation when returning to desktop width
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1520) {
      closeNav();
    }
  });
}


/* =========================================================
  CURRENT YEAR
========================================================= */

function initCurrentYear() {
  const yearElement = document.querySelector("#current-year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}


/* =========================================================
  ACTIVE NAVIGATION LINK
========================================================= */

function initActiveNavLink() {
  const navLinks = document.querySelectorAll("[data-nav-link]");

  if (!navLinks.length) return;

  const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
  const currentFile = currentPath.split("/").pop() || "index";
  let currentPage = currentFile.replace(".html", "") || "index";

  if (currentPath.startsWith("/services/")) {
    currentPage = "services";
  } else if (["/reman-powertrain", "/reman-engines", "/reman-transfer-cases"].includes(currentPath)) {
    currentPage = "reman-powertrain";
  } else if (currentPath.startsWith("/reman-transmissions/")) {
    currentPage = "reman-powertrain";
  } else if (currentPath === "/reman-transmissions") {
    currentPage = "reman-powertrain";
  } else if (currentPath.startsWith("/transmissions/")) {
    currentPage = "transmissions";
  } else if (currentPath === "/service-area") {
    currentPage = "services";
  } else if (currentPath === "/") {
    currentPage = "index";
  }

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


/* =========================================================
  PRIVACY-SAFE CONVERSION EVENT HOOKS
========================================================= */

function pushConversionEvent(eventName, details = {}) {
  const allowedKeys = new Set([
    "page_path", "destination", "destination_path", "form_name", "unit_type", "category",
    "transmission_family", "upgrade_level", "warranty", "candidate_count",
    "rate_count", "round_trip", "delivery_type", "scroll_percent", "link_host",
    "value", "currency", "item_category", "transaction_id", "shipping", "tax",
  ]);
  const safeDetails = Object.fromEntries(Object.entries(details)
    .filter(([key]) => allowedKeys.has(key))
    .map(([key, value]) => [key, typeof value === "string" ? value.slice(0, 120) : value])
    .filter(([, value]) => ["string", "number", "boolean"].includes(typeof value)));
  if (Array.isArray(details.items)) {
    const allowedItemKeys = new Set(["item_id", "item_name", "item_category", "item_variant", "price", "quantity"]);
    safeDetails.items = details.items.slice(0, 20).map((item) => Object.fromEntries(Object.entries(item || {})
      .filter(([key]) => allowedItemKeys.has(key))
      .map(([key, value]) => [key, typeof value === "string" ? value.slice(0, 120) : value])
      .filter(([, value]) => ["string", "number"].includes(typeof value))))
      .filter((item) => item.item_id || item.item_name);
  }
  const safeEventName = String(eventName || "").toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 40);

  if (!safeEventName) return;
  window.dataLayer = window.dataLayer || [];
  window.integrityAnalyticsQueue = window.integrityAnalyticsQueue || [];
  const eventData = { event: safeEventName, ...safeDetails };
  window.dataLayer.push(eventData);
  window.integrityAnalyticsQueue.push(eventData);
  window.integrityAnalyticsDispatch?.(eventData);
}

function initConversionTracking() {
  const leadConfirmationKey = "integrity_pending_lead_v1";
  const leadFormContext = (form) => ({
    form_name: form.getAttribute("name") || form.id || "unknown",
    unit_type: form.querySelector('[name="unit-type"]')?.value || (form.getAttribute("name") === "reman-transmission-quote" ? "reman-transmission" : "service"),
  });

  if (["/thank-you", "/thank-you.html"].includes(window.location.pathname.replace(/\/+$/, ""))) {
    try {
      const pending = JSON.parse(sessionStorage.getItem(leadConfirmationKey) || "null");
      sessionStorage.removeItem(leadConfirmationKey);
      if (pending && Number.isFinite(pending.submitted_at) && Date.now() - pending.submitted_at <= 30 * 60 * 1000) {
        pushConversionEvent("generate_lead", {
          page_path: window.location.pathname,
          form_name: pending.form_name,
          unit_type: pending.unit_type,
        });
      }
    } catch {
      try { sessionStorage.removeItem(leadConfirmationKey); } catch { /* Storage is optional. */ }
    }
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");

    if (!link) return;

    const href = link.getAttribute("href") || "";

    if (href.startsWith("tel:")) {
      pushConversionEvent("phone_click", { page_path: window.location.pathname });
    } else if (href.startsWith("sms:")) {
      pushConversionEvent("text_click", { page_path: window.location.pathname });
    } else if (href.includes("/contact") || href.includes("contact.html") || href.includes("#vin-quote")) {
      pushConversionEvent("quote_cta_click", {
        page_path: window.location.pathname,
        destination: href,
      });
    }
  });

  document.querySelectorAll('form[action="/thank-you"], form[action="/thank-you.html"]').forEach((form) => {
    let started = false;
    form.addEventListener("input", () => {
      if (started) return;
      started = true;
      pushConversionEvent("quote_form_start", {
        page_path: window.location.pathname,
        form_name: form.getAttribute("name") || form.id || "unknown",
        unit_type: form.querySelector('[name="unit-type"]')?.value || "service",
      });
    }, { once: true });

    form.addEventListener("submit", (event) => {
      queueMicrotask(() => {
        if (event.defaultPrevented) return;

        const formContext = leadFormContext(form);

        pushConversionEvent("quote_form_submit", {
          page_path: window.location.pathname,
          ...formContext,
        });

        const action = new URL(form.getAttribute("action") || window.location.href, window.location.href);
        if (action.origin === window.location.origin && ["/thank-you", "/thank-you.html"].includes(action.pathname.replace(/\/+$/, ""))) {
          try {
            sessionStorage.setItem(leadConfirmationKey, JSON.stringify({ ...formContext, submitted_at: Date.now() }));
          } catch {
            // The submission remains usable when session storage is unavailable; only confirmation analytics are skipped.
          }
        }
      });
    });
  });
}


/* =========================================================
  CONSENT-CONTROLLED ANALYTICS
========================================================= */

const ANALYTICS_CONSENT_KEY = "integrity_analytics_consent_v1";
const ATTRIBUTION_SESSION_KEY = "integrity_attribution_v1";

function setAttributionFields() {
  const params = new URLSearchParams(window.location.search);
  const currentAttribution = {
    "utm-source": params.get("utm_source") || "",
    "utm-medium": params.get("utm_medium") || "",
    "utm-campaign": params.get("utm_campaign") || "",
    "landing-page": window.location.pathname.slice(0, 160),
    "referrer-host": (() => {
      try { return document.referrer ? new URL(document.referrer).hostname.slice(0, 120) : ""; }
      catch { return ""; }
    })(),
  };
  let attribution = currentAttribution;

  try {
    const saved = JSON.parse(sessionStorage.getItem(ATTRIBUTION_SESSION_KEY) || "null");
    const hasCampaign = Boolean(currentAttribution["utm-source"] || currentAttribution["utm-medium"] || currentAttribution["utm-campaign"]);
    if (saved && !hasCampaign) attribution = saved;
    else sessionStorage.setItem(ATTRIBUTION_SESSION_KEY, JSON.stringify(currentAttribution));
  } catch {
    // Form attribution still works on the current page when session storage is unavailable.
  }

  document.querySelectorAll("[data-attribution-form]").forEach((form) => {
    Object.entries(attribution).forEach(([name, value]) => {
      const field = form.querySelector(`[name="${name}"]`);
      if (field) field.value = value;
    });
  });
}

function createAnalyticsConsentPanel() {
  const panel = document.createElement("aside");
  panel.className = "privacy-consent";
  panel.hidden = true;
  panel.setAttribute("aria-labelledby", "privacy-consent-title");
  panel.innerHTML = `
    <h2 id="privacy-consent-title">Optional website analytics</h2>
    <p>Allow anonymous usage analytics and session-quality tools so we can improve product pages and quote paths. We do not send VINs, names, phone numbers, email addresses, delivery addresses or payment details. Read our <a href="/privacy">Privacy Policy</a>.</p>
    <div class="privacy-consent__actions">
      <button class="btn btn-primary" type="button" data-analytics-allow>Allow Analytics</button>
      <button class="btn btn-secondary" type="button" data-analytics-decline>Not Now</button>
    </div>`;
  document.body.appendChild(panel);
  return panel;
}

function loadExternalScript(source, attributes = {}) {
  if (document.querySelector(`script[src="${source}"]`)) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = source;
  Object.entries(attributes).forEach(([name, value]) => script.setAttribute(name, value));
  document.head.appendChild(script);
}

function activateAnalytics(config) {
  if (window.integrityAnalyticsActive) return;
  window.integrityAnalyticsActive = true;

  if (config.ga4MeasurementId) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
    window.gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    });
    window.gtag("consent", "update", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "granted",
    });
    window.gtag("js", new Date());
    window.gtag("config", config.ga4MeasurementId, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
    loadExternalScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.ga4MeasurementId)}`);
  }

  if (config.clarityProjectId) {
    window.clarity = window.clarity || function clarity() {
      (window.clarity.q = window.clarity.q || []).push(arguments);
    };
    loadExternalScript(`https://www.clarity.ms/tag/${encodeURIComponent(config.clarityProjectId)}`);
    window.clarity("consentv2", { ad_Storage: "denied", analytics_Storage: "granted" });
  }

  window.integrityAnalyticsDispatch = (eventData) => {
    const { event, ...parameters } = eventData;
    if (config.ga4MeasurementId && typeof window.gtag === "function") {
      window.gtag("event", event, parameters);
    }
    if (config.clarityProjectId && typeof window.clarity === "function") {
      window.clarity("event", event);
    }
  };

  (window.integrityAnalyticsQueue || []).forEach(window.integrityAnalyticsDispatch);
  window.integrityAnalyticsQueue = [];
}

function initEngagementTracking() {
  const category = document.body.dataset.analyticsCategory;
  if (category) {
    pushConversionEvent("view_product_category", {
      page_path: window.location.pathname,
      category,
    });
  }

  const reached = new Set();
  const onScroll = () => {
    const available = document.documentElement.scrollHeight - window.innerHeight;
    if (available <= 0) return;
    const percent = Math.round((window.scrollY / available) * 100);
    [25, 50, 75, 90].forEach((threshold) => {
      if (percent >= threshold && !reached.has(threshold)) {
        reached.add(threshold);
        pushConversionEvent("scroll_depth", {
          page_path: window.location.pathname,
          scroll_percent: threshold,
        });
      }
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link) return;
    try {
      const url = new URL(link.href, window.location.href);
      if (category === "transmission-buying-guide" && url.origin === window.location.origin) {
        pushConversionEvent("buying_guide_link_click", {
          page_path: window.location.pathname,
          destination_path: url.pathname,
        });
      }
      if (url.origin !== window.location.origin && !["tel:", "sms:", "mailto:"].includes(url.protocol)) {
        pushConversionEvent("outbound_click", {
          page_path: window.location.pathname,
          link_host: url.hostname,
        });
      }
    } catch {
      // Ignore malformed links; navigation remains unaffected.
    }
  });
}

async function initOptionalAnalytics() {
  setAttributionFields();
  initEngagementTracking();
  document.querySelectorAll("form").forEach((form) => form.setAttribute("data-clarity-mask", "true"));

  const privacyButtons = document.querySelectorAll("[data-privacy-choices]");
  let config;
  try {
    const response = await fetch("/api/analytics-config", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Analytics configuration unavailable");
    config = await response.json();
  } catch {
    privacyButtons.forEach((button) => { button.hidden = true; });
    return;
  }

  if (!config.ga4MeasurementId && !config.clarityProjectId) {
    privacyButtons.forEach((button) => { button.hidden = true; });
    return;
  }

  const panel = createAnalyticsConsentPanel();
  const readChoice = () => {
    try { return localStorage.getItem(ANALYTICS_CONSENT_KEY); }
    catch { return null; }
  };
  const saveChoice = (value) => {
    try { localStorage.setItem(ANALYTICS_CONSENT_KEY, value); }
    catch { /* The current-page choice still applies when storage is unavailable. */ }
  };
  const savedChoice = readChoice();

  const choose = (value) => {
    saveChoice(value);
    panel.hidden = true;
    if (value === "granted") {
      activateAnalytics(config);
    } else if (window.integrityAnalyticsActive) {
      window.gtag?.("consent", "update", {
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        analytics_storage: "denied",
      });
      window.clarity?.("consentv2", { ad_Storage: "denied", analytics_Storage: "denied" });
      window.location.reload();
    }
  };

  panel.querySelector("[data-analytics-allow]").addEventListener("click", () => choose("granted"));
  panel.querySelector("[data-analytics-decline]").addEventListener("click", () => choose("denied"));
  privacyButtons.forEach((button) => button.addEventListener("click", () => {
    panel.hidden = false;
    panel.querySelector("[data-analytics-allow]").focus();
  }));

  if (savedChoice === "granted") activateAnalytics(config);
  else if (savedChoice !== "denied") panel.hidden = false;
}


/* =========================================================
  GLOBAL SITE INITIALIZATION
========================================================= */

function initSiteScripts() {
  initSiteNavigation();
  initCurrentYear();
  initActiveNavLink();
  initConversionTracking();
  initOptionalAnalytics();
}


document.addEventListener("DOMContentLoaded", initSiteScripts);


/* =========================================================
  HOMEPAGE MODERN GALLERY
========================================================= */

function initGalleryStage() {
  const gallery = document.querySelector("[data-gallery-stage]");

  if (!gallery) return;

  // Prevent duplicate initialization
  if (gallery.dataset.galleryInitialized === "true") return;

  const slides = Array.from(
    gallery.querySelectorAll("[data-gallery-slide]")
  );

  const prevButton = gallery.querySelector("[data-gallery-prev]");
  const nextButton = gallery.querySelector("[data-gallery-next]");
  const thumbsContainer = gallery.querySelector("[data-gallery-thumbs]");
  const autoplayButton = gallery.querySelector("[data-gallery-autoplay]");

  if (
    slides.length === 0 ||
    !prevButton ||
    !nextButton ||
    !thumbsContainer
  ) {
    return;
  }

  gallery.dataset.galleryInitialized = "true";

  let currentIndex = 0;
  let autoplayTimer = null;
  let autoplayPaused = false;
  let galleryVisible = false;
  let touchStartX = 0;
  let touchEndX = 0;

  const autoplayDelay = 5500;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const prefersReducedData = navigator.connection?.saveData === true;


  /* ---------------------------------------------------------
    CREATE THUMBNAILS
  --------------------------------------------------------- */

  thumbsContainer.innerHTML = "";

  const thumbnails = slides.map((slide, index) => {
    const sourceImage = slide.querySelector("img");

    const thumb = document.createElement("button");

    thumb.type = "button";
    thumb.className = "gallery-thumb";

    thumb.setAttribute(
      "aria-label",
      `Show gallery image ${index + 1}`
    );

    if (sourceImage) {
      const image = document.createElement("img");

      image.src = sourceImage.dataset.thumb || sourceImage.currentSrc || sourceImage.src;
      image.alt = "";
      image.setAttribute("aria-hidden", "true");
      image.loading = "lazy";
      image.decoding = "async";

      thumb.appendChild(image);
    }

    thumb.addEventListener("click", () => {
      showSlide(index);
      restartAutoplay();
    });

    thumbsContainer.appendChild(thumb);

    return thumb;
  });


  /* ---------------------------------------------------------
    SHOW SELECTED SLIDE

    IMPORTANT:
    This function only changes classes and ARIA attributes.
    It does NOT scroll, focus, or reposition the browser.
  --------------------------------------------------------- */

  function showSlide(index) {
    if (index < 0) {
      currentIndex = slides.length - 1;
    } else if (index >= slides.length) {
      currentIndex = 0;
    } else {
      currentIndex = index;
    }

    const currentImage = slides[currentIndex]?.querySelector("img[data-src]");
    if (currentImage) {
      currentImage.src = currentImage.dataset.src;
      currentImage.removeAttribute("data-src");
    }

    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === currentIndex;

      slide.classList.toggle("is-active", isActive);

      slide.setAttribute(
        "aria-hidden",
        isActive ? "false" : "true"
      );
    });

    thumbnails.forEach((thumb, thumbIndex) => {
      const isActive = thumbIndex === currentIndex;

      thumb.classList.toggle("is-active", isActive);

      if (isActive) {
        thumb.setAttribute("aria-current", "true");
      } else {
        thumb.removeAttribute("aria-current");
      }
    });
  }


  /* ---------------------------------------------------------
    NEXT / PREVIOUS
  --------------------------------------------------------- */

  function nextSlide() {
    showSlide(currentIndex + 1);
  }

  function previousSlide() {
    showSlide(currentIndex - 1);
  }


  /* ---------------------------------------------------------
    AUTOPLAY
  --------------------------------------------------------- */

  function stopAutoplay() {
    if (autoplayTimer !== null) {
      window.clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function startAutoplay() {
    if (prefersReducedMotion) return;
    if (prefersReducedData) return;
    if (autoplayPaused) return;
    if (!galleryVisible) return;
    if (slides.length <= 1) return;

    stopAutoplay();

    autoplayTimer = window.setInterval(() => {
      nextSlide();
    }, autoplayDelay);
  }

  function restartAutoplay() {
    stopAutoplay();
    startAutoplay();
  }


  /* ---------------------------------------------------------
    ARROW BUTTONS
  --------------------------------------------------------- */

  prevButton.addEventListener("click", (event) => {
    event.preventDefault();

    previousSlide();
    restartAutoplay();
  });

  nextButton.addEventListener("click", (event) => {
    event.preventDefault();

    nextSlide();
    restartAutoplay();
  });


  /* ---------------------------------------------------------
    KEYBOARD CONTROLS
  --------------------------------------------------------- */

  gallery.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();

      previousSlide();
      restartAutoplay();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();

      nextSlide();
      restartAutoplay();
    }
  });


  /* ---------------------------------------------------------
    TOUCH / SWIPE SUPPORT
  --------------------------------------------------------- */

  gallery.addEventListener(
    "touchstart",
    (event) => {
      touchStartX = event.changedTouches[0].clientX;

      stopAutoplay();
    },
    { passive: true }
  );

  gallery.addEventListener(
    "touchend",
    (event) => {
      touchEndX = event.changedTouches[0].clientX;

      const swipeDistance =
        touchEndX - touchStartX;

      const minimumSwipeDistance = 50;

      if (swipeDistance > minimumSwipeDistance) {
        previousSlide();
      } else if (
        swipeDistance < -minimumSwipeDistance
      ) {
        nextSlide();
      }

      restartAutoplay();
    },
    { passive: true }
  );


  /* ---------------------------------------------------------
    PAUSE ON MOUSE HOVER

    This only stops/starts the timer.
    It does not change page position.
  --------------------------------------------------------- */

  gallery.addEventListener("mouseenter", () => {
    stopAutoplay();
  });

  gallery.addEventListener("mouseleave", () => {
    startAutoplay();
  });

  gallery.addEventListener("focusin", stopAutoplay);
  gallery.addEventListener("focusout", (event) => {
    if (!gallery.contains(event.relatedTarget)) startAutoplay();
  });

  autoplayButton?.addEventListener("click", () => {
    autoplayPaused = !autoplayPaused;
    autoplayButton.setAttribute("aria-pressed", String(autoplayPaused));
    autoplayButton.textContent = autoplayPaused ? "Play Gallery" : "Pause Gallery";
    if (autoplayPaused) stopAutoplay();
    else startAutoplay();
  });


  /* ---------------------------------------------------------
    TAB VISIBILITY

    Prevent the timer from running unnecessarily while
    the browser tab is hidden.
  --------------------------------------------------------- */

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
  });


  /* ---------------------------------------------------------
    INITIAL STATE
  --------------------------------------------------------- */

  showSlide(0);
  const observer = new IntersectionObserver((entries) => {
    galleryVisible = entries.some((entry) => entry.isIntersecting);
    if (galleryVisible) startAutoplay();
    else stopAutoplay();
  }, { rootMargin: "200px 0px" });
  observer.observe(gallery);
}


/* =========================================================
  INITIALIZE GALLERY
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  initGalleryStage
);
