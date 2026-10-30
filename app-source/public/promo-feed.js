(() => {
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const safeImage = (value) => {
    if (typeof value !== "string" || !value.trim()) return "";
    try { const url = new URL(value, location.origin); return url.protocol === "https:" || url.origin === location.origin ? url.href : ""; }
    catch { return ""; }
  };
  const money = (value) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value) || 0);
  const catalog = document.getElementById("promoCatalog");
  const card = (promo) => {
    const image = safeImage(promo.imageUrl);
    const link = typeof promo.href === "string" && promo.href.startsWith("/") ? promo.href : (promo.destinationSlug ? `/destination/${encodeURIComponent(promo.destinationSlug)}/` : "/explore/");
    const isSignup = promo.type === "merchant-registration";
    const priceRow = isSignup
      ? `<div class="promo-price-row"><div class="promo-price">GRATIS</div><span class="promo-discount">${escapeHtml(promo.offerLabel || "Biaya daftar")}</span></div>`
      : `<div class="promo-price-row"><div>${Number.isFinite(Number(promo.oldPrice)) && Number.isFinite(Number(promo.price)) ? `<div class="promo-old">Mulai ${money(promo.oldPrice)}</div><div class="promo-price">Mulai ${money(promo.price)}</div>` : `<div class="promo-price">${escapeHtml(promo.discountLabel || "Promo aktif")}</div>`}</div><span class="promo-discount">${escapeHtml(promo.discountLabel || "Lihat promo")}</span></div>`;
    return `<article class="promo-tile"><a class="promo-tile-link" href="${escapeHtml(link)}"><div class="promo-tile-image"${image ? ` style="background-image:url('${escapeHtml(image)}')"` : ""}><span class="promo-tile-badge">${escapeHtml(promo.discountLabel || promo.offer || "Promo")}</span></div><div class="promo-tile-body"><div class="promo-location">⌖ ${escapeHtml(promo.city || "Indonesia")} · ${escapeHtml(promo.location || "Destinasi wisata")}</div><h3>${escapeHtml(promo.title)}</h3><p class="promo-description">${escapeHtml(promo.description || promo.category || "Penawaran tiket wisata")}</p>${priceRow}</div></a></article>`;
  };
  function showEmpty(message = "Belum ada promo aktif saat ini. Cek kembali segera atau jelajahi pilihan destinasi kami.") {
    if (!catalog) return;
    catalog.innerHTML = `<article class="promo-empty"><div class="promo-empty-icon">🎟️</div><h3>Promo baru segera hadir</h3><p>${escapeHtml(message)}</p></article>`;
  }
  async function loadPromos() {
    try {
      const response = await fetch("/api/promos", { cache: "no-store" });
      if (!response.ok) throw new Error("Promo tidak dapat dimuat.");
      const data = await response.json();
      const promos = Array.isArray(data.promos) ? data.promos : [];
      if (!catalog) return;
      if (!promos.length) return showEmpty();
      catalog.innerHTML = promos.map(card).join("");
    } catch { showEmpty("Promo belum dapat dimuat. Silakan coba lagi beberapa saat."); }
  }
  async function loadBanner() {
    try {
      const response = await fetch("/api/site-content", { cache: "no-store" });
      if (!response.ok) return;
      const { content = [] } = await response.json();
      const row = content.find((item) => item.key === "promo.hero_banner");
      if (!row) return;
      const config = JSON.parse(row.body || "{}");
      const title = document.getElementById("promoHeroTitle");
      const body = document.getElementById("promoHeroBody");
      const eyebrow = document.getElementById("promoEyebrow");
      const image = document.getElementById("promoBannerPhoto");
      const label = document.getElementById("promoBannerLabel");
      const cta = document.getElementById("promoHeroCta");
      if (title && config.title) title.textContent = config.title;
      if (body && config.body) body.textContent = config.body;
      if (eyebrow && config.eyebrow) eyebrow.textContent = `✦ ${config.eyebrow}`;
      if (image && safeImage(config.imageUrl)) image.style.backgroundImage = `linear-gradient(135deg,#4c329522,#fa7d5a12),url("${safeImage(config.imageUrl)}")`;
      if (label && config.imageLabel) label.textContent = `✦ ${config.imageLabel}`;
      if (cta && config.ctaLabel) cta.textContent = config.ctaLabel;
      if (cta && typeof config.ctaUrl === "string" && config.ctaUrl.startsWith("/")) cta.href = config.ctaUrl;
    } catch { /* Keep the branded default banner if optional content is unavailable. */ }
  }
  void loadPromos();
  void loadBanner();
})();
