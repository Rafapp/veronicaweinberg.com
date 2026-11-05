// Keep the footer year current even if the site hasn't been rebuilt this year.
document.querySelectorAll("[data-current-year]").forEach(function (el) {
  el.textContent = new Date().getFullYear();
});

// Hand-drawn logo frames: flip through them at the fps set in _data/logo.yml.
(function () {
  var logo = document.querySelector(".logo--frames");
  if (!logo || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var frames = logo.querySelectorAll(".logo-frame");
  if (frames.length < 2) return;
  var i = 0;
  setInterval(function () {
    frames[i].classList.remove("is-on");
    i = (i + 1) % frames.length;
    frames[i].classList.add("is-on");
  }, 1000 / (parseFloat(logo.dataset.fps) || 8));
})();

// Touch screens have no hover: first tap on a dropdown opens it, second tap follows the link.
document.querySelectorAll(".has-children > a").forEach(function (link) {
  link.addEventListener("click", function (e) {
    if (window.matchMedia("(hover: hover)").matches) return;
    var item = link.parentElement;
    if (!item.classList.contains("is-open")) {
      e.preventDefault();
      item.classList.add("is-open");
    }
  });
});
document.addEventListener("click", function (e) {
  document.querySelectorAll(".has-children.is-open").forEach(function (item) {
    if (!item.contains(e.target)) item.classList.remove("is-open");
  });
});

// Slideshows: arrows and thumbnails scroll the strip; the current thumbnail is highlighted.
document.querySelectorAll("[data-slideshow]").forEach(function (show) {
  var strip = show.querySelector("[data-slides]");
  var thumbs = show.querySelectorAll("[data-thumb]");
  var count = strip.children.length;
  function current() { return Math.round(strip.scrollLeft / strip.clientWidth); }
  function go(i) { strip.scrollTo({ left: ((i + count) % count) * strip.clientWidth }); }
  function mark() {
    var c = current();
    thumbs.forEach(function (t, i) { t.classList.toggle("is-current", i === c); });
  }
  show.querySelector("[data-prev]").addEventListener("click", function () { go(current() - 1); });
  show.querySelector("[data-next]").addEventListener("click", function () { go(current() + 1); });
  thumbs.forEach(function (t, i) { t.addEventListener("click", function () { go(i); }); });
  strip.addEventListener("scroll", function () { window.requestAnimationFrame(mark); }, { passive: true });
  mark();
});

// Lightbox: click an artwork image to see it large over a gray backdrop.
// Arrows (and the keyboard) step through the other images of the same section; X, Esc or a click outside closes it.
(function () {
  var selector = ".cell img, .slide img";
  if (!document.querySelector(selector) || !window.HTMLDialogElement) return;

  var box = document.createElement("dialog");
  box.className = "lightbox";
  box.setAttribute("aria-label", "Enlarged image");
  box.innerHTML =
    '<img class="lightbox-img" alt="">' +
    '<button class="lightbox-btn lightbox-close" aria-label="Close">&times;</button>' +
    '<button class="lightbox-btn lightbox-prev" aria-label="Previous image">&#8249;</button>' +
    '<button class="lightbox-btn lightbox-next" aria-label="Next image">&#8250;</button>';
  document.body.appendChild(box);
  var big = box.querySelector(".lightbox-img");
  var group = [], index = 0;

  function show(i) {
    index = (i + group.length) % group.length;
    var img = group[index];
    big.removeAttribute("srcset");
    big.src = img.currentSrc || img.src;          // already loaded, so it appears instantly
    if (img.srcset) { big.sizes = "100vw"; big.srcset = img.srcset; } // then swaps to the sharpest size
    big.alt = img.alt;
    box.classList.toggle("is-single", group.length < 2);
  }
  function open(img) {
    var section = img.closest(".work") || document;
    group = Array.prototype.slice.call(section.querySelectorAll(selector));
    show(group.indexOf(img));
    document.documentElement.classList.add("has-lightbox");
    box.showModal();
  }
  box.addEventListener("close", function () { document.documentElement.classList.remove("has-lightbox"); });

  box.querySelector(".lightbox-close").addEventListener("click", function () { box.close(); });
  box.querySelector(".lightbox-prev").addEventListener("click", function () { show(index - 1); });
  box.querySelector(".lightbox-next").addEventListener("click", function () { show(index + 1); });
  box.addEventListener("click", function (e) { if (e.target === box) box.close(); }); // the gray area
  box.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") show(index - 1);
    if (e.key === "ArrowRight") show(index + 1);
  });

  // Swipe left/right on phones
  var startX = null;
  box.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
  box.addEventListener("touchend", function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50 && group.length > 1) show(index + (dx < 0 ? 1 : -1));
    startX = null;
  });

  document.querySelectorAll(selector).forEach(function (img) {
    img.classList.add("zoomable");
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    img.addEventListener("click", function () { open(img); });
    img.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(img); }
    });
  });
})();
