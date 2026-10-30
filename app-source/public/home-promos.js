(() => {
  const root = document.getElementById("homePromoTrack");
  if (!root) return;
  const promotions = [
    {
      key: "asia",
      eyebrow: "PROMO TIKET WISATA",
      title: "Asia Heritage",
      merchant: "Jelajahi pengalaman budaya bersama keluarga",
      offerLabel: "DISKON HINGGA",
      offer: "50%",
      action: "Lihat tiket",
      image: "/media/promo-asia-heritage-banner.webp",
      href: "/destination/asia-heritage/?promo=asia-heritage-50",
      tone: "#7138d7",
    },
    {
      key: "bali",
      eyebrow: "PROMO BALI",
      title: "Museum Pasifika",
      merchant: "Bali · Rencanakan kunjunganmu",
      offerLabel: "DISKON",
      offer: "20%",
      action: "Lihat destinasi",
      image: "/media/promo-bali-banner.webp",
      href: "/destination/museum-pasifika/?promo=museum-pasifika-20",
      tone: "#d94ca4",
    },
    {
      key: "merchant",
      eyebrow: "KHUSUS MERCHANT",
      title: "Daftar sebagai merchant",
      merchant: "Periode 1 Okt–31 Des 2026",
      offerLabel: "BIAYA DAFTAR",
      offer: "GRATIS",
      action: "Daftar sekarang",
      image: "/media/promo-merchant-signup-banner.webp",
      href: "/merchant/register/",
      tone: "#6638d2",
    },
  ];
  root.innerHTML = promotions.map((promo) => `<a class="home-promo-card promo-${promo.key}" href="${promo.href}" style="--promo-color:${promo.tone}"><span class="home-promo-image" style="background-image:url('${promo.image}')"></span><span class="home-promo-content"><span class="home-promo-badge">${promo.eyebrow}</span><strong>${promo.title}</strong><small>${promo.merchant}</small><span class="home-promo-link">${promo.action} <b>↗</b></span></span><span class="home-promo-offer"><small>${promo.offerLabel}</small><strong>${promo.offer}</strong><i>✦</i></span></a>`).join("");
  const track = root;
  const prev = document.getElementById("homePromoPrev");
  const next = document.getElementById("homePromoNext");
  const updateButtons = () => {
    const hasOverflow = !!track && track.scrollWidth > track.clientWidth + 2;
    if (prev) { prev.disabled = !hasOverflow || track.scrollLeft <= 2; prev.hidden = !hasOverflow; }
    if (next) { next.disabled = !hasOverflow || track.scrollLeft >= track.scrollWidth - track.clientWidth - 2; next.hidden = !hasOverflow; }
  };
  prev?.addEventListener("click", () => track?.scrollBy({ left: -track.clientWidth, behavior: "smooth" }));
  next?.addEventListener("click", () => track?.scrollBy({ left: track.clientWidth, behavior: "smooth" }));
  track?.addEventListener("scroll", updateButtons, { passive: true });
  window.addEventListener("resize", updateButtons);
  requestAnimationFrame(updateButtons);
})();
