(function () {
  'use strict';

  const BASE = '';

  // Generate unique session ID per tab
  if (!sessionStorage.getItem('tab_session_id')) {
    const random = Math.random().toString(36).slice(2, 10);
    const tabId = 'tab-' + Date.now().toString(36) + '-' + random;
    sessionStorage.setItem('tab_session_id', tabId);
  }
  const TAB_SESSION_ID = sessionStorage.getItem('tab_session_id');

  async function apiJson(url, options) {
    const opts = Object.assign({ credentials: 'same-origin' }, options || {});
    opts.headers = opts.headers || {};
    opts.headers['X-Tab-Session-ID'] = TAB_SESSION_ID;
    const r = await fetch(BASE + url, opts);
    if (r.status === 401) {
      window.location.href = BASE + 'login.php';
      return null;
    }
    const text = await r.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('Invalid JSON', url, text);
      return { success: false, error: 'Respons tidak valid' };
    }
  }

  // Fungsi cache menggunakan sessionStorage
  function getCache(key) {
    try {
      const fullKey = TAB_SESSION_ID + '_' + key;
      const data = sessionStorage.getItem(fullKey);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  function setCache(key, data) {
    try {
      const fullKey = TAB_SESSION_ID + '_' + key;
      sessionStorage.setItem(fullKey, JSON.stringify(data));
    } catch (e) {
      // Jika storage penuh, abaikan
    }
  }

  function clearCache(key) {
    try {
      const fullKey = TAB_SESSION_ID + '_' + key;
      sessionStorage.removeItem(fullKey);
    } catch (e) {
      // Abaikan
    }
  }

  function formatRupiah(n) {
    const x = Number(n) || 0;
    return 'Rp ' + x.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function formatTanggalId(tgl) {
    if (!tgl) return '';
    const d = new Date(tgl + (tgl.length <= 10 ? 'T00:00:00' : ''));
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function wireLogout() {
    document.querySelectorAll('button').forEach(function (b) {
      if ((b.textContent || '').trim() === 'Logout') {
        b.addEventListener('click', function () {
          window.location.href = BASE + 'backend/proses/logout.php';
        });
      }
    });
  }

  async function updateStudentSidebarProfile() {
    const side = document.querySelector('aside p.text-center.font-bold');
    const sub = document.querySelector('aside p.text-center.text-sm.mb-6');
    if (!side || !sub) return;

    const prof = await apiJson('backend/data/get_profile.php');
    if (!prof || !prof.success || !prof.siswa) return;

    side.textContent = prof.siswa.nama_siswa || 'Nama Siswa';
    sub.textContent = prof.siswa.kelas ? 'Kelas ' + prof.siswa.kelas : 'Kelas: -';
  }

  window.openTambahModal = function () {
    const modal = document.getElementById('modalTambah') || document.getElementById('modalTambahSiswa');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  };

  window.closeTambahModal = function () {
    const modal = document.getElementById('modalTambah') || document.getElementById('modalTambahSiswa');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  };

  /* ---------- Laporan Pengeluaran ---------- */
  async function initLaporanPengeluaran() {
    const tbody = document.getElementById('tabelPengeluaran');
    if (!tbody) return;

    let rows = [];
    let selectedId = null;

    async function load() {
      const j = await apiJson('backend/data/get_pengeluaran.php');
      if (!j || !j.success) return;
      rows = j.data || [];
      document.getElementById('totalPengeluaran').textContent = formatRupiah(j.total);
      document.getElementById('totalPendidikan').textContent = formatRupiah(j.total_pendidikan);
      document.getElementById('totalSarana').textContent = formatRupiah(j.total_sarana);
      render();
    }

    function render() {
      tbody.innerHTML = '';
      rows.forEach(function (item) {
        const tr = document.createElement('tr');
        tr.innerHTML =
          '<td class="border px-3 py-2">' +
          formatTanggalId(item.tgl_uang) +
          '</td>' +
          '<td class="border px-3 py-2">' +
          (item.kategori || '') +
          '</td>' +
          '<td class="border px-3 py-2">' +
          (item.ket_uang || '') +
          '</td>' +
          '<td class="border px-3 py-2">' +
          formatRupiah(item.jml_uang) +
          '</td>' +
          '<td class="border px-3 py-2 space-x-2">' +
          '<button type="button" class="bg-yellow-400 px-2 py-1 rounded text-xs btn-edit">Edit</button>' +
          '<button type="button" class="bg-red-500 text-white px-2 py-1 rounded text-xs btn-del">Hapus</button>' +
          '</td>';
        tr.querySelector('.btn-edit').onclick = function () {
          openEdit(item);
        };
        tr.querySelector('.btn-del').onclick = function () {
          selectedId = item.id_uang;
          document.getElementById('modalDelete').classList.remove('hidden');
          document.getElementById('modalDelete').classList.add('flex');
        };
        tbody.appendChild(tr);
      });
    }

    function openEdit(item) {
      selectedId = item.id_uang;
      document.getElementById('editTanggal').value = (item.tgl_uang || '').slice(0, 10);
      document.getElementById('editKategori').value = item.kategori || 'Lainnya';
      document.getElementById('editKeterangan').value = item.ket_uang || '';
      document.getElementById('editJumlah').value = item.jml_uang;
      document.getElementById('modalEdit').classList.remove('hidden');
      document.getElementById('modalEdit').classList.add('flex');
    }

    window.openTambahModal = function () {
      document.getElementById('modalTambah').classList.remove('hidden');
      document.getElementById('modalTambah').classList.add('flex');
    };
    window.closeTambahModal = function () {
      document.getElementById('modalTambah').classList.add('hidden');
      document.getElementById('modalTambah').classList.remove('flex');
    };
    window.closeEditModal = function () {
      document.getElementById('modalEdit').classList.add('hidden');
      document.getElementById('modalEdit').classList.remove('flex');
    };
    window.closeDeleteModal = function () {
      document.getElementById('modalDelete').classList.add('hidden');
      document.getElementById('modalDelete').classList.remove('flex');
    };

    window.simpanPengeluaran = async function () {
      const fd = new FormData();
      fd.append('tgl_uang', document.getElementById('tanggal').value);
      fd.append('ket_uang', document.getElementById('keterangan').value);
      fd.append('jml_uang', document.getElementById('jumlah').value);
      fd.append('jenis_uang', 'pengeluaran');
      fd.append('kategori', document.getElementById('kategori').value);
      const r = await fetch(BASE + 'backend/proses/keuangan/tambah_keuangan.php', {
        method: 'POST',
        body: fd,
        credentials: 'same-origin',
      });
      if (r.ok) {
        window.location.reload();
      } else {
        alert('Gagal menyimpan');
      }
    };

    window.updatePengeluaran = async function () {
      const fd = new FormData();
      fd.append('id_uang', selectedId);
      fd.append('tgl_uang', document.getElementById('editTanggal').value);
      fd.append('ket_uang', document.getElementById('editKeterangan').value);
      fd.append('jml_uang', document.getElementById('editJumlah').value);
      fd.append('jenis_uang', 'pengeluaran');
      fd.append('kategori', document.getElementById('editKategori').value);
      const r = await fetch(BASE + 'backend/proses/keuangan/edit_keuangan.php', {
        method: 'POST',
        body: fd,
        credentials: 'same-origin',
      });
      if (r.ok) {
        window.location.reload();
      } else {
        alert('Gagal memperbarui');
      }
    };

    window.hapusPengeluaran = async function () {
      const fd = new FormData();
      fd.append('id_uang', selectedId);
      const r = await fetch(BASE + 'backend/proses/keuangan/hapus_keuangan.php', {
        method: 'POST',
        body: fd,
        credentials: 'same-origin',
      });
      if (r.ok) {
        window.location.reload();
      } else {
        alert('Gagal menghapus');
      }
    };

    window.openEditModal = function () {};
    window.openDeleteModal = function () {};

    document.querySelectorAll('.fixed').forEach(function (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) {
          modal.classList.add('hidden');
          modal.classList.remove('flex');
        }
      });
    });

    load();
  }

    /* ---------- data siswa ---------- */
  async function initTagihanBulanan() {
    const tbody = document.getElementById('tabelTagihan');
    if (!tbody) return;

    let list = [];
    const now = new Date();
    const bulanTagihanText = now.toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric'
    });
    const jatuhTempoText = '10 ' + now.toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric'
    });

    async function load() {
      const j = await apiJson('backend/data/get_siswa.php');
      if (!j || !j.success) return;
      list = j.data || [];
      renderTable(list);
    }

    function renderTable(data) {
      tbody.innerHTML = '';

      // Urutan kelas
      const urutanKelas = {
        'X TKJ': 1,
        'X TSM': 2,
        'X Perhotelan': 3,
        'XI TKJ': 4,
        'XI TSM': 5,
        'XI Perhotelan': 6,
        'XII TKJ': 7,
        'XII TSM': 8,
        'XII Perhotelan': 9
      };

      // Sorting kelas dan nama siswa
      data.sort(function (a, b) {

        const kelasA = urutanKelas[(a.kelas || '').trim()] || 999;
        const kelasB = urutanKelas[(b.kelas || '').trim()] || 999;

        if (kelasA !== kelasB) {
          return kelasA - kelasB;
        }

        return (a.nama_siswa || '')
          .localeCompare(b.nama_siswa || '');
      });

      data.forEach(function (item) {

        const tunggakan = Number(item.jml_tunggakan || 0);

        const statusLabel = tunggakan > 0
          ? '<span class="bg-red-100 text-red-600 px-2 py-1 rounded text-xs">Belum Lunas</span>'
          : '<span class="bg-green-100 text-green-600 px-2 py-1 rounded text-xs">Lunas</span>';

        const amount = formatRupiah(tunggakan);

        const tr = document.createElement('tr');
        tr.className = 'border-b hover:bg-blue-50';

        tr.innerHTML =
          '<td class="py-3">' +
          (item.nama_siswa || '') +
          '</td>' +
          '<td>' +
          (item.kelas || '') +
          '</td>' +
          '<td>' +
          bulanTagihanText +
          '</td>' +
          '<td>' +
          amount +
          '</td>' +
          '<td>' +
          jatuhTempoText +
          '</td>' +
          '<td class="py-3">' +
          statusLabel +
          '<div class="mt-2">' +
          '<button onclick="editStatus(this)" ' +
          'class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs">' +
          '✏️ Edit' +
          '</button>' +
          '</div>' +
          '</td>';

        tbody.appendChild(tr);
      });
    }

    window.cariSiswa = function () {
      const keyword = (document.getElementById('searchInput').value || '').toLowerCase();

      const hasil = list.filter(function (item) {
        return (item.nama_siswa || '').toLowerCase().includes(keyword);
      });

      renderTable(hasil);
    };

    load();
  }

  /* ---------- Data Siswa ---------- */
  async function initDataSiswa() {
    const wrap = document.querySelector('table.min-w-full tbody');
    if (!wrap) return;

    const tambahBtn = document.getElementById('btnTambahSiswa');

    async function load() {
      const j = await apiJson('backend/data/get_siswa.php');
      if (!j || !j.success) return;
      wrap.innerHTML = '';-
      (j.data || []).forEach(function (s) {
        const tr = document.createElement('tr');
        tr.setAttribute('data-id-siswa', s.id_siswa);
        tr.innerHTML =
          '<td class="px-6 py-4">' +
          (s.nama_siswa || '') +
          '</td>' +
          '<td class="px-6 py-4">' +
          (s.kelas || '') +
          '</td>' +
          '<td class="px-6 py-4">' +
          (s.nis || '') +
          '</td>' +
          '<td class="px-6 py-4">' +
          (s.email || s.username || '') +
          '</td>' +
          '<td class="px-6 py-4 text-right">' +
          '<button type="button" class="text-sm border border-blue-300 px-3 py-1 rounded hover:bg-gray-100 btn-edit-siswa">Edit</button>' +
          '</td>';
        tr.querySelector('.btn-edit-siswa').onclick = function () {
          openModal(tr);
        };
        wrap.appendChild(tr);
      });
    }

    let currentRow = null;

    function openModal(row) {
      currentRow = row;
      const cells = row.querySelectorAll('td');
      document.getElementById('nama').value = cells[0].innerText;
      document.getElementById('kelas').value = cells[1].innerText;
      document.getElementById('nis').value = cells[2].innerText;
      document.getElementById('email').value = cells[3].innerText;
      document.getElementById('idSiswaEdit').value = row.getAttribute('data-id-siswa');
      document.getElementById('modalEdit').classList.remove('hidden');
      document.getElementById('modalEdit').classList.add('flex');
    }

    window.closeModal = function () {
      document.getElementById('modalEdit').classList.add('hidden');
      document.getElementById('modalEdit').classList.remove('flex');
    };

    window.closeTambahModal = function () {
      document.getElementById('modalTambah').classList.add('hidden');
      document.getElementById('modalTambah').classList.remove('flex');
    };

    window.openTambahModal = function () {
      document.getElementById('modalTambah').classList.remove('hidden');
      document.getElementById('modalTambah').classList.add('flex');
    };

    if (tambahBtn) {
      tambahBtn.addEventListener('click', openTambahModal);
    }

    window.saveData = async function () {
      const fd = new FormData();
      fd.append('id_siswa', document.getElementById('idSiswaEdit').value);
      fd.append('nama_siswa', document.getElementById('nama').value);
      fd.append('email', document.getElementById('email').value);
      const r = await fetch(BASE + 'backend/proses/siswa/edit_siswa.php', {
        method: 'POST',
        body: fd,
        credentials: 'same-origin',
      });
      if (r.ok) {
        window.closeModal();
        load();
      } else {
        alert('Gagal menyimpan');
      }
    };

    window.hapusSiswa = async function () {
      const fd = new FormData();
      fd.append('id_siswa', document.getElementById('idSiswaEdit').value);
      const r = await fetch(BASE + 'backend/proses/siswa/hapus_siswa.php', {
        method: 'POST',
        body: fd,
        credentials: 'same-origin',
      });
      if (r.ok) {
        window.closeModal();
        load();
      } else {
        alert('Gagal menghapus siswa');
      }
    };

    window.simpanSiswaBaru = async function () {
      const nama = document.getElementById('namaTambah').value;
      const kelas = document.getElementById('kelasTambah').value;
      
      if (!nama || !kelas) {
        alert('Nama dan kelas harus diisi');
        return;
      }

      // Generate NIS 10 digit
      const nis = Math.floor(Math.random() * 9000000000) + 1000000000;
      
      // Generate email dari nama
      const email = nama.toLowerCase().replace(/\s+/g, '') + '@gmail.com';

      // Generate username dari NIS
      const username = nis.toString();

      const fd = new FormData();
      fd.append('nama_siswa', nama);
      fd.append('nis', nis.toString());
      fd.append('kelas', kelas);
      fd.append('email', email);
      fd.append('username', username);
      fd.append('password', 'admin123'); // Default password
      
      const r = await fetch(BASE + 'backend/proses/siswa/tambah_siswa.php', {
        method: 'POST',
        body: fd,
        credentials: 'same-origin',
      });
      
      if (r.ok) {
        document.getElementById('namaTambah').value = '';
        document.getElementById('kelasTambah').value = '';
        window.closeTambahModal();
        load();
      } else {
        alert('Gagal menambahkan siswa');
      }
    };

    window.openModal = openModal;

    document.getElementById('modalEdit').addEventListener('click', function (e) {
      if (e.target === this) {
        window.closeModal();
      }
    });

    document.getElementById('modalTambah').addEventListener('click', function (e) {
      if (e.target === this) {
        window.closeTambahModal();
      }
    });

    load();
  }

  /* ---------- Dashboard Admin ---------- */
  async function initIndexAdmin() {
    const chartEl = document.getElementById('chartKelas');
    if (!chartEl || typeof Chart === 'undefined') return;

    // Load from cache first
    let dash = getCache('dashboard_admin');
    let ch = getCache('chart_kelas');
    let tunggakan = getCache('tunggakan_admin');

    // Display cached data if available
    if (dash) {
      updateDashboardAdmin(dash, ch, tunggakan, chartEl);
    }

    // Then fetch from server
    const dashServer = await apiJson('backend/data/get_dashboard.php');
    const chServer = await apiJson('backend/data/get_chart_kelas.php');
    const tunggakanServer = await apiJson('backend/data/get_tunggakan.php');

    if (dashServer && dashServer.success) {
      dash = dashServer;
      setCache('dashboard_admin', dash);
    }
    if (chServer && chServer.success) {
      ch = chServer;
      setCache('chart_kelas', ch);
    }
    if (tunggakanServer && tunggakanServer.success) {
      tunggakan = tunggakanServer;
      setCache('tunggakan_admin', tunggakan);
    }

    // Update display with latest data
    updateDashboardAdmin(dash, ch, tunggakan, chartEl);
  }

  function updateDashboardAdmin(dash, ch, tunggakan, chartEl) {
    if (!dash) return;

    const boxes = document.querySelectorAll('.grid.grid-cols-1.sm\\:grid-cols-2 > div.bg-blue-50');
    if (boxes.length >= 2) {
      const n0 = boxes[0].querySelector('p.text-2xl');
      const n1 = boxes[1].querySelector('p.text-2xl');
      if (n0) {
        n0.textContent = formatRupiah(dash.total_jml_tunggakan || 0);
      }
      if (n1) {
        n1.textContent = String(dash.total_siswa || 0);
      }
      const sub = boxes[1].querySelector('p.text-gray-800');
      if (sub) {
        sub.textContent = dash.total_tunggakan + ' siswa masih berutang';
      }
    }

    const tunggakanBody = document.getElementById('tabelTunggakanAdmin');
    if (tunggakanBody && tunggakan && tunggakan.success) {
      tunggakanBody.innerHTML = '';
      (tunggakan.data || [])
        .filter(function (t) {
          return Number(t.jml_tunggakan) > 0;
        })
        .slice(0, 12)
        .forEach(function (t) {
          const tr = document.createElement('tr');
          tr.className = 'border-t';
          tr.innerHTML =
            '<td class="px-6 py-4 border-r border-gray-200">' +
            (t.nama_siswa || '') +
            '</td>' +
            '<td class="px-6 py-4">' +
            (t.kelas || '') +
            '</td>';
          tunggakanBody.appendChild(tr);
        });
    }

    if (ch && ch.success) {
      new Chart(chartEl, {
        type: 'bar',
        data: {
          labels: ch.labels,
          datasets: [
            {
              label: 'Jumlah Lunas',
              data: ch.data,
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: true } },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1 },
            },
          },
        },
      });
    }
  }

  /* ---------- Dashboard Siswa ---------- */
  async function initIndexSiswa() {
    await updateStudentSidebarProfile();

    const gridStats = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-4');
    const cards = gridStats ? gridStats.querySelectorAll('h3.text-xl') : [];
    if (cards.length < 4) return;

    // Load from cache first
    let j = getCache('dashboard_siswa');
    if (j) {
      updateDashboardSiswa(j, cards);
    }

    // Then fetch from server
    const jServer = await apiJson('backend/data/get_dashboard_siswa.php');
    if (jServer && jServer.success) {
      j = jServer;
      setCache('dashboard_siswa', j);
      updateDashboardSiswa(j, cards);
    }
  }

  function updateDashboardSiswa(j, cards) {
    const s = j.siswa || {};
    cards[0].textContent = formatRupiah(j.total_tagihan);
    cards[1].textContent = Number(s.jml_tunggakan) > 0 ? 'Belum Lunas' : 'Lunas';
    const jt = s.tgl_jatuh_tempo ? formatTanggalId(s.tgl_jatuh_tempo) : '-';
    cards[2].textContent = jt;
    cards[3].textContent = formatRupiah(j.sisa_tunggakan);

    const bar = document.getElementById('progressBarSPP');
    if (bar) {
      bar.style.width = (j.progress_pct || 0) + '%';
    }
    const pct = document.getElementById('progressLabelSPP');
    if (pct) {
      pct.textContent = (j.progress_pct || 0) + '% pembayaran selesai';
    }

    const idTunEl = document.getElementById('idTunggakanSpp');
    const inpBulan = document.getElementById('inputBulanTagihanSpp');
    const inpJml = document.getElementById('inputJumlahTagihanSpp');
    if (idTunEl && j.siswa && j.siswa.id_tunggakan) {
      idTunEl.value = j.siswa.id_tunggakan;
    }
    if (inpBulan) {
      inpBulan.value = j.siswa.periode_tagihan || '-';
    }
    if (inpJml) {
      inpJml.value = formatRupiah(j.sisa_tunggakan || 0);
    }

    const tb = document.querySelector('table.w-full.text-sm tbody');
    if (tb) {
      tb.innerHTML = '';
      (j.recent || []).forEach(function (r) {
        const tr = document.createElement('tr');
        tr.className = 'border-b';
        tr.innerHTML =
          '<td class="p-2">' +
          (r.bulan || '') +
          '</td>' +
          '<td class="p-2">' +
          formatTanggalId(r.tgl_transaksi) +
          '</td>' +
          '<td class="p-2 text-green-600 font-bold">Lunas</td>' +
          '<td class="p-2">' +
          formatRupiah(r.jml_bayar) +
          '</td>';
        tb.appendChild(tr);
      });
    }

    const ctx = document.getElementById('chartSPP');
    if (ctx && typeof Chart !== 'undefined') {
      const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const data = labels.map(function (_, i) {
        return j.chart_months && j.chart_months[i + 1] ? j.chart_months[i + 1] : 0;
      });
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Pembayaran (Rp)',
              data: data,
              backgroundColor: ['#3b82f6'],
            },
          ],
        },
      });
    }
  }

  window.konfirmasiTransfer = async function () {
    const id = document.getElementById('idTunggakanSpp')?.value;
    if (!id) {
      alert('Data tagihan tidak tersedia.');
      return;
    }
    const fd = new FormData();
    fd.append('id_tunggakan', id);
    fd.append('tgl_transaksi', new Date().toISOString().slice(0, 10));
    const res = await fetch(BASE + 'backend/proses/siswa/konfirmasi_bayar_spp.php', {
      method: 'POST',
      body: fd,
      credentials: 'same-origin',
    });
    if (res.ok) {
      window.location.reload();
    } else {
      alert('Gagal mencatat pembayaran SPP.');
    }
  };

  /* ---------- Tagihan SPP (siswa) — sinkron dengan admin (transaksi → Pembayaran Masuk) ---------- */
  async function initTagihanSpp() {
    await updateStudentSidebarProfile();
    const dash = await apiJson('backend/data/get_dashboard_siswa.php');
    const keg = await apiJson('backend/data/get_tagihan_kegiatan.php');
    const prof = await apiJson('backend/data/get_profile.php');

    if (!dash || !dash.success) {
      return;
    }

    const totalEl = document.getElementById('tagihanTotalValue');
    const statusEl = document.getElementById('tagihanStatusValue');
    const progressEl = document.getElementById('progressPembayaran');
    const now = new Date();
    const currentMonthYear = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const statusMonth = dash.siswa && dash.siswa.periode_tagihan ? dash.siswa.periode_tagihan : currentMonthYear;

    if (totalEl) {
      totalEl.textContent = formatRupiah(dash.sisa_tunggakan || 0);
    }

    const hasTunggakanRow = Boolean(dash.siswa && dash.siswa.id_tunggakan);
    const unpaid = Number(dash.sisa_tunggakan || 0) > 0 || !hasTunggakanRow;
    const paidMonths = new Set(Object.keys(dash.chart_months || {}).map(function (m) {
      return Number(m);
    }));

    if (statusEl) {
      statusEl.textContent = `${statusMonth} ${unpaid ? 'Belum Lunas' : 'Lunas'}`;
    }

    if (progressEl) {
      progressEl.innerHTML = '';
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

      months.forEach(function (label, index) {
        const monthIndex = index + 1;
        const paid = paidMonths.has(monthIndex);
        const item = document.createElement('div');
        const bubble = document.createElement('div');
        bubble.className =
          'w-10 h-10 mx-auto flex items-center justify-center rounded-sm text-xs ' +
          (paid ? 'bg-blue-300 text-white' : 'bg-gray-200 text-gray-400');
        bubble.textContent = paid ? '✔' : '-';
        const labelEl = document.createElement('div');
        labelEl.className = 'mt-4 mb-4';
        labelEl.textContent = label;
        item.appendChild(bubble);
        item.appendChild(labelEl);
        progressEl.appendChild(item);
      });
    }

    const idTunEl = document.getElementById('idTunggakanSpp');
    const inpBulan = document.getElementById('inputBulanTagihanSpp');
    const inpJml = document.getElementById('inputJumlahTagihanSpp');
    if (idTunEl && dash.siswa && dash.siswa.id_tunggakan) {
      idTunEl.value = dash.siswa.id_tunggakan;
    }
    if (inpBulan) {
      inpBulan.value = dash.siswa.periode_tagihan || '-';
    }
    if (inpJml) {
      inpJml.value = formatRupiah(dash.sisa_tunggakan);
    }

    if (prof && prof.siswa) {
      await updateStudentSidebarProfile();
    }

    const tbody = document.getElementById('tbodyKegiatanSpp');
    if (tbody && keg && keg.success) {
      tbody.innerHTML = '';
      (keg.data || []).forEach(function (row) {
        const lunas = row.status === 'lunas';
        const tr = document.createElement('tr');
        tr.className = 'border-t';

        const td1 = document.createElement('td');
        td1.className = 'px-6 py-4';
        td1.textContent = row.nama_kegiatan || '';
        const td2 = document.createElement('td');
        td2.className = 'px-6 py-4';
        td2.textContent = row.kelas_label || '';
        const td3 = document.createElement('td');
        td3.className = 'px-6 py-4';
        td3.innerHTML = lunas
          ? '<span class="bg-green-100 text-green-600 px-2 py-1 rounded text-xs font-semibold">Lunas</span>'
          : '<span class="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-semibold">Belum Lunas</span>';
        const td4 = document.createElement('td');
        td4.className = 'px-6 py-4';
        td4.textContent = formatRupiah(row.jumlah);
        const td5 = document.createElement('td');
        td5.className = 'px-6 py-4';
        td5.textContent = row.tgl_bayar ? formatTanggalId(row.tgl_bayar) : '–';
        const td6 = document.createElement('td');
        td6.className = 'px-6 py-4';

        if (lunas) {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm';
          b.textContent = 'Lihat Kwitansi';
          b.addEventListener('click', function () {
            document.getElementById('kwitansiNama').textContent = row.nama_kegiatan || '';
            document.getElementById('kwitansiTgl').textContent = row.tgl_bayar
              ? formatTanggalId(row.tgl_bayar)
              : '–';
            document.getElementById('kwitansiJml').textContent = formatRupiah(row.jumlah);
            document.getElementById('popupKwitansi').classList.remove('hidden');
            document.getElementById('popupKwitansi').classList.add('flex');
          });
          td6.appendChild(b);
        } else {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm';
          b.textContent = 'Bayar Sekarang';
          b.addEventListener('click', function () {
            document.getElementById('idTagihanKegiatan').value = row.id_tagihan_keg;
            document.getElementById('namaKegiatan').value = row.nama_kegiatan || '';
            document.getElementById('jumlahKegiatan').value = formatRupiah(row.jumlah);
            document.getElementById('popupBayarKegiatan').classList.remove('hidden');
            document.getElementById('popupBayarKegiatan').classList.add('flex');
          });
          td6.appendChild(b);
        }

        tr.appendChild(td1);
        tr.appendChild(td2);
        tr.appendChild(td3);
        tr.appendChild(td4);
        tr.appendChild(td5);
        tr.appendChild(td6);
        tbody.appendChild(tr);
      });
    }

    window.konfirmasiTransfer = async function () {
      const fd = new FormData();
      fd.append('id_tunggakan', document.getElementById('idTunggakanSpp').value);
      fd.append('tgl_transaksi', new Date().toISOString().slice(0, 10));
      const r = await fetch(BASE + 'backend/proses/siswa/konfirmasi_bayar_spp.php', {
        method: 'POST',
        body: fd,
        credentials: 'same-origin',
      });
      if (r.ok) {
        window.location.reload();
      } else {
        alert('Gagal mencatat pembayaran SPP. Pastikan masih ada tunggakan dan Anda sudah login.');
      }
    };

    window.konfirmasiKegiatan = async function () {
      const id = document.getElementById('idTagihanKegiatan').value;
      if (!id) {
        return;
      }
      const fd = new FormData();
      fd.append('id_tagihan_keg', id);
      fd.append('tgl_transaksi', new Date().toISOString().slice(0, 10));
      const r = await fetch(BASE + 'backend/proses/siswa/konfirmasi_bayar_kegiatan.php', {
        method: 'POST',
        body: fd,
        credentials: 'same-origin',
      });
      if (r.ok) {
        window.location.reload();
      } else {
        alert('Gagal mencatat pembayaran kegiatan.');
      }
    };
  }

  /* ---------- Riwayat pembayaran ---------- */
  async function initRiwayat() {
    await updateStudentSidebarProfile();

    // Load from cache first
    let j = getCache('laporan_pembayaran');
    if (j) {
      updateRiwayat(j);
    }

    // Then fetch from server
    const jServer = await apiJson('backend/data/get_laporan_pembayaran.php');
    if (jServer && jServer.success) {
      j = jServer;
      setCache('laporan_pembayaran', j);
      updateRiwayat(j);
    }
  }

  function updateRiwayat(j) {
    const tbody = document.getElementById('tbodyRiwayat');
    if (!tbody) return;

    const rows = (j.data || []).slice().sort(function (a, b) {
      return new Date(b.tgl_transaksi) - new Date(a.tgl_transaksi);
    });

    tbody.innerHTML = '';
    rows.forEach(function (r) {
      const d = new Date((r.tgl_transaksi || '') + 'T00:00:00');
      const bulan = d.toLocaleDateString('id-ID', { month: 'long' });
      const tr = document.createElement('tr');
      tr.className = 'border-t';
      tr.innerHTML =
        '<td class="px-6 py-4">' +
        bulan +
        '</td>' +
        '<td class="px-6 py-4">' +
        formatTanggalId(r.tgl_transaksi) +
        '</td>' +
        '<td class="px-6 py-4">Lunas</td>' +
        '<td class="px-6 py-4">' +
        formatRupiah(r.jml_bayar) +
        '</td>';
      tbody.appendChild(tr);
    });
  }

  /* ---------- Pembayaran masuk ---------- */
  async function initPembayaranMasuk() {
    const tb = document.querySelector('main table tbody');
    if (!tb) return;

    const j = await apiJson('backend/data/get_transaksi.php');
    if (!j || !j.success) return;
    tb.innerHTML = '';
    (j.data || []).forEach(function (r) {
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td class="px-6 py-4 whitespace-nowrap">' +
        (r.nama_siswa || '') +
        '</td>' +
        '<td class="px-6 py-4 whitespace-nowrap">' +
        (r.kelas || '') +
        '</td>' +
        '<td class="px-6 py-4 whitespace-nowrap">' +
        formatTanggalId(r.tgl_transaksi) +
        '</td>' +
        '<td class="px-6 py-4 whitespace-nowrap">' +
        formatRupiah(r.jml_bayar) +
        '</td>' +
        '<td class="px-6 py-4 whitespace-nowrap">' +
        (r.keterangan || '') +
        '</td>';
      tb.appendChild(tr);
    });
  }

  /* ---------- Kepsek dashboard ---------- */
  async function initKepsek() {
    const table = document.getElementById('tabelRingkasan');
    if (!table) return;

    function setSelectOptions(select, values, formatter) {
      if (!select || !Array.isArray(values)) return;
      const currentValue = select.value;
      select.innerHTML = '';
      values.forEach(function (value) {
        const option = document.createElement('option');
        option.value = String(value);
        option.textContent = formatter ? formatter(value) : String(value);
        select.appendChild(option);
      });
      if (currentValue && Array.from(select.options).some(function (opt) { return opt.value === currentValue; })) {
        select.value = currentValue;
      }
    }

    async function load(forceYearMonth) {
      const thn = document.getElementById('filterTahun');
      const bln = document.getElementById('filterBulan');
      const y = thn ? thn.value : 'all';
      const m = bln ? bln.value : 'all';
      const cacheKey = 'ringkasan_kepsek_' + y + '_' + m;
      const yearFilter = y === 'all' ? null : Number(y);
      const monthFilter = m === 'all' ? null : Number(m);

      // Load from cache first
      let j = getCache(cacheKey);
      if (j) {
        updateRingkasan(j, y, m);
      }

      // Then fetch from server
      const jServer = await apiJson('backend/data/get_ringkasan_kepsek.php?tahun=' + y + '&bulan=' + m);
      if (jServer && jServer.success) {
        j = jServer;
        setCache(cacheKey, j);
        updateRingkasan(j, y, m);
      }

      // Also load pemasukan total and merged table rows
      const [jPembayaran, jPengeluaran] = await Promise.all([
        apiJson('backend/data/get_transaksi.php'),
        apiJson('backend/data/get_pengeluaran.php'),
      ]);

      let totalPemasukan = 0;
      let totalPengeluaran = 0;
      let combinedRows = [];

      if (jPembayaran && jPembayaran.success) {
        combinedRows = combinedRows.concat(
          (jPembayaran.data || []).filter(function (item) {
            const d = new Date((item.tgl_transaksi || '') + 'T00:00:00');
            return (yearFilter === null || d.getFullYear() === yearFilter) &&
                   (monthFilter === null || d.getMonth() + 1 === monthFilter);
          }).map(function (item) {
            totalPemasukan += Number(item.jml_bayar || 0);
            return {
              tgl: item.tgl_transaksi,
              deskripsi: item.keterangan || 'Pembayaran Masuk',
              pemasukan: Number(item.jml_bayar || 0),
              pengeluaran: 0,
            };
          })
        );
      }

      if (jPengeluaran && jPengeluaran.success) {
        combinedRows = combinedRows.concat(
          (jPengeluaran.data || []).filter(function (item) {
            const d = new Date((item.tgl_uang || '') + 'T00:00:00');
            return (yearFilter === null || d.getFullYear() === yearFilter) &&
                   (monthFilter === null || d.getMonth() + 1 === monthFilter);
          }).map(function (item) {
            totalPengeluaran += Number(item.jml_uang || 0);
            return {
              tgl: item.tgl_uang,
              deskripsi: (item.kategori || 'Pengeluaran') + (item.ket_uang ? ' - ' + item.ket_uang : ''),
              pemasukan: 0,
              pengeluaran: Number(item.jml_uang || 0),
            };
          })
        );
      }

      renderCombinedTable(combinedRows);

      const elPemasukan = document.getElementById('totalPemasukan');
      const elPengeluaran = document.getElementById('totalPengeluaran');
      const elSaldo = document.getElementById('saldo');
      
      if (elPemasukan) {
        elPemasukan.textContent = formatRupiah(totalPemasukan);
      }
      if (elPengeluaran) {
        elPengeluaran.textContent = formatRupiah(totalPengeluaran);
      }
      if (elSaldo) {
        elSaldo.textContent = formatRupiah(totalPemasukan - totalPengeluaran);
      }
    }

    function renderCombinedTable(rows) {
      table.innerHTML = '';
      rows.sort(function (a, b) {
        return new Date(b.tgl) - new Date(a.tgl);
      }).forEach(function (row) {
        const tr = document.createElement('tr');
        tr.className = 'text-center';
        tr.innerHTML =
          '<td class="px-4 py-2 border">' +
          formatTanggalId(row.tgl) +
          '</td>' +
          '<td class="px-4 py-2 border">' +
          (row.deskripsi || '') +
          '</td>' +
          '<td class="px-4 py-2 border text-green-600">' +
          (row.pemasukan ? formatRupiah(row.pemasukan) : '-') +
          '</td>' +
          '<td class="px-4 py-2 border text-red-600">' +
          (row.pengeluaran ? formatRupiah(row.pengeluaran) : '-') +
          '</td>';
        table.appendChild(tr);
      });
    }

    function updateRingkasan(j, y, m) {
      const title = document.getElementById('judulRingkasan');
      const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      let titleText = 'Ringkasan Keuangan';

      if (typeof m !== 'undefined' && m !== null) {
        if (m === 'all') {
          titleText += ' Semua Bulan';
        } else {
          const monthIndex = Number(m) - 1;
          titleText += ' Bulan ' + (monthNames[monthIndex] || m);
        }
      }
      if (typeof y !== 'undefined' && y !== null) {
        if (y === 'all') {
          titleText += ' Semua Tahun';
        } else {
          titleText += ' Tahun ' + y;
        }
      }
      if (title) {
        title.textContent = titleText;
      }

      if (Array.isArray(j.available_years) && j.available_years.length) {
        setSelectOptions(document.getElementById('filterTahun'), ['all'].concat(j.available_years), function (y) {
          return y === 'all' ? 'Semua' : String(y);
        });
      }
      if (Array.isArray(j.available_months) && j.available_months.length) {
        setSelectOptions(document.getElementById('filterBulan'), ['all'].concat(j.available_months), function (m) {
          if (m === 'all') return 'Semua';
          return monthNames[m - 1] || String(m);
        });
      }
    }

    const thn = document.getElementById('filterTahun');
    if (thn) {
      thn.addEventListener('change', load);
    }
    const bln = document.getElementById('filterBulan');
    if (bln) {
      bln.addEventListener('change', load);
    }

    const btn = document.getElementById('btnTampilkanRingkasan');
    if (btn) {
      btn.addEventListener('click', function () {
        load(true);
      });
    }

    load();
  }

  document.addEventListener('DOMContentLoaded', function () {
    wireLogout();

    const p = location.pathname.split('/').pop() || '';

    if (p === 'Laporan_Pengeluaran.html') {
      initLaporanPengeluaran();
    } else if (p === 'Tagihan_Bulanan.html') {
      initTagihanBulanan();
    } else if (p === 'Data_Siswa.html') {
      initDataSiswa();
    } else if (p === 'index_admin.html') {
      initIndexAdmin();
    } else if (p === 'Index_siswa.html') {
      initIndexSiswa();
    } else if (p === 'Tagihan_Spp.html') {
      initTagihanSpp();
    } else if (p === 'Riwayat_pembayaran.html') {
      initRiwayat();
    } else if (p === 'Bantuan_Siswa.html') {
      initBantuan();
    } else if (p === 'Pembayaran_Masuk.html') {
      initPembayaranMasuk();
    } else if (p === 'index_kepsek.html') {
      initKepsek();
    }
  });

  async function initBantuan() {
    await updateStudentSidebarProfile();
  }
})();
