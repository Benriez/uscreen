// Minimal, dependency-free behaviour. The page is fully readable without it.
(() => {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  // <details>-based mobile menu: close it after choosing a destination.
  const menu = document.querySelector(".nav-mobile");
  if (menu) {
    const sheet = document.querySelector(".nav-sheet");
    const close = () => menu.removeAttribute("open");

    if (sheet) sheet.addEventListener("click", (event) => {
      if (event.target.closest("a")) close();
    });
    document.addEventListener("click", (event) => {
      if (!menu.hasAttribute("open")) return;
      if (menu.contains(event.target) || (sheet && sheet.contains(event.target))) return;
      close();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });
  }
})();
