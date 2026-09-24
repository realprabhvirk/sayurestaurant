// Sayu Restaurant — site behaviour
(function () {
  "use strict";

  /* ------------------------------------------------------------------
   * Mobile nav toggle
   * ------------------------------------------------------------------ */
  function initMobileNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".mobile-nav");
    if (!toggle || !nav) return;

    var closeBtn = nav.querySelector(".mobile-nav-close");
    var focusableSelector = "a[href], button:not([disabled])";

    function openNav() {
      nav.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      document.body.classList.add("nav-open");
      var first = nav.querySelector(focusableSelector);
      if (first) first.focus();
      document.addEventListener("keydown", onKeydown);
      document.addEventListener("click", onOutsideClick, true);
    }

    function closeNav() {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-open");
      toggle.focus();
      document.removeEventListener("keydown", onKeydown);
      document.removeEventListener("click", onOutsideClick, true);
    }

    function onKeydown(e) {
      if (e.key === "Escape") {
        closeNav();
        return;
      }
      if (e.key === "Tab") {
        var focusable = Array.prototype.slice.call(nav.querySelectorAll(focusableSelector));
        if (!focusable.length) return;
        var firstEl = focusable[0];
        var lastEl = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }

    function onOutsideClick(e) {
      if (!nav.contains(e.target) && e.target !== toggle) {
        closeNav();
      }
    }

    toggle.addEventListener("click", function () {
      var isOpen = toggle.getAttribute("aria-expanded") === "true";
      if (isOpen) closeNav();
      else openNav();
    });

    if (closeBtn) closeBtn.addEventListener("click", closeNav);

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeNav);
    });
  }

  /* ------------------------------------------------------------------
   * Smooth scroll for on-page anchors
   * ------------------------------------------------------------------ */
  function initSmoothScroll() {
    document.querySelectorAll('a[href*="#"]').forEach(function (link) {
      var url;
      try {
        url = new URL(link.href, window.location.href);
      } catch (err) {
        return;
      }
      if (url.pathname !== window.location.pathname || !url.hash) return;

      link.addEventListener("click", function (e) {
        var target = document.querySelector(url.hash);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
          block: "start",
        });
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
        history.pushState(null, "", url.hash);
      });
    });
  }

  /* ------------------------------------------------------------------
   * Live open/closed status widget — Sydney time, viewer-location-proof
   * ------------------------------------------------------------------ */
  // day index: 0 = Sunday ... 6 = Saturday, matching Date#getDay() on the
  // Sydney-local date we derive below. Each entry is a list of [open, close]
  // pairs in 24h minutes-since-midnight form.
  var HOURS = {
    0: [], // Sunday — closed
    1: [], // Monday — closed
    2: [[17 * 60, 22 * 60]], // Tuesday 5pm-10pm
    3: [[17 * 60, 22 * 60]], // Wednesday 5pm-10pm
    4: [[11 * 60 + 30, 14 * 60], [17 * 60, 22 * 60]], // Thursday
    5: [[11 * 60 + 30, 14 * 60], [17 * 60, 22 * 60]], // Friday
    6: [[11 * 60 + 30, 14 * 60], [17 * 60, 22 * 60]], // Saturday
  };
  var DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function formatClock(minutes) {
    var h24 = Math.floor(minutes / 60) % 24;
    var m = minutes % 60;
    var period = h24 >= 12 ? "PM" : "AM";
    var h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    var mStr = m === 0 ? "00" : String(m).padStart(2, "0");
    return h12 + ":" + mStr + " " + period;
  }

  function getSydneyParts() {
    var formatter = new Intl.DateTimeFormat("en-AU", {
      timeZone: "Australia/Sydney",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    var parts = formatter.formatToParts(new Date());
    var map = {};
    parts.forEach(function (p) { map[p.type] = p.value; });

    var weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    var dayIndex = weekdayMap[map.weekday];
    var hour = parseInt(map.hour, 10);
    if (hour === 24) hour = 0;
    var minute = parseInt(map.minute, 10);
    return { dayIndex: dayIndex, minutes: hour * 60 + minute };
  }

  function nextOpeningFrom(dayIndex) {
    // Search forward up to 7 days for the next day with hours, starting
    // the day AFTER dayIndex.
    for (var i = 1; i <= 7; i++) {
      var d = (dayIndex + i) % 7;
      var ranges = HOURS[d];
      if (ranges && ranges.length) {
        var label = i === 1 ? "tomorrow" : DAY_NAMES[d];
        return { label: label, day: d, open: ranges[0][0] };
      }
    }
    return null;
  }

  function computeStatus() {
    var now = getSydneyParts();
    var todays = HOURS[now.dayIndex] || [];

    for (var i = 0; i < todays.length; i++) {
      var range = todays[i];
      if (now.minutes >= range[0] && now.minutes < range[1]) {
        return {
          state: "open",
          text: "Open now",
          note: "Closes at " + formatClock(range[1]),
        };
      }
    }

    // Not currently open — find the next opening today (a later range,
    // e.g. the gap between lunch and dinner) or roll to the next open day.
    for (var j = 0; j < todays.length; j++) {
      if (now.minutes < todays[j][0]) {
        return {
          state: "closed",
          text: "Closed now",
          note: "Opens today at " + formatClock(todays[j][0]),
        };
      }
    }

    var next = nextOpeningFrom(now.dayIndex);
    if (!next) {
      return { state: "closed", text: "Closed", note: "Hours unavailable" };
    }
    if (next.label === "tomorrow") {
      return {
        state: "closed",
        text: "Closed",
        note: "Opens tomorrow at " + formatClock(next.open),
      };
    }
    return {
      state: "closed",
      text: "Closed",
      note: "Opens " + next.label + " at " + formatClock(next.open),
    };
  }

  function initStatusWidget() {
    var widgets = document.querySelectorAll("[data-status-widget]");
    if (!widgets.length) return;

    function render() {
      var status = computeStatus();
      widgets.forEach(function (widget) {
        widget.setAttribute("data-state", status.state);
        var textEl = widget.querySelector(".status-text");
        var noteEl = widget.querySelector(".status-note");
        if (textEl) textEl.textContent = status.text;
        if (noteEl) noteEl.textContent = status.note;
      });
    }

    render();
    setInterval(render, 60 * 1000);
  }

  /* ------------------------------------------------------------------
   * Scroll-triggered reveal
   * ------------------------------------------------------------------ */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ------------------------------------------------------------------
   * Gallery lightbox — keyboard accessible, focus-trapped
   * ------------------------------------------------------------------ */
  function initLightbox() {
    var lightbox = document.querySelector("[data-lightbox]");
    var triggers = Array.prototype.slice.call(document.querySelectorAll("[data-lightbox-trigger]"));
    if (!lightbox || !triggers.length) return;

    var imgEl = lightbox.querySelector("[data-lightbox-image]");
    var captionEl = lightbox.querySelector("[data-lightbox-caption]");
    var closeBtn = lightbox.querySelector(".lightbox-close");
    var prevBtn = lightbox.querySelector(".lightbox-prev");
    var nextBtn = lightbox.querySelector(".lightbox-next");

    var currentIndex = 0;
    var lastFocused = null;

    function show(index) {
      currentIndex = (index + triggers.length) % triggers.length;
      var trigger = triggers[currentIndex];
      var fullSrc = trigger.getAttribute("data-full") || trigger.querySelector("img").src;
      var caption = trigger.getAttribute("data-caption") || "";
      imgEl.src = fullSrc;
      imgEl.alt = trigger.getAttribute("data-alt") || "";
      captionEl.textContent = caption;
    }

    function open(index) {
      lastFocused = document.activeElement;
      show(index);
      lightbox.classList.add("is-open");
      document.body.classList.add("nav-open");
      closeBtn.focus();
      document.addEventListener("keydown", onKeydown);
    }

    function close() {
      lightbox.classList.remove("is-open");
      document.body.classList.remove("nav-open");
      document.removeEventListener("keydown", onKeydown);
      if (lastFocused) lastFocused.focus();
    }

    function onKeydown(e) {
      if (e.key === "Escape") {
        close();
      } else if (e.key === "ArrowRight") {
        show(currentIndex + 1);
      } else if (e.key === "ArrowLeft") {
        show(currentIndex - 1);
      } else if (e.key === "Tab") {
        var focusable = [closeBtn, prevBtn, nextBtn].filter(Boolean);
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    triggers.forEach(function (trigger, i) {
      trigger.addEventListener("click", function () { open(i); });
    });
    closeBtn.addEventListener("click", close);
    prevBtn.addEventListener("click", function () { show(currentIndex - 1); });
    nextBtn.addEventListener("click", function () { show(currentIndex + 1); });
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) close();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMobileNav();
    initSmoothScroll();
    initStatusWidget();
    initReveal();
    initLightbox();
  });
})();
