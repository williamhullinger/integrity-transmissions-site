// ================================
// MOBILE NAVIGATION
// ================================

function initMobileNavigation() {
  const navToggle = document.querySelector(".nav__toggle");
  const mobileMenu = document.querySelector(".mobile-menu");

  if (!navToggle || !mobileMenu) return;

  navToggle.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (event) => {
    const isClickInsideMenu =
      mobileMenu.contains(event.target) || navToggle.contains(event.target);

    if (!isClickInsideMenu && mobileMenu.classList.contains("is-open")) {
      mobileMenu.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
}

// ================================
// EVENT PAGE POPUPS
// ================================

function initEventModal() {
  const eventModal = document.getElementById("event-modal");
  const eventModalTitle = document.getElementById("event-modal-title");
  const eventModalType = document.getElementById("event-modal-type");
  const eventModalActions = document.getElementById("event-modal-actions");

  if (!eventModal || !eventModalTitle || !eventModalType || !eventModalActions) {
    return;
  }

  const closeEventModal = () => {
    eventModal.hidden = true;
    eventModalActions.innerHTML = "";
  };

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-modal]");

    if (trigger) {
      const modalType = trigger.dataset.modal;
      const title = trigger.dataset.title || "Choose an Option";

      eventModalTitle.textContent = title;
      eventModalActions.innerHTML = "";

      if (modalType === "directions") {
        eventModalType.textContent = "Directions";

        const appleLink = document.createElement("a");
        appleLink.className = "event-modal__link";
        appleLink.href = trigger.dataset.apple || "#";
        appleLink.target = "_blank";
        appleLink.rel = "noopener noreferrer";
        appleLink.textContent = "Open in Apple Maps";

        const googleLink = document.createElement("a");
        googleLink.className = "event-modal__link event-modal__link--secondary";
        googleLink.href = trigger.dataset.google || "#";
        googleLink.target = "_blank";
        googleLink.rel = "noopener noreferrer";
        googleLink.textContent = "Open in Google Maps";

        eventModalActions.append(appleLink, googleLink);
      }

      if (modalType === "calendar") {
        eventModalType.textContent = "Add to Calendar";

        const icsLink = document.createElement("a");
        icsLink.className = "event-modal__link";
        icsLink.href = trigger.dataset.ics || "#";
        icsLink.textContent = "Apple Calendar / Outlook (.ics)";

        const googleCalendarLink = document.createElement("a");
        googleCalendarLink.className = "event-modal__link event-modal__link--secondary";
        googleCalendarLink.href = trigger.dataset.googleCalendar || "#";
        googleCalendarLink.target = "_blank";
        googleCalendarLink.rel = "noopener noreferrer";
        googleCalendarLink.textContent = "Google Calendar";

        eventModalActions.append(icsLink, googleCalendarLink);
      }

      eventModal.hidden = false;
      return;
    }

    if (event.target.closest("[data-modal-close]")) {
      closeEventModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !eventModal.hidden) {
      closeEventModal();
    }
  });
}

// ================================
// EVENTS GALLERY CAROUSEL
// ================================

function initCarousel(config) {
  const carousel = document.querySelector(config.carouselSelector);
  if (!carousel) return;

  const viewport = carousel.querySelector(config.viewportSelector);
  const track = carousel.querySelector(config.trackSelector);
  const slides = Array.from(carousel.querySelectorAll(config.slideSelector));
  const dotsContainer = document.querySelector(config.dotsSelector);
  const prevBtn = config.prevSelector ? carousel.querySelector(config.prevSelector) : null;
  const nextBtn = config.nextSelector ? carousel.querySelector(config.nextSelector) : null;

  if (!viewport || !track || !slides.length || !dotsContainer) return;

  let currentIndex = 0;
  let autoplayId = null;
  let startX = 0;
  let endX = 0;

  dotsContainer.innerHTML = "";

  slides.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.className = config.dotClass;
    dot.type = "button";
    dot.setAttribute("aria-label", `Go to slide ${index + 1}`);
    dot.dataset.index = String(index);
    dotsContainer.appendChild(dot);
  });

  const dots = Array.from(dotsContainer.querySelectorAll(`.${config.dotClass}`));

  function updateCarousel() {
    const activeSlide = slides[currentIndex];
    const viewportWidth = viewport.clientWidth;
    const slideWidth = activeSlide.offsetWidth;
    const slideLeft = activeSlide.offsetLeft;
    const offset = slideLeft - (viewportWidth - slideWidth) / 2;

    track.style.transform = `translateX(-${Math.max(offset, 0)}px)`;

    slides.forEach((slide, index) => {
      slide.classList.toggle(config.activeClass, index === currentIndex);
    });

    dots.forEach((dot, index) => {
      dot.classList.toggle(config.activeClass, index === currentIndex);
    });
  }

  function goToSlide(index) {
    currentIndex = (index + slides.length) % slides.length;
    updateCarousel();
  }

  function nextSlide() {
    goToSlide(currentIndex + 1);
  }

  function prevSlide() {
    goToSlide(currentIndex - 1);
  }

  function startAutoplay() {
    if (!config.autoplay) return;
    stopAutoplay();
    autoplayId = window.setInterval(nextSlide, config.interval || 3500);
  }

  function stopAutoplay() {
    if (autoplayId !== null) {
      window.clearInterval(autoplayId);
      autoplayId = null;
    }
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", prevSlide);
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", nextSlide);
  }

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      goToSlide(Number(dot.dataset.index));
    });
  });

  if (config.pauseOnHover) {
    carousel.addEventListener("mouseenter", stopAutoplay);
    carousel.addEventListener("mouseleave", startAutoplay);
  }

  if (config.swipe) {
    viewport.addEventListener(
      "touchstart",
      (event) => {
        stopAutoplay();
        startX = event.changedTouches[0].clientX;
      },
      { passive: true }
    );

    viewport.addEventListener(
      "touchend",
      (event) => {
        endX = event.changedTouches[0].clientX;
        const distance = endX - startX;

        if (distance > 50) {
          prevSlide();
        } else if (distance < -50) {
          nextSlide();
        }

        startAutoplay();
      },
      { passive: true }
    );
  }

  window.addEventListener("resize", updateCarousel);
  window.addEventListener("load", updateCarousel);

  updateCarousel();
  startAutoplay();
}


