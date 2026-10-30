(() => {
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>\"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[char]);
  const safeImage = (value) => {
    try { const url = new URL(value, location.origin); return url.protocol === "https:" || url.origin === location.origin ? url.href : ""; }
    catch { return ""; }
  };
  const navs = [...document.querySelectorAll("nav.links")];
  if (!navs.length) return;
  const style = document.createElement("style");
  style.textContent = `
    .dest-menu-wrap{position:relative;display:inline-flex;align-items:center;gap:4px}
    .dest-menu-wrap>a{display:inline-flex;align-items:center;gap:5px}
    .dest-menu-caret{font-size:10px;color:#948aa2;transition:transform .18s}
    .destination-mega{position:absolute;z-index:60;left:50%;top:calc(100% + 18px);transform:translate(-50%,8px);width:min(760px,calc(100vw - 40px));padding:20px;background:#fff;border:1px solid #eee8f5;border-radius:18px;box-shadow:0 22px 55px #2d1d461f;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .18s,transform .18s,visibility .18s}
    .destination-mega:before{content:"";position:absolute;left:0;right:0;top:-19px;height:20px}
    .dest-menu-wrap:hover .destination-mega,.dest-menu-wrap:focus-within .destination-mega,.dest-menu-wrap.expanded .destination-mega{opacity:1;visibility:visible;pointer-events:auto;transform:translate(-50%,0)}
    .dest-menu-wrap:hover .dest-menu-caret,.dest-menu-wrap:focus-within .dest-menu-caret,.dest-menu-wrap.expanded .dest-menu-caret{transform:rotate(180deg)}
    .destination-mega-head{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:0 2px 13px;border-bottom:1px solid #f0edf4;margin-bottom:13px}
    .destination-mega-head strong{font-size:13px;color:#29213d}.destination-mega-head span{font-size:10px;color:#8c8497}
    .destination-mega-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}
    .destination-mega-group{min-width:0;padding:11px;border-radius:12px;background:#faf9fc}
    .destination-mega-region{display:block;color:#6335c9!important;font-size:11px!important;font-weight:800!important;margin:0 0 8px;padding:0!important}
    .destination-mega-place{display:flex;gap:7px;align-items:center;color:#615a6c!important;font-size:10px!important;font-weight:600!important;padding:5px 0!important;line-height:1.3}
    .destination-mega-place:hover,.destination-mega-all:hover{color:#7038e8!important}
    .destination-mega-place img,.destination-mega-avatar{flex:none;width:25px;height:25px;border-radius:8px;object-fit:cover;background:linear-gradient(135deg,#d5c5ff,#ffd9bd);display:grid;place-items:center;color:#7041c9;font-size:10px}
    .destination-mega-all{display:block;margin-top:6px;padding:5px 0 0!important;border-top:1px solid #ebe6f1;color:#827a8e!important;font-size:9px!important;font-weight:700!important}
    .dest-menu-toggle{display:none}
    @media(max-width:700px){
      .dest-menu-wrap{width:100%;display:grid;grid-template-columns:1fr auto;align-items:center;gap:8px}
      .dest-menu-wrap>a{padding:0!important}
      .dest-menu-toggle{display:grid;place-items:center;width:30px;height:30px;border:1px solid #eee8f5;background:#faf8fd;color:#6d3bd0;border-radius:9px;font-size:14px}
      .destination-mega{position:static;grid-column:1/-1;display:none;transform:none!important;width:100%;padding:11px;border:0;border-radius:12px;box-shadow:none;background:#f8f6fb;opacity:1;visibility:visible;pointer-events:auto}
      .dest-menu-wrap.expanded .destination-mega{display:block}
      .destination-mega:before{display:none}.destination-mega-head{display:block;margin-bottom:8px;padding-bottom:8px}.destination-mega-head span{display:block;margin-top:4px}
      .destination-mega-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.destination-mega-group{padding:9px}.destination-mega-place{font-size:9px!important}
    }
  `;
  document.head.append(style);

  navs.forEach((nav) => {
    const candidate = [...nav.querySelectorAll("a")].find((anchor) => anchor.getAttribute("href")?.replace(/\/$/, "") === "/explore");
    if (!candidate || candidate.closest(".dest-menu-wrap")) return;
    const wrapper = document.createElement("span");
    wrapper.className = "dest-menu-wrap";
    candidate.parentNode.insertBefore(wrapper, candidate);
    wrapper.append(candidate);
    const caret = document.createElement("span");
    caret.className = "dest-menu-caret";
    caret.textContent = "▾";
    candidate.append(caret);
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "dest-menu-toggle";
    toggle.setAttribute("aria-label", "Tampilkan wilayah destinasi");
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "⌄";
    wrapper.append(toggle);
    const panel = document.createElement("div");
    panel.className = "destination-mega";
    panel.innerHTML = `<div class="destination-mega-head"><strong>Jelajahi berdasarkan wilayah</strong><span>Pilih wilayah atau langsung buka destinasi</span></div><div class="destination-mega-grid"><div class="destination-mega-group"><a class="destination-mega-region" href="/explore/">Semua destinasi</a><span class="destination-mega-place">Temukan semua pilihan wisata EasyTicket</span></div></div>`;
    wrapper.append(panel);
    toggle.addEventListener("click", () => {
      const expanded = wrapper.classList.toggle("expanded");
      toggle.setAttribute("aria-expanded", String(expanded));
    });
    fetch("/api/destinations", { cache: "no-store" }).then((response) => response.ok ? response.json() : Promise.reject()).then((data) => {
      const destinations = Array.isArray(data.destinations) ? data.destinations : [];
      return fetch("/api/destination-regions", { cache: "no-store" }).then((response) => response.ok ? response.json() : { regions: null }).catch(() => ({ regions: null })).then((regionData) => ({ destinations, regions: Array.isArray(regionData.regions) ? regionData.regions : null }));
    }).then(({ destinations, regions }) => {
      const fallbackRegion = (city) => {
        const place = String(city || "").toLocaleLowerCase("id");
        if (/bali|gianyar|sukawati|nusa dua/.test(place)) return "Bali";
        if (/jakarta|pik/.test(place)) return "Jakarta";
        if (/jawa barat|bandung|bekasi|pangalengan/.test(place)) return "Jawa Barat";
        if (/jawa timur|sidoarjo|mojokerto|surabaya|pacet/.test(place)) return "Jawa Timur";
        if (/jawa tengah|dieng|wonosobo|yogyakarta|jogja/.test(place)) return "Jawa Tengah";
        if (/sulawesi|makassar|gowa|palopo|malino/.test(place)) return "Sulawesi";
        if (/sumatera|pekanbaru|riau|harau|lima puluh kota/.test(place)) return "Sumatera";
        return String(city || "").split(",")[0].trim();
      };
      const cityRegions = new Map();
      if (regions) for (const region of regions) for (const city of region.cities || []) cityRegions.set(String(city).trim().toLocaleLowerCase("id"), region.name);
      const regionOf = (destination) => cityRegions.get(String(destination.city || "").trim().toLocaleLowerCase("id")) || fallbackRegion(destination.city);
      const used = new Set(destinations.map(regionOf).filter(Boolean));
      const groups = regions || [...new Set(destinations.map(regionOf).filter(Boolean))].sort((a, b) => a.localeCompare(b, "id")).map((name) => ({ name }));
      const mapped = groups.map((region) => {
        const regionDestinations = destinations.filter((destination) => regionOf(destination) === region.name);
        const preview = regionDestinations.slice(0, 3).map((destination) => `<a class="destination-mega-place" href="/destination/${encodeURIComponent(destination.slug)}/">${safeImage(destination.coverImage) ? `<img src="${escapeHtml(safeImage(destination.coverImage))}" alt="" loading="lazy">` : `<span class="destination-mega-avatar">${escapeHtml(String(destination.name || "W").slice(0, 1))}</span>`}<span>${escapeHtml(destination.name)}</span></a>`).join("");
        return `<section class="destination-mega-group"><a class="destination-mega-region" href="/explore/?region=${encodeURIComponent(region.name)}">${escapeHtml(region.name)}</a>${preview || `<span class="destination-mega-place">Pilihan destinasi segera hadir</span>`}<a class="destination-mega-all" href="/explore/?region=${encodeURIComponent(region.name)}">Lihat semua di ${escapeHtml(region.name)} →</a></section>`;
      });
      panel.querySelector(".destination-mega-grid").innerHTML = `<div class="destination-mega-group"><a class="destination-mega-region" href="/explore/">Semua destinasi</a><span class="destination-mega-place">Jelajahi semua pilihan wisata EasyTicket</span><a class="destination-mega-all" href="/explore/">Lihat seluruh destinasi →</a></div>${mapped.join("")}`;
    }).catch(() => { /* Keep the fast link to the full destination catalog available. */ });
  });
})();
