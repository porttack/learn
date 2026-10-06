// Pico landing page only: smooth-scrolls the "Go to Projects" button (see
// .projects-cta in assets/main.scss) to the Projects section instead of a
// hard jump, then briefly highlights it so it's obvious you've arrived --
// the button itself is back up by the banner, out of view by then.
// ?projects in the URL (e.g. /pico/?projects) does the same jump on load,
// for a link that drops someone straight at the Projects section.
(function () {
  var target = document.getElementById("projects");
  if (!target) return;

  function jumpToProjects() {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    target.classList.remove("projects-highlight");
    void target.offsetWidth; // restart the animation on repeat clicks
    target.classList.add("projects-highlight");
  }

  var cta = document.querySelector(".projects-cta");
  if (cta) {
    cta.addEventListener("click", function (evt) {
      evt.preventDefault();
      jumpToProjects();
    });
  }

  if (new URLSearchParams(location.search).has("projects")) jumpToProjects();
})();
