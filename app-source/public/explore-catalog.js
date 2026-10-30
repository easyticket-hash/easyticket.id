(() => {
  const root = document.getElementById("tiles");
  if (!root) return;
  const regionBar = document.getElementById("exploreRegions");
  const countNode = document.getElementById("exploreCount");
  const pagination = document.getElementById("explorePagination");
  const statusNode = document.getElementById("explorePageStatus");
  const search = document.getElementById("search");
  const queryInput = document.getElementById("query");
  const dateInput = document.getElementById("visit-date");
  const pageSize = 12;
  let destinations = [];
  let regionByCity = new Map();
  let configuredRegions = null;
  let selectedRegion = new URLSearchParams(location.search).get("region")?.trim() || "all";
  let page = 1;
  let query = new URLSearchParams(location.search).get("q")?.trim() || "";
  const today = new Date();
  const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const requestedDate = new URLSearchParams(location.search).get("date") || "";

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const safeImage = (value) => {
    if (typeof value !== "string" || !value.trim()) return "";
    try { const url = new URL(value, location.origin); return url.protocol === "https:" || url.origin === location.origin ? url.href : ""; }
    catch { return ""; }
  };
  const regionFor = (city) => {
    const place = String(city || "").trim().toLowerCase();
    if (!place || /lokasi menyusul|belum ditentukan|menyusul/.test(place)) return "";
    if (/bali|gianyar|sukawati|nusa dua/.test(place)) return "Bali";
    if (/jakarta|pik/.test(place)) return "Jakarta";
    if (/jawa barat|bandung|bekasi|pangalengan/.test(place)) return "Jawa Barat";
    if (/jawa timur|sidoarjo|mojokerto|surabaya|pacet/.test(place)) return "Jawa Timur";
    if (/jawa tengah|dieng|wonosobo|yogyakarta|jogja/.test(place)) return "Jawa Tengah";
    if (/sulawesi|makassar|gowa|palopo|malino/.test(place)) return "Sulawesi";
    if (/sumatera|pekanbaru|riau|harau|lima puluh kota/.test(place)) return "Sumatera";
    return String(city).split(",")[0].trim();
  };
  const regionOf = (city) => regionByCity.get(String(city || "").trim().toLocaleLowerCase("id")) || (configuredRegions ? String(city || "").split(",")[0].trim() : regionFor(city));
  const formatMoney = (value) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value) || 0);
  const currentTickets = (destination) => (destination.tickets || []).filter((ticket) => Number(ticket.price) > 0);
  const card = (destination) => {
    const tickets = currentTickets(destination);
    const ticket = tickets.sort((a, b) => (a.promoPrice && a.promoPrice < a.price ? a.promoPrice : a.price) - (b.promoPrice && b.promoPrice < b.price ? b.promoPrice : b.price))[0];
    const image = safeImage(destination.coverImage || destination.importedImage) || "/media/easyticket-hero-family.webp";
    const discounted = ticket && Number(ticket.promoPrice) > 0 && Number(ticket.promoPrice) < Number(ticket.price);
    const importedPrice = Number(destination.legacyStartingPrice) > 0 ? Number(destination.legacyStartingPrice) : 0;
    const shownPrice = ticket ? Number(discounted ? ticket.promoPrice : ticket.price) : importedPrice;
    const priceHtml = shownPrice ? `<small>Mulai dari</small>${ticket && discounted ? `<del>${formatMoney(ticket.price)}</del>` : ""}<span>${formatMoney(shownPrice)}</span>` : `<small>Informasi harga</small><span>Segera hadir</span>`;
    const discountHtml = discounted ? `<span class="explore-discount">${escapeHtml(ticket.promoLabel || "Promo")}</span>` : "";
    const about = destination.description || destination.aboutExperience || "Lihat informasi kunjungan dan pilihan tiket di halaman EasyTicket merchant.";
    const tags = [destination.name, destination.legacyName, destination.city, destination.category, destination.description, destination.aboutExperience].filter(Boolean).join(" ").toLocaleLowerCase("id");
    const href = `/destination/${encodeURIComponent(destination.slug)}/`;
    const fallbackImage = destination.slug ? `/media/old-listings/${encodeURIComponent(destination.slug)}.webp` : "";
    return `<article class="tile" data-region="${escapeHtml(regionOf(destination.city))}" data-search="${escapeHtml(tags)}"><a class="explore-tile-link" href="${escapeHtml(href)}"><div class="tile-image"><img class="tile-photo" src="${escapeHtml(image)}" alt="${escapeHtml(destination.name)}" loading="lazy" data-fallback="${escapeHtml(fallbackImage)}" onerror="if(this.dataset.fallback){const f=this.dataset.fallback;this.dataset.fallback='';this.src=f}else{this.remove()}">${discountHtml}<span class="badge">${escapeHtml(destination.city || "Indonesia")}</span></div><div class="tile-body"><small>${escapeHtml(destination.category || "Wisata")}</small><h3>${escapeHtml(destination.name)}</h3><p class="explore-card-location">⌖ ${escapeHtml(destination.city || "Indonesia")}</p><p>${escapeHtml(about)}</p><div class="explore-card-footer"><div class="explore-card-price">${priceHtml}</div><span class="explore-card-link">Lihat tiket →</span></div></div></a></article>`;
  };
  function filtered() {
    return destinations.filter((destination) => {
      const regionMatch = selectedRegion === "all" || regionOf(destination.city) === selectedRegion;
      const searchText = [destination.name, destination.city, destination.category, destination.description, destination.aboutExperience, ...(destination.tickets || []).map((ticket) => `${ticket.name} ${ticket.description}`)].filter(Boolean).join(" ").toLocaleLowerCase("id");
      return regionMatch && (!query || searchText.includes(query.toLocaleLowerCase("id")));
    });
  }
  function renderRegions() {
    if (!regionBar) return;
    const regionNames = configuredRegions
      ? [...configuredRegions.map((region) => region.name).filter((name) => destinations.some((destination) => regionOf(destination.city) === name)), ...new Set(destinations.map((destination) => regionOf(destination.city)).filter((name) => name && !configuredRegions.some((region) => region.name === name)))]
      : [...new Set(destinations.map((destination) => regionOf(destination.city)).filter(Boolean))].sort((a, b) => a.localeCompare(b, "id"));
    regionBar.innerHTML = `<button class="explore-region${selectedRegion === "all" ? " active" : ""}" type="button" data-region="all" aria-pressed="${selectedRegion === "all"}">Semua lokasi</button>${regionNames.map((name) => `<button class="explore-region${selectedRegion === name ? " active" : ""}" type="button" data-region="${escapeHtml(name)}" aria-pressed="${selectedRegion === name}">${escapeHtml(name)}</button>`).join("")}`;
  }
  function renderPagination(totalPages) {
    if (!pagination) return;
    if (totalPages <= 1) { pagination.innerHTML = ""; return; }
    const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
    pagination.innerHTML = `<button type="button" data-page="${page - 1}" ${page <= 1 ? "disabled" : ""} aria-label="Halaman sebelumnya">‹</button>${pages.map((number) => `<button type="button" data-page="${number}" class="${number === page ? "active" : ""}" aria-current="${number === page ? "page" : "false"}">${number}</button>`).join("")}<button type="button" data-page="${page + 1}" ${page >= totalPages ? "disabled" : ""} aria-label="Halaman selanjutnya">›</button>`;
  }
  function render() {
    renderRegions();
    const items = filtered();
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    page = Math.min(Math.max(1, page), totalPages);
    const start = (page - 1) * pageSize;
    const visible = items.slice(start, start + pageSize);
    root.innerHTML = visible.length ? visible.map(card).join("") : `<div class="explore-empty"><strong>${query || selectedRegion !== "all" ? "Belum ada destinasi yang cocok" : "Destinasi baru segera hadir"}</strong>${query || selectedRegion !== "all" ? "Coba kata pencarian atau wilayah lain." : "Merchant EasyTicket sedang menyiapkan pilihan wisata untukmu."}</div>`;
    if (countNode) countNode.textContent = items.length ? `Menampilkan ${start + 1}–${Math.min(start + visible.length, items.length)} dari ${items.length} merchant` : "0 merchant ditemukan";
    if (statusNode) statusNode.textContent = totalPages > 1 ? `Halaman ${page} dari ${totalPages} · Maksimal ${pageSize} destinasi per halaman` : items.length ? `${items.length} destinasi tersedia` : "";
    renderPagination(totalPages);
  }

  if (queryInput) {
    queryInput.value = query;
    queryInput.addEventListener("input", () => { query = queryInput.value.trim(); page = 1; render(); });
  }
  if (dateInput) { dateInput.min = localToday; dateInput.value = /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) && requestedDate >= localToday ? requestedDate : localToday; }
  search?.addEventListener("submit", (event) => {
    event.preventDefault();
    query = queryInput?.value.trim() || "";
    page = 1;
    const next = new URL(location.href);
    query ? next.searchParams.set("q", query) : next.searchParams.delete("q");
    next.searchParams.set("date", dateInput?.value && dateInput.value >= localToday ? dateInput.value : localToday);
    history.replaceState({}, "", next);
    render();
    document.getElementById("tiles")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  regionBar?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-region]");
    if (!button) return;
    selectedRegion = button.dataset.region || "all";
    const next = new URL(location.href);
    selectedRegion === "all" ? next.searchParams.delete("region") : next.searchParams.set("region", selectedRegion);
    history.replaceState({}, "", next);
    page = 1;
    render();
  });
  pagination?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-page]");
    if (!button || button.disabled) return;
    page = Number(button.dataset.page) || 1;
    render();
    document.getElementById("tiles")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  root.addEventListener("click", (event) => {
    const link = event.target.closest("a[href^='/destination/']");
    if (!link) return;
    const today = new Date();
    const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const chosenDate = dateInput?.value && dateInput.value >= localDate ? dateInput.value : localDate;
    const target = new URL(link.href, location.origin);
    target.searchParams.set("date", chosenDate);
    link.href = target.href;
  });

  Promise.all([
    fetch("/api/destinations", { cache: "no-store" }).then((response) => response.ok ? response.json() : Promise.reject(new Error("Destinasi tidak dapat dimuat."))),
    fetch("/api/destination-regions", { cache: "no-store" }).then((response) => response.ok ? response.json() : { regions: null }).catch(() => ({ regions: null })),
    fetch("/legacy-destinations.json", { cache: "no-store" }).then((response) => response.ok ? response.json() : []).catch(() => []),
  ]).then(([data, regionData, legacyCatalog]) => {
    destinations = Array.isArray(data.destinations) ? data.destinations : [];
    const bySlug = new Map(destinations.map((destination) => [destination.slug, destination]));
    for (const legacy of Array.isArray(legacyCatalog) ? legacyCatalog : []) {
      const current = bySlug.get(legacy.matchSlug || legacy.slug);
      if (current) {
        current.legacyName = legacy.name;
        current.name = legacy.name;
        current.legacyStartingPrice = legacy.startingPrice;
        current.legacyBookingUrl = legacy.bookingUrl;
        current.internalPage = legacy.internalPage === true;
        // Keep the image saved with the destination record. The legacy catalog
        // contains generic template imagery for many merchants and must only
        // fill in a genuinely missing cover.
        if (!current.coverImage && legacy.image) current.coverImage = legacy.image;
        if (legacy.city) current.city = legacy.city;
        if (legacy.category) current.category = legacy.category;
        if (legacy.description) current.description = legacy.description;
        continue;
      }
      const imported = {
        ...legacy,
        legacyName: legacy.name,
        legacyStartingPrice: legacy.startingPrice,
        legacyBookingUrl: legacy.bookingUrl,
        internalPage: legacy.internalPage === true,
        coverImage: legacy.image || "/media/easyticket-hero-family.webp",
        importedImage: legacy.image,
        description: "",
        aboutExperience: "",
        tickets: [],
      };
      destinations.push(imported);
      bySlug.set(imported.slug, imported);
    }
    // Keep the clearly marked checkout demo at the top for convenient testing.
    destinations.sort((a, b) => Number(b.slug === "kolam-renang-summarecon-test") - Number(a.slug === "kolam-renang-summarecon-test") || String(a.name || "").localeCompare(String(b.name || ""), "id"));
    const suggestions = document.getElementById("exploreSuggestions");
    if (suggestions) suggestions.innerHTML = [...new Set(destinations.flatMap((destination) => [destination.city, destination.name]).filter(Boolean))].map((value) => `<option value="${escapeHtml(value)}"></option>`).join("");
    configuredRegions = Array.isArray(regionData.regions) ? regionData.regions : null;
    if (configuredRegions) for (const region of configuredRegions) for (const city of region.cities || []) regionByCity.set(String(city).trim().toLocaleLowerCase("id"), region.name);
    if (selectedRegion !== "all") {
      const available = [...(configuredRegions || []).map((region) => region.name), ...new Set(destinations.map((destination) => regionOf(destination.city)).filter(Boolean))];
      selectedRegion = available.find((name) => name.toLocaleLowerCase("id") === selectedRegion.toLocaleLowerCase("id")) || "all";
    }
    render();
  }).catch(() => {
    if (countNode) countNode.textContent = "Destinasi belum dapat dimuat";
    root.innerHTML = `<div class="explore-empty"><strong>Koneksi katalog sedang bermasalah</strong>Silakan muat ulang halaman beberapa saat lagi.</div>`;
    if (pagination) pagination.innerHTML = "";
  });
})();
