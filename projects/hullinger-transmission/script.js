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


/* =========================================================
  HOMEPAGE GALLERY CAROUSEL
========================================================= */

function initGalleryCarousel() {
  const carousel = document.querySelector("[data-gallery-carousel]");

  if (!carousel) return;
  if (carousel.dataset.carouselInitialized === "true") return;

  carousel.dataset.carouselInitialized = "true";

  const track = carousel.querySelector("[data-gallery-track]");
  const slides = Array.from(carousel.querySelectorAll("[data-gallery-slide]"));
  const prevButton = carousel.querySelector("[data-gallery-prev]");
  const nextButton = carousel.querySelector("[data-gallery-next]");
  const dotsContainer = carousel.querySelector("[data-gallery-dots]");

  if (!track || !slides.length || !prevButton || !nextButton || !dotsContainer) {
    return;
  }

  let currentIndex = 0;
  let touchStartX = 0;
  let touchEndX = 0;

  const dots = slides.map((_, index) => {
    const dot = document.createElement("button");

    dot.className = "gallery-carousel__dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `Show gallery photo ${index + 1}`);

    dot.addEventListener("click", () => {
      goToSlide(index);
    });

    dotsContainer.appendChild(dot);

    return dot;
  });

  function updateCarousel() {
    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    slides.forEach((slide, index) => {
      const isActive = index === currentIndex;

      slide.classList.toggle("gallery-card--active", isActive);
      slide.setAttribute("aria-hidden", isActive ? "false" : "true");
    });

    dots.forEach((dot, index) => {
      const isActive = index === currentIndex;

      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-current", isActive ? "true" : "false");
    });
  }

  function goToSlide(index) {
    if (index < 0) {
      currentIndex = slides.length - 1;
    } else if (index >= slides.length) {
      currentIndex = 0;
    } else {
      currentIndex = index;
    }

    updateCarousel();
  }

  prevButton.addEventListener("click", () => {
    goToSlide(currentIndex - 1);
  });

  nextButton.addEventListener("click", () => {
    goToSlide(currentIndex + 1);
  });

  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      goToSlide(currentIndex - 1);
    }

    if (event.key === "ArrowRight") {
      goToSlide(currentIndex + 1);
    }
  });

  carousel.addEventListener(
    "touchstart",
    (event) => {
      touchStartX = event.changedTouches[0].screenX;
    },
    { passive: true }
  );

  carousel.addEventListener(
    "touchend",
    (event) => {
      touchEndX = event.changedTouches[0].screenX;

      const swipeDistance = touchEndX - touchStartX;
      const minimumSwipeDistance = 50;

      if (swipeDistance > minimumSwipeDistance) {
        goToSlide(currentIndex - 1);
      }

      if (swipeDistance < -minimumSwipeDistance) {
        goToSlide(currentIndex + 1);
      }
    },
    { passive: true }
  );

  updateCarousel();
}

/*
  Run carousel after partials and normal site scripts.
*/
document.addEventListener("partialsLoaded", initGalleryCarousel);

document.addEventListener("DOMContentLoaded", () => {
  initGalleryCarousel();
});
