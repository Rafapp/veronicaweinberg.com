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
