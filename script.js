(function () {
  const pages = document.getElementById("pages");
  if (!pages) return;

  const links = Array.from(pages.querySelectorAll(".nav-link"));
  const underline = pages.querySelector(".nav-underline");

  // Helper: position underline under element
  function positionUnderline(targetEl, instant = false) {
    if (!targetEl) {
      underline.classList.add("hidden");
      return;
    }
    underline.classList.remove("hidden");

    const targetRect = targetEl.getBoundingClientRect();
    const containerRect = pages.getBoundingClientRect();

    const left = targetRect.left - containerRect.left;
    const width = targetRect.width;

    if (instant) {
      // temporarily disable transition for instant positioning
      underline.style.transition = "none";
      underline.style.width = `${width}px`;
      underline.style.transform = `translateX(${left}px)`;
      // force reflow then restore transition
      requestAnimationFrame(() => {
        // small timeout to ensure styles applied
        underline.style.transition = "";
      });
    } else {
      underline.style.width = `${width}px`;
      underline.style.transform = `translateX(${left}px)`;
    }
  }

  // find active link (aria-current or .is-active)
  function getActive() {
    return (
      pages.querySelector(".nav-link.is-active") ||
      pages.querySelector('.nav-link[aria-current="page"]') ||
      links[0]
    );
  }

  // on mouse enter / focus -> move to hovered link
  links.forEach((link) => {
    link.addEventListener("mouseenter", () => positionUnderline(link));
    link.addEventListener("focus", () => positionUnderline(link));
    // click sets the active link
    link.addEventListener("click", (e) => {
      // update active state (if link is in-page anchor, allow default scroll)
      links.forEach((l) => l.classList.remove("is-active"));
      link.classList.add("is-active");
      positionUnderline(link);
    });
  });

  // when mouse leaves the container, go back to active link
  pages.addEventListener("mouseleave", () => {
    positionUnderline(getActive());
  });

  // on window resize reposition underline (instant to avoid animation jitter)
  let resizeTimeout;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(resizeTimeout);
    resizeTimeout = requestAnimationFrame(() =>
      positionUnderline(getActive(), true)
    );
  });

  // initial position (instant)
  window.addEventListener("load", () => positionUnderline(getActive(), true));
  // also in case script runs after load
  positionUnderline(getActive(), true);

  // Optional: keyboard navigation support - move underline on arrow navigation (if using)
})();
