(() => {
  const form = document.getElementById('merchantForm');
  if (!form) return;
  const message = document.getElementById('formMessage');
  const button = document.getElementById('submitBtn');
  const province = form.elements.province, city = form.elements.city;
  const files = form.elements.documents, list = document.getElementById('documentList');
  const email = form.elements.email, emailArea = email.closest('.reg-email');
  const verify = document.getElementById('verifyBusinessEmail');
  const confirm = document.getElementById('confirmBusinessEmail');
  const otpPanel = document.getElementById('emailOtpPanel');
  const code = document.getElementById('merchantEmailCode');
  const emailStatus = document.getElementById('emailVerificationStatus');
  const success = document.getElementById('merchantRegistrationSuccess');
  let regions = [], selected = [], busy = false, emailBusy = false;
  let verified = null, challenge = null, cooldown = 0, submitted = false;
  const submissionKey = crypto.randomUUID(), accessToken = crypto.randomUUID() + crypto.randomUUID();
  const normalizedEmail = () => email.value.trim().toLowerCase();
  const notice = (text) => { message.textContent = text; message.classList.add('show'); };
  function option(value, label = value) {
    const el = document.createElement('option'); el.value = value; el.textContent = label; return el;
  }
  function tick() {
    const left = Math.max(0, Math.ceil((cooldown - Date.now()) / 1000));
    const valid = verified && verified.email === normalizedEmail();
    verify.disabled = !!valid || emailBusy || left > 0 || submitted;
    verify.textContent = valid ? '✓ Terverifikasi' : emailBusy ? 'Memproses…' : left ? `Kirim ulang (${left}s)` : challenge ? 'Kirim ulang' : 'Verifikasi';
    confirm.disabled = emailBusy || submitted;
  }
  setInterval(tick, 1000);
  fetch('/merchant-regions.json').then(r => { if (!r.ok) throw Error(); return r.json(); }).then(data => {
    regions = data; province.replaceChildren(option('', 'Pilih provinsi'), ...data.map(r => option(r.name)));
    province.disabled = false; if (!submitted) button.disabled = false;
  }).catch(() => {
    province.replaceChildren(option('', 'Wilayah belum dapat dimuat'));
    document.getElementById('regionHelp').textContent = 'Data wilayah gagal dimuat. Muat ulang halaman untuk mencoba lagi.';
    button.disabled = true;
  });
  province.addEventListener('change', () => {
    const row = regions.find(r => r.name === province.value);
    city.replaceChildren(option('', row ? 'Pilih kota / kabupaten' : 'Pilih provinsi terlebih dahulu'), ...(row?.cities || []).map(c => option(c)));
    city.disabled = !row;
  });
  email.addEventListener('input', () => {
    if (verified && verified.email !== normalizedEmail()) verified = null;
    if (challenge && challenge.email !== normalizedEmail()) { challenge = null; otpPanel.hidden = true; code.value = ''; }
    emailArea.classList.toggle('is-verified', !!verified);
    emailStatus.textContent = verified ? 'Email bisnis sudah terverifikasi.' : 'Verifikasi email bisnis sebelum mengirim pendaftaran.';
    tick();
  });
  async function emailRequest(body) {
    const response = await fetch('/api/merchants/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) throw Error(result.error || 'Verifikasi belum berhasil.');
    return result;
  }
  verify.onclick = async () => {
    if (emailBusy || submitted) return;
    if (!email.reportValidity()) return;
    if (!normalizedEmail()) { email.focus(); return; }
    const targetEmail = normalizedEmail();
    emailBusy = true; tick(); emailStatus.textContent = 'Mengirim kode verifikasi…';
    try {
      const result = await emailRequest({ action: 'send', email: targetEmail });
      cooldown = Date.now() + 60000;
      if (normalizedEmail() !== targetEmail) { emailStatus.textContent = 'Email sudah berubah. Verifikasi email yang baru.'; return; }
      challenge = { id: result.challengeId, email: targetEmail };
      otpPanel.hidden = false; code.value = ''; emailStatus.textContent = result.message; code.focus();
    } catch (error) { emailStatus.textContent = error.message || 'Kode belum berhasil dikirim.'; }
    finally { emailBusy = false; tick(); }
  };
  confirm.onclick = async () => {
    if (emailBusy || !challenge || submitted) return;
    if (!/^[0-9]{6}$/.test(code.value)) { emailStatus.textContent = 'Masukkan kode verifikasi 6 digit.'; code.focus(); return; }
    const target = { ...challenge };
    emailBusy = true; tick();
    try {
      const result = await emailRequest({ action: 'confirm', email: target.email, challengeId: target.id, code: code.value });
      if (normalizedEmail() !== target.email) { emailStatus.textContent = 'Email sudah berubah. Lakukan verifikasi ulang.'; return; }
      verified = { email: result.email, challengeId: result.challengeId, token: result.verificationToken };
      emailArea.classList.add('is-verified'); otpPanel.hidden = true; code.value = '';
      emailStatus.textContent = 'Email bisnis sudah terverifikasi. Silakan lengkapi form dan dokumen.';
    } catch (error) { emailStatus.textContent = error.message || 'Kode belum sesuai.'; }
    finally { emailBusy = false; tick(); }
  };
  code.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); confirm.click(); } });
  function renderFiles() {
    list.replaceChildren();
    selected.forEach((file, i) => {
      const li = document.createElement('li'), span = document.createElement('span'), remove = document.createElement('button');
      span.textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`;
      remove.type = 'button'; remove.textContent = 'Hapus'; remove.setAttribute('aria-label', 'Hapus ' + file.name);
      remove.onclick = () => { selected.splice(i, 1); renderFiles(); };
      li.append(span, remove); list.append(li);
    });
  }
  files.addEventListener('change', () => {
    const next = [...selected, ...files.files]; files.value = '';
    if (next.length > 3) return notice('Maksimal 3 dokumen. Beberapa dokumen dapat digabung dalam satu PDF.');
    if (next.some(f => !f.size || f.size > 5 * 1024 * 1024 || !['application/pdf', 'image/jpeg', 'image/png'].includes(f.type))) return notice('Gunakan PDF, JPG, atau PNG yang tidak kosong, maksimal 5 MB per file.');
    selected = next; renderFiles();
  });
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (busy || submitted) return;
    if (!verified || verified.email !== normalizedEmail()) {
      notice('Verifikasi email bisnis terlebih dahulu melalui tombol di samping kolom email.'); email.focus(); return;
    }
    busy = true; button.disabled = true; button.textContent = 'Mengirim…';
    notice('Pendaftaran dan dokumen sedang dikirim. Tunggu hingga proses selesai.');
    const data = new FormData(form); data.delete('documents'); selected.forEach(f => data.append('documents', f));
    data.set('consent', String(form.elements.consent.checked)); data.set('submissionKey', submissionKey); data.set('accessToken', accessToken);
    data.set('emailChallengeId', verified.challengeId); data.set('emailVerificationToken', verified.token);
    try {
      const response = await fetch('/api/merchants', { method: 'POST', body: data }); const result = await response.json();
      if (!response.ok) throw Error(result.error || 'Pendaftaran belum berhasil.');
      submitted = true; notice('Pendaftaran sudah tersimpan.');
      try { localStorage.setItem('et_merchant_application', JSON.stringify({id:result.id,accessToken})); } catch {}
      const statusLink=document.createElement('a');statusLink.href='/merchant/application/';statusLink.textContent='Lihat status pendaftaran / perbaiki data →';success.append(statusLink);
      document.getElementById('registrationSummary').textContent = `Pendaftaran #${result.id} sudah diterima. Email bisnis sudah terverifikasi. Pendaftaran menunggu review Admin, kemudian approval dan aktivasi merchant. Tim EasyTicket akan menghubungi PIC untuk langkah berikutnya.`;
      success.hidden = false; form.querySelectorAll('input,select,textarea,button').forEach(el => el.disabled = true);
      button.textContent = 'Pendaftaran tersimpan'; tick(); success.focus();
    } catch (error) {
      notice(error.message || 'Koneksi bermasalah. Coba kirim kembali; data form tetap tersedia.'); button.disabled = false; button.textContent = 'Kirim pendaftaran →';
    } finally { busy = false; }
  });
})();
