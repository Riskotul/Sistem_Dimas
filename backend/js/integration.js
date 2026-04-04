(function () {
  'use strict';

  const BASE = '';

  async function apiJson(url, options) {
    const r = await fetch(BASE + url, Object.assign({ credentials: 'same-origin' }, options));
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

  /* ---------- Tagihan Bulanan ---------- */
  async function initTagihanBulanan() {
    const tbody = document.getElementById('tabelTagihan');
    if (!tbody) return;

    let list = [];

    async function load() {
      const j = await apiJson('backend/data/get_tunggakan.php');
      if (!j || !j.success) return;
      list = j.data || [];
      renderTable(list);
    }

    function renderTable(data) {
      tbody.innerHTML = '';
      data.forEach(function (item, index) {
        const lunas = Number(item.jml_tunggakan) <= 0;
        const statusLabel = lunas
          ? '<span class="bg-green-100 text-green-600 px-2 py-1 rounded text-xs">Lunas</span>'
          : '<span class="bg-red-100 text-red-600 px-2 py-1 rounded text-xs">Belum Lunas</span>';
        let aksi;
        if (lunas) {
          aksi =
            '<button type="button" class="bg-blue-500 text-white px-3 py-1 rounded text-xs btn-detail" data-i="' +
            index +
            '">Detail</button>';
        } else {
          aksi =
            '<button type="button" class="bg-green-500 text-white px-3 py-1 rounded text-xs btn-bayar" data-id="' +
            item.id_tunggakan +
            '">Bayar</button> ' +
            '<button type="button" class="bg-red-500 text-white px-3 py-1 rounded text-xs btn-hapus" data-id="' +
            item.id_tunggakan +
            '">Hapus</button>';
        }
        const jt = item.tgl_jatuh_tempo ? formatTanggalId(item.tgl_jatuh_tempo) : '';
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
          (item.periode_tagihan || '-') +
          '</td>' +
          '<td>' +
          formatRupiah(item.jml_tunggakan) +
          '</td>' +
          '<td>' +
          jt +
          '</td>' +
          '<td>' +
          statusLabel +
          '</td>' +
          '<td class="space-x-2">' +
          aksi +
          '</td>';
        tbody.appendChild(tr);
      });

      tbody.querySelectorAll('.btn-bayar').forEach(function (btn) {
        btn.onclick = async function () {
          const fd = new FormData();
          fd.append('id_tunggakan', btn.getAttribute('data-id'));
          fd.append('tgl_transaksi', new Date().toISOString().slice(0, 10));
          const r = await fetch(BASE + 'backend/proses/transaksi/bayar_tunggakan_penuh.php', {
            method: 'POST',
            body: fd,
            credentials: 'same-origin',
          });
          if (r.ok) {
            load();
          } else {
            alert('Gagal memproses pembayaran');
          }
        };
      });
      tbody.querySelectorAll('.btn-hapus').forEach(function (btn) {
        btn.onclick = async function () {
          if (!confirm('Yakin ingin menghapus tagihan?')) return;
          const fd = new FormData();
          fd.append('id_tunggakan', btn.getAttribute('data-id'));
          const res = await fetch(BASE + 'backend/proses/tunggakan/hapus_tunggakan.php', {
            method: 'POST',
            body: fd,
            credentials: 'same-origin',
          });
          if (res.ok) {
            load();
          }
        };
      });
      tbody.querySelectorAll('.btn-detail').forEach(function (btn) {
        btn.onclick = function () {
          const i = parseInt(btn.getAttribute('data-i'), 10);
          const d = data[i];
          alert(
            'Detail Tagihan\n\nNama : ' +
              d.nama_siswa +
              '\nKelas : ' +
              d.kelas +
              '\nPeriode : ' +
              (d.periode_tagihan || '-') +
              '\nJumlah : ' +
              formatRupiah(d.jml_tunggakan) +
              '\nStatus : Lunas'
          );
        };
      });
    }

    window.cariSiswa = function () {
      const keyword = (document.getElementById('searchInput').value || '').toLowerCase();
      const hasil = list.filter(function (item) {
        return (item.nama_siswa || '').toLowerCase().includes(keyword);
      });
      renderTable(hasil);
    };

    window.openTambahModal = function () {
      document.getElementById('modalTambahSiswa').classList.remove('hidden');
      document.getElementById('modalTambahSiswa').classList.add('flex');
    };
    window.closeTambahModal = function () {
      document.getElementById('modalTambahSiswa').classList.add('hidden');
      document.getElementById('modalTambahSiswa').classList.remove('flex');
    };

    window.simpanSiswa = async function () {
      const fd = new FormData();
      fd.append('nama_siswa', document.getElementById('namaSiswa').value);
      fd.append('kelas', document.getElementById('kelasSiswa').value);
      fd.append('periode_tagihan', document.getElementById('bulanTagihan').value);
      fd.append('jumlah_tagihan', document.getElementById('jumlahTagihan').value);
      const t = new Date();
      t.setDate(t.getDate() + 10);
      fd.append('tgl_jatuh_tempo', t.toISOString().slice(0, 10));
      const r = await fetch(BASE + 'backend/proses/tagihan/simpan_siswa_tagihan.php', {
        method: 'POST',
        body: fd,
        credentials: 'same-origin',
      });
      
      try {
        const response = await r.text();
        const json = JSON.parse(response);
        
        if (r.ok && json.success) {
          document.getElementById('namaSiswa').value = '';
          document.getElementById('kelasSiswa').value = '';
          document.getElementById('bulanTagihan').value = '';
          document.getElementById('jumlahTagihan').value = '';
          window.closeTambahModal();
          alert('Siswa dan tagihan berhasil ditambahkan');
          load();
        } else {
          alert('Gagal menyimpan: ' + (json.error || 'Terjadi kesalahan'));
        }
      } catch (e) {
        alert('Error: Respons tidak valid atau terjadi kesalahan server');
        console.error('Parse error:', e);
      }
    };

    load();
  }

  /* ---------- Data Siswa ---------- */
  async function initDataSiswa() {
    const wrap = document.querySelector('table.min-w-full tbody');
    if (!wrap) return;

    async function load() {
      const j = await apiJson('backend/data/get_siswa.php');
      if (!j || !j.success) return;
      wrap.innerHTML = '';
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

    window.saveData = async function () {
      const fd = new FormData();
      fd.append('id_siswa', document.getElementById('idSiswaEdit').value);
      fd.append('nama_siswa', document.getElementById('nama').value);
      fd.append('nis', document.getElementById('nis').value);
      fd.append('kelas', document.getElementById('kelas').value);
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

    window.openModal = openModal;

    document.getElementById('modalEdit').addEventListener('click', function (e) {
      if (e.target === this) {
        window.closeModal();
      }
    });

    load();
  }

  /* ---------- Dashboard Admin ---------- */
  async function initIndexAdmin() {
    const chartEl = document.getElementById('chartKelas');
    if (!chartEl || typeof Chart === 'undefined') return;

    const dash = await apiJson('backend/data/get_dashboard.php');
    const ch = await apiJson('backend/data/get_chart_kelas.php');
    if (!dash || !dash.success) return;

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
    if (tunggakanBody && ch && ch.success) {
      tunggakanBody.innerHTML = '';
      const j = await apiJson('backend/data/get_tunggakan.php');
      if (j && j.success) {
        (j.data || [])
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
    const gridStats = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-4');
    const cards = gridStats ? gridStats.querySelectorAll('h3.text-xl') : [];
    if (cards.length < 4) return;

    const j = await apiJson('backend/data/get_dashboard_siswa.php');
    if (!j || !j.success) return;

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

    const prof = await apiJson('backend/data/get_profile.php');
    if (prof && prof.siswa) {
      const side = document.querySelector('aside p.text-center.font-bold');
      const sub = document.querySelector('aside p.text-center.text-sm.mb-6');
      if (side) {
        side.textContent = prof.siswa.nama_siswa || '';
      }
      if (sub) {
        sub.textContent = prof.siswa.kelas || '';
      }
      const hi = document.querySelector('main .bg-white.px-4');
      if (hi) {
        hi.textContent = 'Hai, ' + (prof.siswa.nama_siswa || '');
      }
    }
  }

  /* ---------- Tagihan SPP (siswa) — sinkron dengan admin (transaksi → Pembayaran Masuk) ---------- */
  async function initTagihanSpp() {
    const dash = await apiJson('backend/data/get_dashboard_siswa.php');
    const keg = await apiJson('backend/data/get_tagihan_kegiatan.php');
    const prof = await apiJson('backend/data/get_profile.php');

    if (!dash || !dash.success) {
      return;
    }

    const ring = document.querySelectorAll('.grid.grid-cols-1.sm\\:grid-cols-2 .bg-blue-50 p-8');
    if (ring.length >= 2) {
      ring[0].querySelector('.text-xl').textContent = formatRupiah(dash.total_tagihan);
      ring[1].querySelector('.text-xl').textContent =
        Number(dash.siswa.jml_tunggakan) > 0 ? 'Belum Lunas' : 'Lunas';
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
      const side = document.querySelector('aside p.text-center.font-bold');
      const sub = document.querySelector('aside p.text-center.text-sm.mb-6');
      if (side) {
        side.textContent = prof.siswa.nama_siswa || '';
      }
      if (sub) {
        sub.textContent = prof.siswa.kelas || '';
      }
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
    const j = await apiJson('backend/data/get_laporan_pembayaran.php');
    if (!j || !j.success) return;

    const byYear = {};
    (j.data || []).forEach(function (row) {
      const y = (row.tgl_transaksi || '').slice(0, 4);
      if (!y) return;
      if (!byYear[y]) {
        byYear[y] = [];
      }
      byYear[y].push(row);
    });

    const main = document.querySelector('main.flex-1');
    if (!main) return;

    const tbodies = main.querySelectorAll('table tbody');
    if (tbodies.length < 2) return;

    function fillTable(tbody, rows) {
      tbody.innerHTML = '';
      rows.forEach(function (r) {
        const d = new Date(r.tgl_transaksi + 'T00:00:00');
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

    const years = Object.keys(byYear).sort().reverse();
    const sec = main.querySelectorAll('h3.font-semibold.mb-2.mt-8');
    if (sec[0] && years[0]) {
      sec[0].textContent = years[0];
      fillTable(tbodies[0], byYear[years[0]] || []);
    }
    if (sec[1]) {
      sec[1].textContent = years[1] || (years[0] ? '' : '');
      fillTable(tbodies[1], years[1] ? byYear[years[1]] || [] : []);
    }
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
    const table = document.querySelector('main table.min-w-full.border tbody');
    if (!table) return;

    async function load() {
      const thn = document.getElementById('filterTahun');
      const bln = document.getElementById('filterBulan');
      const y = thn ? parseInt(thn.value, 10) : new Date().getFullYear();
      const m = bln ? parseInt(bln.value, 10) : new Date().getMonth() + 1;
      const j = await apiJson('backend/data/get_ringkasan_kepsek.php?tahun=' + y + '&bulan=' + m);
      if (!j || !j.success) return;

      const title = document.getElementById('judulRingkasan');
      if (title) {
        title.textContent = 'Ringkasan Keuangan Bulan ' + j.nama_bulan + ' ' + j.tahun;
      }

      table.innerHTML = '';
      (j.rows || []).forEach(function (r) {
        const tr = document.createElement('tr');
        tr.className = 'text-center';
        const isIn = r.jenis_uang === 'pemasukan';
        tr.innerHTML =
          '<td class="px-4 py-2 border">' +
          formatTanggalId(r.tgl_uang) +
          '</td>' +
          '<td class="px-4 py-2 border">' +
          (r.ket_uang || '') +
          '</td>' +
          '<td class="px-4 py-2 border text-green-600">' +
          (isIn ? formatRupiah(r.jml_uang) : '-') +
          '</td>' +
          '<td class="px-4 py-2 border text-red-600">' +
          (!isIn ? formatRupiah(r.jml_uang) : '-') +
          '</td>';
        table.appendChild(tr);
      });

      const cards = document.querySelectorAll('.grid.md\\:grid-cols-3 .text-xl.font-bold');
      if (cards.length >= 3) {
        cards[0].textContent = formatRupiah(j.total_pemasukan);
        cards[1].textContent = formatRupiah(j.total_pengeluaran);
        cards[2].textContent = formatRupiah(j.saldo);
      }
    }

    const btn = document.getElementById('btnTampilkanRingkasan');
    if (btn) {
      btn.addEventListener('click', load);
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
    } else if (p === 'Pembayaran_Masuk.html') {
      initPembayaranMasuk();
    } else if (p === 'index_kepsek.html') {
      initKepsek();
    }
  });
})();
