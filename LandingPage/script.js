document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("themeToggle");
  themeToggle?.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    themeToggle.textContent = isDark ? "Desactivar modo oscuro" : "Activar modo oscuro";
  });

  const greetingElement = document.getElementById("dynamicGreeting");
  if (greetingElement) {
    const now = new Date();
    const hour = now.getHours();
    const greetingText =
      hour >= 5 && hour < 12
        ? "Buenos días"
        : hour >= 12 && hour < 19
        ? "Buenas tardes"
        : "Buenas noches";

    greetingElement.textContent = greetingText;
  }

  const productCards = Array.from(document.querySelectorAll(".product-card"));
  const searchInput = document.getElementById("productSearch");
  const filterButtons = document.querySelectorAll(".filter-btn");
  let activeCategory = "all";

  const filterProducts = () => {
    const searchTerm = searchInput?.value.trim().toLowerCase() ?? "";

    productCards.forEach((card) => {
      const title = card.dataset.title?.toLowerCase() ?? "";
      const category = card.dataset.category ?? "all";
      const matchesCategory = activeCategory === "all" || category === activeCategory;
      const matchesSearch = title.includes(searchTerm);
      card.classList.toggle("d-none", !(matchesCategory && matchesSearch));
    });
  };

  searchInput?.addEventListener("input", filterProducts);

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category ?? "all";
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      filterProducts();
    });
  });

  filterProducts();

  const submitOfferButton = document.getElementById("submitOffer");
  const offerForm = document.getElementById("offerForm");
  const offerFeedback = document.getElementById("offerFeedback");
  const offerModalElement = document.getElementById("offerModal");

  submitOfferButton?.addEventListener("click", () => {
    offerFeedback?.classList.remove("d-none");
    offerForm?.reset();
  });

  offerModalElement?.addEventListener("hidden.bs.modal", () => {
    offerFeedback?.classList.add("d-none");
  });
});
