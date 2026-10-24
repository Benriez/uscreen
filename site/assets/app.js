// Minimal, dependency-free behaviour. The page is fully readable without it.
(() => {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  // <details>-based mobile menu: close it after choosing a destination.
  const menu = document.querySelector(".nav-mobile");
  if (menu) {
    menu.addEventListener("click", (event) => {
      if (event.target.closest("a")) menu.removeAttribute("open");
    });
    document.addEventListener("click", (event) => {
      if (menu.hasAttribute("open") && !menu.contains(event.target)) {
        menu.removeAttribute("open");
      }
    });
  }
})();
