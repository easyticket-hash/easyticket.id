(()=>{
  const root=document.getElementById('experiences');
  if(!root)return;
  const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const m=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);
  const safeImage=value=>{try{const url=new URL(value,location.origin);return url.protocol==='https:'||url.origin===location.origin?url.href:''}catch{return ''}};
  const regionFor=city=>{
    const place=String(city||'').trim().toLowerCase();
    if(!place||/lokasi menyusul|belum ditentukan|menyusul/.test(place))return '';
    if(/bali|gianyar|sukawati|nusa dua/.test(place))return 'Bali';
    if(/jakarta|pik/.test(place))return 'Jakarta';
    if(/jawa barat|bandung|bekasi|pangalengan/.test(place))return 'Jawa Barat';
    if(/jawa timur|sidoarjo|mojokerto|surabaya|pacet/.test(place))return 'Jawa Timur';
    if(/jawa tengah|dieng|wonosobo|yogyakarta|jogja/.test(place))return 'Jawa Tengah';
    if(/sulawesi|makassar|gowa|palopo|malino/.test(place))return 'Sulawesi';
    if(/sumatera|pekanbaru|riau|harau|lima puluh kota/.test(place))return 'Sumatera';
    return city.split(',')[0].trim();
  };
  const filterBar=document.getElementById('destinationFilters');
  const results=document.getElementById('destinationResults');
  let cityRegionMap=new Map();
  let regionConfigurationEnabled=false;
  const assignedRegion=city=>cityRegionMap.get(String(city||'').trim().toLocaleLowerCase('id'))||(regionConfigurationEnabled?String(city||'').split(',')[0].trim():regionFor(city));
  const card=d=>{
    const prices=(d.tickets||[]).map(t=>t.promoPrice&&t.promoPrice<t.price?t.promoPrice:t.price).filter(Number.isFinite);
    const price=prices.length?Math.min(...prices):0;
    const image=safeImage(d.coverImage)||'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=85';
    return `<a class="card" data-region="${e(assignedRegion(d.city))}" href="/destination/${encodeURIComponent(d.slug)}/" style="text-decoration:none;color:inherit"><div class="card-img" style="background-image:url('${e(image)}')"><span class="tag">${e(d.category||'Wisata')}</span></div><div class="card-body"><div class="location">⌖ ${e(d.city)}</div><h3>${e(d.name)}</h3><div class="card-meta">${e(d.description||'Tiket wisata EasyTicket')}</div><div class="card-bottom"><div class="price">${price?`<small>Mulai dari</small><strong>${m(price)}</strong>`:'<strong>Harga segera hadir</strong>'}</div><span class="offer-pill">Lihat destinasi →</span></div></div></a>`;
  };
  const prev=document.getElementById('experiencePrev');
  const next=document.getElementById('experienceNext');
  const count=document.getElementById('experienceCount');
  const updateControls=()=>{
    const max=Math.max(0,root.scrollWidth-root.clientWidth);
    const pageSize=Math.max(1,root.clientWidth);
    const current=Math.min(Math.floor((root.scrollLeft+pageSize*.25)/pageSize)+1,Math.max(1,Math.ceil(root.scrollWidth/pageSize)));
    const pages=Math.max(1,Math.ceil(root.scrollWidth/pageSize));
    if(count)count.textContent=`${current} / ${pages}`;
    if(prev)prev.disabled=root.scrollLeft<=2;
    if(next)next.disabled=root.scrollLeft>=max-2;
  };
  prev?.addEventListener('click',()=>root.scrollBy({left:-root.clientWidth,behavior:'smooth'}));
  next?.addEventListener('click',()=>root.scrollBy({left:root.clientWidth,behavior:'smooth'}));
  root.addEventListener('scroll',updateControls,{passive:true});
  window.addEventListener('resize',updateControls);
  filterBar?.addEventListener('click',event=>{
    const button=event.target.closest('button[data-region]');
    if(!button)return;
    const selected=button.dataset.region;
    filterBar.querySelectorAll('button[data-region]').forEach(item=>{
      const active=item===button;
      item.classList.toggle('active',active);
      item.setAttribute('aria-pressed',String(active));
    });
    let count=0;
    root.querySelectorAll('.card').forEach(item=>{
      item.hidden=selected!=='all'&&item.dataset.region!==selected;
      if(!item.hidden)count++;
    });
    root.scrollTo({left:0,behavior:'smooth'});
    if(results)results.textContent=selected==='all'?`Menampilkan ${count} destinasi`:`${count} destinasi di ${selected}`;
    updateControls();
  });
  Promise.all([fetch('/api/destinations',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()),fetch('/api/destination-regions',{cache:'no-store'}).then(r=>r.ok?r.json():{regions:null}).catch(()=>({regions:null}))]).then(([data,regionData])=>{
    const destinations=data.destinations||[];
    const configRegions=Array.isArray(regionData.regions)?regionData.regions:null;
    if(configRegions){regionConfigurationEnabled=true;for(const region of configRegions)for(const city of (region.cities||[]))cityRegionMap.set(String(city).trim().toLocaleLowerCase('id'),region.name);}
    const featuredOrder=['bali-taman-sari-water-sport','dieng-jeep-explorer','gswing-driving-range','kampuang-sarosah','keramas-park','motion-studio-asia-pik'];
    const bySlug=new Map(destinations.map(destination=>[destination.slug,destination]));
    const featured=featuredOrder.map(slug=>bySlug.get(slug)).filter(Boolean);
    const visible=[...featured,...destinations.filter(destination=>!featuredOrder.includes(destination.slug))].slice(0,6);
    root.innerHTML=visible.length?visible.map(card).join(''):'<p class="empty-destinations">Destinasi baru sedang disiapkan. Cek promo dan pilihan tiket lainnya.</p>';
    const order=['Bali','Jakarta','Jawa Barat','Jawa Timur','Jawa Tengah','Sulawesi','Sumatera'];
    let regions;
    if(configRegions){
      const used=new Set(visible.map(d=>assignedRegion(d.city)).filter(Boolean));
      regions=[...configRegions.map(item=>item.name).filter(name=>used.has(name)),...new Set(visible.map(d=>assignedRegion(d.city)).filter(name=>name&&!configRegions.some(item=>item.name===name)))];
    }else regions=[...new Set(visible.map(d=>assignedRegion(d.city)).filter(Boolean))].sort((a,b)=>{
      const ai=order.indexOf(a),bi=order.indexOf(b);
      if(ai<0&&bi<0)return a.localeCompare(b,'id');
      if(ai<0)return 1;
      if(bi<0)return -1;
      return ai-bi;
    });
    if(filterBar)filterBar.innerHTML=`<button class="destination-filter active" type="button" data-region="all" aria-pressed="true">Semua destinasi</button>${regions.map(region=>`<button class="destination-filter" type="button" data-region="${e(region)}" aria-pressed="false">${e(region)}</button>`).join('')}`;
    if(results)results.textContent=`Menampilkan ${visible.length} rekomendasi`;
    updateControls();
    const asia=visible.find(d=>d.slug==='asia-heritage');
    const photo=document.querySelector('.asia-promo .promo-photo');
    if(asia&&photo){const image=safeImage(asia.coverImage);if(image)photo.style.backgroundImage=`linear-gradient(115deg,#8c52ff22,#ff755e1a),url("${image}")`;}
  }).catch(()=>{root.innerHTML='<p class="empty-destinations">Destinasi belum dapat dimuat saat ini.</p>';updateControls()});
})();
