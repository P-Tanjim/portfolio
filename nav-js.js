(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const navWrapper = document.querySelector("nav");
    const pages = document.getElementById("pages");
    const underline = pages ? pages.querySelector(".nav-underline") : null;

    if (!navWrapper || !pages || !underline) {
      console.warn(
        "Navigation: required DOM elements not found (nav/pages/nav-underline)."
      );
      return;
    }

    const desktopLinks = Array.from(pages.querySelectorAll(".nav-link"));
    const navMenu = document.getElementById("navPages");
    const mobileLinks = navMenu
      ? Array.from(navMenu.querySelectorAll(".nav-link"))
      : [];
    const burger = document.getElementById("burger");
    const closeBtn = navMenu ? navMenu.querySelector(".menu-close-btn") : null;

    let NAV_OFFSET = Math.max(0, Math.round(navWrapper.offsetHeight || 80));

    underline.style.willChange = "transform, width";
    underline.style.transformOrigin = "left center";

    const findDesktopLinkByHref = (hrefRaw) => {
      if (!hrefRaw) return null;
      let href = String(hrefRaw);
      if (!href.startsWith("#"))
        href = href.startsWith("/") ? href : `#${href}`;
      let el = pages.querySelector(`.nav-link[href="${href}"]`);
      if (el) return el;
      const hrefLower = href.toLowerCase();
      return (
        Array.from(pages.querySelectorAll(".nav-link")).find(
          (a) => (a.getAttribute("href") || "").toLowerCase() === hrefLower
        ) || null
      );
    };

    function clearActive() {
      desktopLinks.forEach((l) => l.classList.remove("is-active"));
      mobileLinks.forEach((l) => l.classList.remove("is-active"));
    }

    function setActiveLink(desktopLink, instant = false) {
      if (!desktopLink) {
        underline.classList.add("hidden");
        clearActive();
        return;
      }

      const href = desktopLink.getAttribute("href");

      clearActive();
      desktopLink.classList.add("is-active");
      mobileLinks.forEach((ml) => {
        if (ml.getAttribute("href") === href) ml.classList.add("is-active");
      });

      positionUnderline(desktopLink, instant);
    }

    function positionUnderline(targetEl, instant = false) {
      if (!targetEl) {
        underline.classList.add("hidden");
        return;
      }
      underline.classList.remove("hidden");

      const targetRect = targetEl.getBoundingClientRect();
      const containerRect = pages.getBoundingClientRect();

      const left =
        targetRect.left - containerRect.left + (pages.scrollLeft || 0);
      const width = Math.max(0, targetRect.width);

      if (instant) {
        underline.style.transition = "none";
      } else {
        underline.style.transition =
          "transform 0.28s cubic-bezier(.2,.8,.2,1), width 0.28s cubic-bezier(.2,.8,.2,1)";
      }

      underline.style.width = `${width}px`;
      underline.style.transform = `translateX(${left}px)`;

      if (instant) {
        requestAnimationFrame(() => {
          underline.style.transition =
            "transform 0.28s cubic-bezier(.2,.8,.2,1), width 0.28s cubic-bezier(.2,.8,.2,1)";
        });
      }
    }

    function smoothScrollToId(id) {
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;

      const rect = target.getBoundingClientRect();
      const absoluteTop = window.scrollY + rect.top;
      const scrollTop = Math.max(0, absoluteTop - NAV_OFFSET);

      window.scrollTo({ top: scrollTop, behavior: "smooth" });
    }

    function handleNavLinkClick(ev, linkEl) {
      const href = linkEl.getAttribute("href") || "";
      const desktopLink = findDesktopLinkByHref(href) || linkEl;
      setActiveLink(desktopLink, true);

      if (href.startsWith("#")) {
        ev && ev.preventDefault();
        const id = href.slice(1);
        smoothScrollToId(id);

        setTimeout(() => {
          setActiveLink(desktopLink, false);
        }, 240);
      }

      if (navMenu && navMenu.classList.contains("open")) {
        closeMobileMenu();
      }
    }

    desktopLinks.forEach((link) => {
      link.addEventListener("mouseenter", () => positionUnderline(link));
      link.addEventListener("focus", () => positionUnderline(link));
      link.addEventListener("click", (e) => handleNavLinkClick(e, link));
    });

    mobileLinks.forEach((mLink) => {
      mLink.addEventListener("click", (e) => {
        handleNavLinkClick(e, mLink);
      });
      mLink.addEventListener("mouseenter", () => {
        const desktopLink = findDesktopLinkByHref(mLink.getAttribute("href"));
        if (desktopLink) positionUnderline(desktopLink);
      });
    });

    pages.addEventListener("mouseleave", () => {
      const active =
        pages.querySelector(".nav-link.is-active") || desktopLinks[0];
      if (active) positionUnderline(active);
    });

    let resizeRaf = null;
    window.addEventListener("resize", () => {
      NAV_OFFSET = Math.max(0, Math.round(navWrapper.offsetHeight || 80));
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        const active =
          pages.querySelector(".nav-link.is-active") || desktopLinks[0];
        if (active) positionUnderline(active, true);

        if (
          navMenu &&
          window.innerWidth > 768 &&
          navMenu.classList.contains("open")
        ) {
          document.body.style.overflow = "";
        }
      });
    });

    (function initUnderline() {
      const initial =
        pages.querySelector(".nav-link.is-active") || desktopLinks[0];
      if (initial) {
        setActiveLink(initial, true);
      } else {
        underline.classList.add("hidden");
      }
    })();

    const sections = Array.from(document.querySelectorAll("section[id]"));

    if (sections.length) {
      const ioOptions = {
        root: null,
        rootMargin: `-${NAV_OFFSET}px 0px -55% 0px`,
        threshold: [0, 0.15, 0.35, 0.5, 0.75, 1],
      };

      let lastObservedId = null;

      const observer = new IntersectionObserver((entries) => {
        let best = null;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (!best || entry.intersectionRatio > best.intersectionRatio) {
            best = entry;
          }
        }

        if (!best) return;

        const id = best.target.getAttribute("id");
        if (id && id !== lastObservedId) {
          lastObservedId = id;
          const link = pages.querySelector(`.nav-link[href="#${id}"]`);
          if (link) {
            setActiveLink(link, false);
          }
        } else {
          if (window.scrollY === 0) {
            const firstLink = desktopLinks[0];
            if (firstLink) setActiveLink(firstLink, false);
          }
        }
      }, ioOptions);

      sections.forEach((s) => observer.observe(s));

      window.addEventListener("pagehide", () => observer.disconnect());
    } else {
      let ticking = false;
      function fallbackOnScroll() {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(() => {
            const scrollY = window.scrollY;
            let found = null;
            for (let i = sections.length - 1; i >= 0; i--) {
              const sec = sections[i];
              const top = sec.offsetTop - NAV_OFFSET - 6;
              if (scrollY >= top) {
                found = sec;
                break;
              }
            }
            if (found) {
              const link = pages.querySelector(
                `.nav-link[href="#${found.id}"]`
              );
              if (link) setActiveLink(link, false);
            }
            ticking = false;
          });
        }
      }
      window.addEventListener("scroll", fallbackOnScroll, { passive: true });
      fallbackOnScroll();
    }

    function openMobileMenu() {
      if (!navMenu) return;
      navMenu.classList.add("open");
      burger.classList.add("toggle");
      burger.setAttribute("aria-expanded", "true");
      navMenu.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      if (closeBtn) closeBtn.focus();
    }

    function closeMobileMenu() {
      if (!navMenu) return;
      navMenu.classList.remove("open");
      burger.classList.remove("toggle");
      burger.setAttribute("aria-expanded", "false");
      navMenu.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (burger) burger.focus();
    }

    if (burger && navMenu) {
      burger.addEventListener("click", () => {
        if (navMenu.classList.contains("open")) {
          closeMobileMenu();
        } else {
          openMobileMenu();
        }
      });

      if (closeBtn) {
        closeBtn.addEventListener("click", closeMobileMenu);
      }

      navMenu.addEventListener("click", (ev) => {
        if (ev.target === navMenu) closeMobileMenu();
      });

      window.addEventListener("keydown", (ev) => {
        if (ev.key === "Escape" && navMenu.classList.contains("open")) {
          closeMobileMenu();
        }
      });
    }

    window.addEventListener("resize", () => {
      if (
        window.innerWidth > 768 &&
        navMenu &&
        navMenu.classList.contains("open")
      ) {
        document.body.style.overflow = "";
      }
    });

    window.addEventListener("pagehide", () => {
    });
  });
})();