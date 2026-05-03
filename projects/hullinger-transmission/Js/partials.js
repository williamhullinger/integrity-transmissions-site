document.addEventListener("DOMContentLoaded", async () => {
  const includeElements = document.querySelectorAll("[data-include]");

  if (!includeElements.length) return;

  const loadPartial = async (element) => {
    const file = element.getAttribute("data-include");

    if (!file) return;

    try {
      const response = await fetch(file);

      if (!response.ok) {
        throw new Error(`Could not load ${file}`);
      }

      const html = await response.text();
      element.innerHTML = html;
    } catch (error) {
      console.error("Partial load error:", error);
      element.innerHTML = `
        <div style="padding: 1rem; background: #2a0f0f; color: white;">
          Could not load ${file}
        </div>
      `;
    }
  };

  await Promise.all([...includeElements].map(loadPartial));

  document.dispatchEvent(new CustomEvent("partialsLoaded"));
});