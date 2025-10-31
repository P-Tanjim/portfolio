(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    // 1. Element Selection
    const navWrapper = document.querySelector("nav");
    const pages = document.getElementById("pages");
    const underline = pages ? pages.querySelector(".nav-underline") : null;

    if (!navWrapper || !pages || !underline) {
      console.warn("Navigation: required DOM elements not found.");
      return;
    }

    const desktopLinks = Array.from(pages.querySelectorAll(".nav-link"));
    const navMenu = document.getElementById("navPages");
    const mobileLinks = navMenu ? Array.from(navMenu.querySelectorAll(".nav-link")) : [];
    const burger = document.getElementById("burger");
    const closeBtn = navMenu ? navMenu.querySelector(".menu-close-btn") : null;

    let NAV_OFFSET = Math.max(0, Math.round(navWrapper.offsetHeight || 80));

    underline.style.willChange = "transform, width";
    underline.style.transformOrigin = "left center";

    // Helper to find desktop link by href
    const findDesktopLinkByHref = (hrefRaw) => {
      if (!hrefRaw) return null;
      let href = String(hrefRaw).trim();
      if (!href.startsWith("#")) href = `#${href}`;
      
      return desktopLinks.find((a) => a.getAttribute("href") === href) || null;
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
      
      // Match active state on mobile menu
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

      const left = targetRect.left - containerRect.left + (pages.scrollLeft || 0);
      const width = Math.max(0, targetRect.width);

      if (instant) {
        underline.style.transition = "none";
      } else {
        underline.style.transition = "transform 0.28s cubic-bezier(.2,.8,.2,1), width 0.28s cubic-bezier(.2,.8,.2,1)";
      }

      underline.style.width = `${width}px`;
      underline.style.transform = `translateX(${left}px)`;

      if (instant) {
        requestAnimationFrame(() => {
          underline.style.transition = "transform 0.28s cubic-bezier(.2,.8,.2,1), width 0.28s cubic-bezier(.2,.8,.2,1)";
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

    // --- FIXED: Navigation and URL Update ---
    function handleNavLinkClick(ev, linkEl) {
      const href = linkEl.getAttribute("href") || "";
      const desktopLink = findDesktopLinkByHref(href) || linkEl;
      
      // For anchor links (starting with #)
      if (href.startsWith("#") && href.length > 1) { 
        ev.preventDefault(); // Always prevent default for anchor links
        
        const id = href.slice(1);
        smoothScrollToId(id);

        // Update URL hash properly
        if (window.history.pushState) {
          window.history.pushState(null, null, href);
        } else {
          window.location.hash = href;
        }

        setActiveLink(desktopLink, false);
      }
      // For external links, allow default behavior (no preventDefault)

      // Close mobile menu if open
      if (navMenu && navMenu.classList.contains("open")) {
        closeMobileMenu();
      }
    }

    // Event listeners for desktop links
    desktopLinks.forEach((link) => {
      link.addEventListener("mouseenter", () => positionUnderline(link));
      link.addEventListener("focus", () => positionUnderline(link));
      link.addEventListener("click", (e) => handleNavLinkClick(e, link));
    });

    // Event listeners for mobile links
    mobileLinks.forEach((mLink) => {
      mLink.addEventListener("click", (e) => handleNavLinkClick(e, mLink));
    });

    pages.addEventListener("mouseleave", () => {
      const active = pages.querySelector(".nav-link.is-active") || desktopLinks[0];
      if (active) positionUnderline(active);
    });

    // Handle resize
    let resizeRaf = null;
    window.addEventListener("resize", () => {
      NAV_OFFSET = Math.max(0, Math.round(navWrapper.offsetHeight || 80));
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        const active = pages.querySelector(".nav-link.is-active") || desktopLinks[0];
        if (active) positionUnderline(active, true);
        
        if (window.innerWidth > 768 && navMenu && navMenu.classList.contains("open")) {
          closeMobileMenu();
        }
      });
    });

    // Check for URL hash on load and scroll to section
    function checkHashAndScroll() {
      if (window.location.hash) {
        const id = window.location.hash.slice(1);
        const link = findDesktopLinkByHref(window.location.hash);
        if (link && document.getElementById(id)) {
          setTimeout(() => {
            smoothScrollToId(id);
            setActiveLink(link, true);
          }, 100);
        }
      }
    }

    // Initialize underline and check hash
    (function initNavigation() {
      const initial = pages.querySelector(".nav-link.is-active") || desktopLinks[0];
      if (initial) {
        setActiveLink(initial, true);
      } else {
        underline.classList.add("hidden");
      }
      
      checkHashAndScroll();
    })();

    // --- IMPROVED: Intersection Observer for scroll-spy ---
    const sections = Array.from(document.querySelectorAll("section[id]"));

    if (sections.length) {
      const ioOptions = {
        root: null,
        rootMargin: `-${NAV_OFFSET}px 0px -65% 0px`, // Better detection range
        threshold: [0, 0.1, 0.5, 0.9] // Multiple thresholds for better accuracy
      };

      let lastActiveId = null;

      const observer = new IntersectionObserver((entries) => {
        let mostVisibleSection = null;
        let highestRatio = 0;

        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio > highestRatio) {
            highestRatio = entry.intersectionRatio;
            mostVisibleSection = entry.target;
          }
        });

        if (mostVisibleSection) {
          const activeId = mostVisibleSection.getAttribute("id");
          
          // Only update if the active section changed
          if (activeId !== lastActiveId) {
            lastActiveId = activeId;
            const link = pages.querySelector(`.nav-link[href="#${activeId}"]`);
            if (link) {
              setActiveLink(link, false);
            }
          }
        }
        
        // Handle case when at top of page
        if (window.scrollY < 100 && !mostVisibleSection) {
          const firstLink = desktopLinks[0];
          if (firstLink && !firstLink.classList.contains('is-active')) {
            setActiveLink(firstLink, false);
          }
        }
      }, ioOptions);

      sections.forEach((s) => observer.observe(s));
    }

    // --- MOBILE MENU LOGIC ---
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
  });
})();