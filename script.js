(() => {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  document.documentElement.classList.add("js");

  const header = document.querySelector("[data-header]");
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");

  const setNavOpen = (open) => {
    if (!toggle || !header) return;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    header.classList.toggle("is-nav-open", open);
    document.body.classList.toggle("nav-lock", open);
  };

  if (toggle && nav && header) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      setNavOpen(open);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setNavOpen(false);
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 1200) setNavOpen(false);
    });
  }

  if (header && header.classList.contains("site-header-home")) {
    const onScroll = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 40);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  const reveals = document.querySelectorAll("[data-reveal]");
  const titles = document.querySelectorAll("[data-title]");

  const markVisible = (el) => el.classList.add("is-visible");
  const markDrawn = (el) => el.classList.add("is-drawn");

  const alreadyInView = (el, ratio = 0.92) => {
    const rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight * ratio && rect.bottom > 0;
  };

  if (!reduceMotion && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          markVisible(entry.target);
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -4% 0px" }
    );

    reveals.forEach((el) => {
      if (alreadyInView(el)) markVisible(el);
      else revealObserver.observe(el);
    });

    const titleObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          markDrawn(entry.target);
          titleObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.35 }
    );

    titles.forEach((el) => {
      if (alreadyInView(el, 0.85)) markDrawn(el);
      else titleObserver.observe(el);
    });

    window.setTimeout(() => {
      reveals.forEach((el) => {
        if (!el.classList.contains("is-visible")) markVisible(el);
      });
      titles.forEach((el) => {
        if (!el.classList.contains("is-drawn")) markDrawn(el);
      });
    }, 2500);
  } else {
    reveals.forEach(markVisible);
    titles.forEach(markDrawn);
  }

  const heroImage = document.querySelector(".hero-image");
  if (!heroImage || reduceMotion) return;

  let ticking = false;

  const updateParallax = () => {
    const y = window.scrollY;
    const offset = Math.min(y * 0.28, 160);
    heroImage.style.transform = `translate3d(0, ${offset}px, 0)`;
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateParallax);
    },
    { passive: true }
  );

  updateParallax();
})();
