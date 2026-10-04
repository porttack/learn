// Pico landing page only: smooth-scrolls the "Go to Projects" button (see
// .projects-cta in assets/main.scss) to the Projects section instead of a
// hard jump, then briefly highlights it so it's obvious you've arrived --
// the button itself is back up by the banner, out of view by then.
(function () {
  var cta = document.querySelector(".projects-cta");
  var target = document.getElementById("projects");
  if (!cta || !target) return;

  cta.addEventListener("click", function (evt) {
    evt.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    target.classList.remove("projects-highlight");
    void target.offsetWidth; // restart the animation on repeat clicks
    target.classList.add("projects-highlight");
  });
})();
