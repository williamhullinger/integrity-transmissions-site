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
  } else if (currentPath.startsWith("/reman-transmissions/")) {
    currentPage = "reman-transmissions";
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
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...details,
  });
}

function initConversionTracking() {
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

  document.querySelectorAll("form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      queueMicrotask(() => {
        if (event.defaultPrevented) return;

        pushConversionEvent("quote_form_submit", {
          page_path: window.location.pathname,
          form_name: form.getAttribute("name") || form.id || "unknown",
        });
      });
    });
  });
}


/* =========================================================
  GLOBAL SITE INITIALIZATION
========================================================= */

function initSiteScripts() {
  initSiteNavigation();
  initCurrentYear();
  initActiveNavLink();
  initConversionTracking();
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
