(() => {
  const path = location.pathname;
  if (/^\/(admin|merchant\/dashboard|bd\/dashboard|validasi-tiket|checkout|payment|e-ticket)(\/|$)/.test(path)) return;

  const localToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const params = new URLSearchParams(location.search);
  const today = localToday();
  const requestedDate = params.get('date');
  const startDate = /^\d{4}-\d{2}-\d{2}$/.test(requestedDate || '') && requestedDate >= today ? requestedDate : today;
  const existingForm = document.getElementById('searchForm') || document.getElementById('search');
  const isExplore = path.replace(/\/+$/, '') === '/explore';
  const suggestions = document.createElement('datalist');
  suggestions.id = 'et-search-suggestions';
  ['Bandung', 'Surabaya', 'Bali', 'Pekanbaru', 'Makassar', 'Yogyakarta', 'Jakarta'].forEach((city) => {
    const option = document.createElement('option');
    option.value = city;
    suggestions.appendChild(option);
  });
  document.body.appendChild(suggestions);

  function addSearchDate(form) {
    let date = form.querySelector('input[type="date"]');
    if (!date) {
      const field = document.createElement('div');
      field.className = 'et-search-field et-search-date-field';
      field.innerHTML = '<label for="et-search-date">Tanggal kunjungan</label><input id="et-search-date" name="date" type="date" aria-label="Tanggal kunjungan">';
      const button = form.querySelector('button[type="submit"],button:not([type])');
      form.insertBefore(field, button || null);
      date = field.querySelector('input');
    }
    date.min = today;
    if (!date.value || date.value < today || requestedDate) date.value = startDate;
    date.setAttribute('aria-label', 'Tanggal kunjungan');
    return date;
  }

  function searchInput(form) {
    return form.querySelector('#where, #query, input[type="search"], input[name="q"]');
  }

  function filterExplore(query) {
    const q = query.trim().toLocaleLowerCase('id');
    document.querySelectorAll('#tiles .tile, #destinationCards .tile').forEach((card) => {
      card.hidden = Boolean(q) && !card.innerText.toLocaleLowerCase('id').includes(q);
    });
    const cards = [...document.querySelectorAll('#destinationCards .tile:not([hidden]), #tiles .tile:not([hidden])')];
    let note = document.getElementById('etSearchNote');
    if (!note) {
      note = document.createElement('p');
      note.id = 'etSearchNote';
      note.className = 'et-search-results-note';
      const host = document.querySelector('.et-search-wrap') || document.querySelector('.hero');
      host?.appendChild(note);
    }
    if (note) {
      note.textContent = q ? (cards.length ? `${cards.length} pilihan ditemukan untuk “${query.trim()}”.` : `Belum ada destinasi yang cocok dengan “${query.trim()}”. Coba nama kota atau aktivitas lain.`) : '';
      note.classList.toggle('show', Boolean(q));
    }
  }

  if (existingForm) {
    existingForm.classList.add('et-searchbar');
    existingForm.querySelector('button[type="submit"],button:not([type])')?.classList.add('et-search-button');
    const input = searchInput(existingForm);
    const date = addSearchDate(existingForm);
    if (input) {
      input.placeholder = 'Cari kota, tempat, atau aktivitas';
      input.setAttribute('aria-label', 'Cari kota, tempat, atau aktivitas');
      input.setAttribute('list', suggestions.id);
      if (params.has('q')) input.value = params.get('q') || '';
    }
    existingForm.onsubmit = (event) => {
      event.preventDefault();
      const extra = existingForm.querySelector('#activity');
      const query = [input?.value.trim(), extra?.value.trim()].filter(Boolean).join(' ');
      const chosenDate = date?.value && date.value >= today ? date.value : today;
      if (isExplore) {
        const next = new URL(location.href);
        query ? next.searchParams.set('q', query) : next.searchParams.delete('q');
        next.searchParams.set('date', chosenDate);
        history.replaceState({}, '', next);
        filterExplore(query);
        document.querySelector('#destinationCards')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        const next = new URL('/explore/', location.origin);
        if (query) next.searchParams.set('q', query);
        next.searchParams.set('date', chosenDate);
        location.assign(next.href);
      }
    };
    if (isExplore && params.has('q')) filterExplore(params.get('q') || '');
  } else if (path === '/') {
    const nav = document.querySelector('header.nav, header.site-nav, header.head, .nav, header');
    if (nav) {
      const wrap = document.createElement('div');
      wrap.className = 'et-search-wrap';
      wrap.innerHTML = '<form class="et-searchbar" role="search"><div class="et-search-field"><label for="et-search-query">Mau ke mana?</label><input id="et-search-query" name="q" type="search" placeholder="Cari kota, tempat, atau aktivitas" autocomplete="off" aria-label="Cari kota, tempat, atau aktivitas"></div><div class="et-search-field"><label for="et-search-date">Tanggal kunjungan</label><input id="et-search-date" name="date" type="date" aria-label="Tanggal kunjungan"></div><button class="et-search-button" type="submit">Cari pengalaman →</button></form><p id="etSearchNote" class="et-search-results-note" role="status"></p>';
      const homeHero = path === '/' ? document.querySelector('main#top > .hero') : null;
      (homeHero || nav).insertAdjacentElement('afterend', wrap);
      const form = wrap.querySelector('form');
      const input = form.querySelector('input[type="search"]');
      const date = form.querySelector('input[type="date"]');
      date.min = today;
      date.value = startDate;
      input.value = params.get('q') || '';
      input.setAttribute('list', suggestions.id);
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const next = new URL('/explore/', location.origin);
        if (input.value.trim()) next.searchParams.set('q', input.value.trim());
        next.searchParams.set('date', date.value && date.value >= today ? date.value : today);
        location.assign(next.href);
      });
    }
  }

  if (isExplore) {
    const observer = new MutationObserver(() => filterExplore(document.getElementById('query')?.value || ''));
    const cards = document.getElementById('destinationCards');
    if (cards) observer.observe(cards, { childList: true, subtree: true });
    document.addEventListener('click', (event) => {
      const link = event.target.closest('#destinationCards a[href*="/destination/"], #experiences a[href*="/destination/"]');
      if (!link) return;
      const chosenDate = document.querySelector('#search input[type="date"]')?.value || startDate;
      const destinationUrl = new URL(link.href, location.origin);
      destinationUrl.searchParams.set('date', chosenDate >= today ? chosenDate : today);
      link.href = destinationUrl.href;
    }, true);
  }
})();