// menu modal
function initMenuModal() {
  const modal = document.getElementById("menu-modal");
  const image = document.getElementById("menu-modal-image");
  const title = document.getElementById("menu-modal-title");
  const eyebrow = document.getElementById("menu-modal-eyebrow");
  const price = document.getElementById("menu-modal-price");
  const text = document.getElementById("menu-modal-text");
  const actions = document.getElementById("menu-modal-actions");

  if (!modal || !title || !eyebrow || !price || !text || !actions) return;

  function closeMenuModal() {
    modal.hidden = true;
    actions.innerHTML = "";
  }

  function openMenuModal(trigger) {
    if (image) {
      image.src = trigger.dataset.image || "";
      image.alt = trigger.dataset.imageAlt || trigger.dataset.title || "";
    }

    eyebrow.textContent = trigger.dataset.eyebrow || "";
    title.textContent = trigger.dataset.title || "";
    price.textContent = trigger.dataset.price || "";
    text.textContent = trigger.dataset.text || "";

    actions.innerHTML = "";

// ACTION 1
const label1 = trigger.getAttribute("data-action-1-label");
const href1 = trigger.getAttribute("data-action-1-href");
const variant1 = trigger.getAttribute("data-action-1-variant") || "primary";

if (label1 && href1) {
  const link1 = document.createElement("a");
  link1.href = href1;
  link1.textContent = label1;

  if (variant1 === "secondary") {
    link1.className = "menu-btn menu-btn--secondary";
  } else {
    link1.className = "menu-btn menu-btn--primary";
  }

  actions.appendChild(link1);
}

// ACTION 2
const label2 = trigger.getAttribute("data-action-2-label");
const href2 = trigger.getAttribute("data-action-2-href");
const variant2 = trigger.getAttribute("data-action-2-variant") || "primary";

if (label2 && href2) {
  const link2 = document.createElement("a");
  link2.href = href2;
  link2.textContent = label2;

  if (variant2 === "secondary") {
    link2.className = "menu-btn menu-btn--secondary";
  } else {
    link2.className = "menu-btn menu-btn--primary";
  }

  actions.appendChild(link2);
}

    modal.hidden = false;
  }

  document.addEventListener("click", (event) => {
    const closeTrigger = event.target.closest("[data-menu-modal-close]");
    if (closeTrigger) {
      closeMenuModal();
      return;
    }

    const trigger = event.target.closest("[data-menu-modal-trigger]");
    if (!trigger) return;

    event.preventDefault();
    event.stopPropagation();
    openMenuModal(trigger.closest(".menu-card"));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) {
      closeMenuModal();
    }
  });
}

// ================================
// HEADER / FOOTER COMPONENTS
// ================================

function loadHeader() {
  const headerPlaceholder = document.getElementById("header-placeholder");
  if (!headerPlaceholder) return;

  fetch("components/header.html")
    .then((response) => response.text())
    .then((data) => {
      headerPlaceholder.innerHTML = data;
      initMobileNavigation();
    })
    .catch((error) => {
      console.error("Error loading header:", error);
    });
}

function loadFooter() {
  const footerPlaceholder = document.getElementById("footer-placeholder");
  if (!footerPlaceholder) return;

  fetch("components/footer.html")
    .then((response) => response.text())
    .then((data) => {
      footerPlaceholder.innerHTML = data;

      const year = document.getElementById("year");
      if (year) {
        year.textContent = String(new Date().getFullYear());
      }
    })
    .catch((error) => {
      console.error("Error loading footer:", error);
    });
}

// ================================
// INIT
// ================================

loadHeader();
loadFooter();
initEventModal();
initMenuModal();

initCarousel({
  carouselSelector: "[data-carousel]",
  viewportSelector: ".events-carousel__viewport",
  trackSelector: ".events-carousel__track",
  slideSelector: ".events-carousel__slide",
  dotsSelector: "[data-carousel-dots]",
  prevSelector: ".events-carousel__btn--prev",
  nextSelector: ".events-carousel__btn--next",
  dotClass: "events-carousel__dot",
  activeClass: "is-active",
  autoplay: true,
  interval: 3500,
  pauseOnHover: true,
  swipe: true
});

initCarousel({
  carouselSelector: "[data-menu-carousel]",
  viewportSelector: ".menu-carousel__viewport",
  trackSelector: ".menu-carousel__track",
  slideSelector: ".menu-carousel__slide",
  dotsSelector: "[data-menu-carousel-dots]",
  prevSelector: null,
  nextSelector: null,
  dotClass: "menu-carousel__dot",
  activeClass: "is-active",
  autoplay: true,
  interval: 3000,
  pauseOnHover: true,
  swipe: true
});