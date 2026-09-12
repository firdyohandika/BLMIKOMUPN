let inisialisasiAwal = true;
      function bukaHalaman(idHalaman, elemenTombol = null, dariTombolBack = false) {
        const semuaHalaman = document.querySelectorAll('.halaman');
        semuaHalaman.forEach(h => h.classList.remove('aktif'));
        const target = document.getElementById(idHalaman);
        if (target) {
          target.classList.add('aktif');
        }
        window.scrollTo(0, 0);
        if (!dariTombolBack) {
          if (inisialisasiAwal) {
            inisialisasiAwal = false;
          }
          else if (idHalaman !== 'detail-berita') {
            const urlBersih = window.location.origin + window.location.pathname + "#" + idHalaman;
            history.pushState({ halamanID: idHalaman }, "", urlBersih);
          }
        }
      }

      window.addEventListener('popstate', function (event) {
        if (event.state && event.state.halamanID) {
          bukaHalaman(event.state.halamanID, null, true);
        } else {
          bukaHalaman('beranda', null, true);
        }
      });

      function bukaDivisi(idTarget) {
        document.querySelectorAll('.isi-divisi').forEach(div => {
          div.style.display = 'none';
        });
        const target = document.getElementById('divisi-' + idTarget);
        if (target) {
          target.style.display = 'block';
        }
      }

      const SCRIPT_URL_API = 'https://script.google.com/macros/s/AKfycbzEWvh2HM0V-F9g_NjzsnlOibKDx4EPExVRk0irzMspFZSsSbg21Z3dEBzJTVEDhUa_/exec';

      function submitAspirasi(event) {
        event.preventDefault();

        const btn = document.getElementById('btnSubmit');
        if (btn) {
          btn.innerText = "Mengirim...";
          btn.disabled = true;
        }

        const formElement = event.target;
        const formData = new FormData(formElement);
        const urlEncoded = new URLSearchParams(formData);

        fetch(SCRIPT_URL_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: urlEncoded.toString()
        })
          .then(res => res.json())
          .then(hasil => {
            if (btn) {
              btn.innerText = "Kirim Aspirasi Sekarang";
              btn.disabled = false;
            }

            if (hasil.status === "sukses") {
              formElement.reset();
              document.getElementById('teksNomorTiket').innerText = hasil.tiket;
              document.getElementById('suksesModal').classList.remove('hidden');
            } else {
              alert("Gagal: " + hasil.pesan);
            }
          })
          .catch(err => {
            console.error(err);

            if (btn) {
              btn.innerText = "Kirim Aspirasi Sekarang";
              btn.disabled = false;
            }

            alert("Gagal mengirim aspirasi.");
          });
      }

      // LACAK LAPORAN
      function cariLaporan() {
        const nomorTiket = document.getElementById("inputTiket").value.trim().toUpperCase();
        const btn = document.getElementById("btnLacak");
        const wadahHasil = document.getElementById("hasilLacak");

        if (!nomorTiket) {
          alert("Masukkan nomor tiket!");
          return;
        }

        btn.innerHTML = "Mencari...";
        btn.disabled = true;
        wadahHasil.classList.add("hidden");

        fetch(SCRIPT_URL_API + "?action=lacak&tiket=" + nomorTiket)
          .then(res => res.json())
          .then(hasil => {
            btn.innerHTML = "Cari Laporan";
            btn.disabled = false;

            if (hasil.status === "TIDAK_DITEMUKAN") {
              wadahHasil.innerHTML = `
             <div class="text-center py-8">
               <div class="text-red-500 mb-4"><svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
               <h3 class="text-xl font-bold text-gray-900">Tiket Tidak Ditemukan</h3>
               <p class="text-gray-500 mt-2">Pastikan nomor resi benar (contoh: VK-1234).</p>
             </div>`;
            } else {
              const dt = hasil.data;
              let statusWarna = "bg-gray-100 text-gray-700";
              let statusText = dt.status.toLowerCase();

              if (statusText.includes("proses") || statusText.includes("kaji") || statusText.includes("antre")) {
                statusWarna = "bg-yellow-100 text-yellow-700 border border-yellow-200";
              } else if (statusText.includes("selesai") || statusText.includes("tuntas") || statusText.includes(
                "diterima")) {
                statusWarna = "bg-green-100 text-green-700 border border-green-200";
              }

              wadahHasil.innerHTML = `
             <div class="flex justify-between items-start mb-6 pb-6 border-b border-gray-100">
                <div>
                  <p class="text-sm text-gray-500 mb-1">Nomor Tiket</p>
                  <h3 class="text-2xl font-black text-maroon">${dt.tiket}</h3>
                </div>
                <div class="text-right">
                  <span class="inline-block px-4 py-2 rounded-full text-sm font-bold ${statusWarna}">
                    ${dt.status}
                  </span>
                </div>
             </div>
             <div class="mb-6">
                <p class="text-sm text-gray-500 mb-1">Kategori: ${dt.kategori}</p>
                <p class="text-gray-900 font-medium">Tanggal Masuk: ${dt.tanggal}</p>
             </div>
             <div class="bg-gray-50 p-6 rounded-xl border border-gray-100">
                <h4 class="font-bold text-gray-900 mb-2">Tanggapan Parlemen:</h4>
                <p class="text-gray-700 leading-relaxed">${dt.tanggapan}</p>
             </div>
           `;
            }
            wadahHasil.classList.remove("hidden");
          })
          .catch(err => {
            alert("Error server.");
            btn.innerHTML = "Cari Laporan";
            btn.disabled = false;
          });
      }

      let dataDokumenGlobal = [];

      function muatDokumen() {
  const urlParams = new URLSearchParams(window.location.search);
  const paramBerita = urlParams.get('berita');
  const paramDokumen = urlParams.get('dokumen'); // 🟢 Tambahan untuk membaca URL dokumen
  const skrinLoading = document.getElementById('skrin-loading-global');

  // Jika ada parameter Berita atau Dokumen di URL, tampilkan loading screen
  if ((paramBerita || paramDokumen) && skrinLoading) {
    skrinLoading.classList.remove('hidden');
    if (typeof bukaHalaman === 'function') {
      if (paramBerita) bukaHalaman('detail-berita');
      else if (paramDokumen) bukaHalaman('detail-dokumen');
    }
    window.scrollTo({ top: 0 });
  }

  const waktuSekarang = new Date().getTime();
  fetch(SCRIPT_URL_API + "?action=dokumen&t=" + waktuSekarang)
    .then(res => res.json())
    .then(dataMentah => {
      try {
        dataDokumenGlobal = urutkanDataTerbaru(dataMentah);

        if (typeof tampilkanDokumen === 'function') tampilkanDokumen(dataDokumenGlobal);
        if (typeof tampilkanBerita === 'function') tampilkanBerita(dataDokumenGlobal);

        // 🟢 Navigasi otomatis jika URL mengandung ?berita=
        if (paramBerita) {
          const indexDicari = dataDokumenGlobal.findIndex(baris => baris[1] === paramBerita);
          if (indexDicari !== -1) {
            bukaDetailBerita(indexDicari);
          } else {
            if (typeof bukaHalaman === 'function') bukaHalaman('dokumen');
          }
        } 
        // 🟢 Navigasi otomatis jika URL mengandung ?dokumen=
        else if (paramDokumen) {
          const indexDicari = dataDokumenGlobal.findIndex(baris => baris[1] === paramDokumen);
          if (indexDicari !== -1) {
            bukaDetailDokumen(indexDicari);
          } else {
            if (typeof bukaHalaman === 'function') bukaHalaman('dokumen');
          }
        }

      } catch (e) {
        console.error("Error memproses data:", e);
      } finally {
        if (skrinLoading) {
          setTimeout(() => {
            skrinLoading.classList.add('hidden');
          }, 300);
        }
      }
    })
    .catch(err => {
      console.error("Gagal koneksi ke server:", err);
      if (skrinLoading) skrinLoading.classList.add('hidden');
      const wadahKonten = document.getElementById('baca-konten');
      if ((paramBerita || paramDokumen) && wadahKonten) {
        wadahKonten.innerHTML = '<div class="text-center py-20 text-red-500 font-bold">Gagal memuat konten. <br> Mohon periksa koneksi internet Anda.</div>';
      }
    });
}

// 🟢 Mencegah website kembali ke beranda jika URL memiliki parameter 'dokumen'
window.addEventListener("DOMContentLoaded", function () {
  const cekUrlAwal = new URLSearchParams(window.location.search);
  const adaBerita = cekUrlAwal.get('berita');
  const adaDokumen = cekUrlAwal.get('dokumen');

  if (!adaBerita && !adaDokumen) {
    if (typeof bukaHalaman === 'function') {
      bukaHalaman('beranda');
    }
  }
  muatDokumen();
});
      function urutkanDataTerbaru(dataArray) {
        if (!dataArray || dataArray.length === 0) return [];
        let dataSalinan = [...dataArray];
        return dataSalinan.sort(function (a, b) {
          function konversiKeAngka(tglStr) {
            if (!tglStr) return 0;
            const bulanIndo = {
              'januari': 0, 'jan': 0, 'februari': 1, 'feb': 1, 'maret': 2, 'mar': 2,
              'april': 3, 'apr': 3, 'mei': 4, 'juni': 5, 'jun': 5, 'juli': 6, 'jul': 6,
              'agustus': 7, 'agu': 7, 'ags': 7, 'september': 8, 'sep': 8,
              'oktober': 9, 'okt': 9, 'november': 10, 'nov': 10, 'desember': 11, 'des': 11
            };
            let str = tglStr.toString().toLowerCase().trim();
            let bagian = str.split(/\s+/);
            if (bagian.length >= 3) {
              let hari = parseInt(bagian[0]);
              let bulan = bulanIndo[bagian[1]];
              let tahun = parseInt(bagian[2]);
              if (bulan !== undefined && !isNaN(hari) && !isNaN(tahun)) {
                return new Date(tahun, bulan, hari).getTime();
              }
            }
            let hasil = new Date(tglStr).getTime();
            return isNaN(hasil) ? 0 : hasil;
          }
          return konversiKeAngka(b[2]) - konversiKeAngka(a[2]);
        });
      }

      function tampilkanDokumen(dataYangSudahDiurutkan) {
  const wadah = document.getElementById("wadah-dokumen");
  if (!wadah) return;

  if (!dataYangSudahDiurutkan || dataYangSudahDiurutkan.length === 0) {
    wadah.innerHTML = `<div class="text-center py-12 text-gray-500 font-medium">Belum ada dokumen atau rilis diterbitkan.</div>`;
    return;
  }

  let html = '';
  dataYangSudahDiurutkan.forEach((baris, index) => {
    // 🔴 KUNCI: Ambil index asli dari array global
    const originalIndex = dataDokumenGlobal.indexOf(baris); 
    
    const kategori = baris[0] || 'Kategori';
    const judul = baris[1] || 'Tanpa Judul';
    const tanggal = baris[2] || '-';
    const link = baris[3] || '#';
    const fotoMentah = baris[4] || '';

    let fotoURL = fotoMentah;
    if (fotoMentah.includes("drive.google.com")) {
      let fileId = "";
      if (fotoMentah.includes("/d/")) {
        fileId = fotoMentah.split("/d/")[1].split("/")[0].split("?")[0];
      } else if (fotoMentah.includes("id=")) {
        fileId = fotoMentah.split("id=")[1].split("&")[0];
      }
      if (fileId) fotoURL = `https://lh3.googleusercontent.com/d/${fileId}`;
    }

    const elemenFoto = fotoURL ?
      `<img src="${fotoURL}" alt="${judul}" referrerpolicy="no-referrer" class="w-full md:w-[150px] h-[150px] object-cover rounded-3xl flex-shrink-0 border border-gray-100 shadow-sm">` :
      `<div class="w-full md:w-[150px] h-[150px] bg-gray-50 rounded-3xl flex items-center justify-center flex-shrink-0 border border-gray-100"><span class="text-gray-400 text-xs font-medium">Tanpa Foto</span></div>`;

    let aksiTombol = `<button onclick="bukaDetailDokumen(${originalIndex})" class="block w-full md:w-auto text-center px-8 py-3 bg-white border border-[#8B0000] text-[#8B0000] hover:bg-[#8B0000] hover:text-white rounded-full font-bold transition-all duration-300 shadow-sm hover:shadow-md">Baca Dokumen</button>`;
    
    if (kategori.toUpperCase().includes("PRESS") || kategori.toUpperCase().includes("BERITA")) {
      aksiTombol = `<button onclick="bukaDetailBerita(${originalIndex})" class="block w-full md:w-auto text-center px-8 py-3 bg-[#8B0000] border border-[#8B0000] text-white hover:bg-[#600000] rounded-full font-bold transition-all duration-300 shadow-sm hover:shadow-md">Baca Berita</button>`;
    }

    html += `
    <div class="flex flex-col md:flex-row items-start md:items-center gap-6 p-6 md:p-8 hover:bg-red-50/30 transition-colors duration-300">
        ${elemenFoto}
        <div class="flex flex-col flex-grow">
            <div class="mb-3">
                <span class="bg-red-50 text-[#8B0000] text-[11px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-widest">
                    ${kategori}
                </span>
            </div>
            <h3 class="text-xl md:text-2xl font-black text-gray-900 mb-2 leading-tight">${judul}</h3>
            <p class="text-sm text-gray-500 font-medium">Diperbarui : ${tanggal}</p>
        </div>
        <div class="flex-shrink-0 mt-4 md:mt-0 w-full md:w-auto">
            ${aksiTombol}
        </div>
    </div>
    `;
  });
  wadah.innerHTML = html;
}

      function tampilkanBerita(dataYangSudahDiurutkan) {
        const wadah = document.getElementById("wadah-berita");
        if (!wadah) return;

        if (!dataYangSudahDiurutkan || dataYangSudahDiurutkan.length === 0) {
          wadah.innerHTML = `<div class="col-span-full text-center py-8 text-gray-500">Belum ada berita terbaru.</div>`;
          return;
        }

        const khususBerita = dataYangSudahDiurutkan.filter(b =>
          (b[0] || '').toUpperCase().includes("PRESS") || (b[0] || '').toUpperCase().includes("BERITA")
        );

        const beritaTerbaru = khususBerita.slice(0, 3);

        if (beritaTerbaru.length === 0) {
          wadah.innerHTML = `<div class="col-span-full text-center py-8 text-gray-500">Belum ada rilis terbaru.</div>`;
          return;
        }

        let html = '';
        beritaTerbaru.forEach(baris => {
          const originalIndex = dataDokumenGlobal.indexOf(baris);
          const kategori = baris[0] || 'Kategori';
          const judul = baris[1] || 'Tanpa Judul';
          const tanggal = baris[2] || '-';
          const fotoMentah = baris[4] || '';

          let fotoURL = fotoMentah;
          if (fotoMentah.includes("drive.google.com")) {
            let fileId = "";
            if (fotoMentah.includes("/d/")) {
              fileId = fotoMentah.split("/d/")[1].split("/")[0].split("?")[0];
            } else if (fotoMentah.includes("id=")) {
              fileId = fotoMentah.split("id=")[1].split("&")[0];
            }
            if (fileId) fotoURL = `https://lh3.googleusercontent.com/d/${fileId}`;
          }

          const elemenFoto = fotoURL ?
            `<img src="${fotoURL}" alt="${judul}" referrerpolicy="no-referrer" class="w-full h-44 object-cover rounded-xl transition-transform duration-500 group-hover:scale-105">` :
            `<div class="w-full h-44 bg-gray-100 flex items-center justify-center rounded-xl"><span class="text-gray-400 text-xs">Tidak ada foto</span></div>`;

          html += `
    <div onclick="bukaDetailBerita(${originalIndex})" class="cursor-pointer bg-white p-4 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md hover:border-red-200 transition-all duration-300 flex flex-col h-full group">
        <div class="mb-4 rounded-xl overflow-hidden bg-gray-50">
            ${elemenFoto}
        </div>
        <div class="flex flex-col flex-grow px-2 pb-2">
            <div class="mb-3">
                <span class="bg-red-50 text-[#8B0000] text-[10px] font-bold px-2.5 py-1.5 rounded-md uppercase tracking-wider">
                    ${kategori}
                </span>
            </div>
            <h3 class="text-sm md:text-base font-bold text-gray-900 mb-3 line-clamp-2 leading-snug group-hover:text-[#8B0000] transition-colors">${judul}</h3>
            <p class="text-xs text-gray-400 mt-auto font-medium">${tanggal}</p>
        </div>
    </div>
    `;
        });
        wadah.innerHTML = html;
      }

      function bukaDetailBerita(index) {
        const baris = dataDokumenGlobal[index];
        if (!baris) return;

        const kategori = baris[0] || 'Kategori';
        const judul = baris[1] || 'Tanpa Judul';
        const tanggal = baris[2] || '-';
        const konten = baris[5] || 'Teks press release belum ditambahkan di Excel...';
        const penulis = baris[6] || 'Tim Redaksi';
        const sumberFoto = baris[7] || '';

        let fotoMentah = baris[4] || '';
        let fotoURL = 'https://via.placeholder.com/800x400?text=Gambar+Tidak+Tersedia';
        if (fotoMentah.includes("drive.google.com")) {
          let fileId = "";
          if (fotoMentah.includes("/d/")) {
            fileId = fotoMentah.split("/d/")[1].split("/")[0].split("?")[0];
          } else if (fotoMentah.includes("id=")) {
            fileId = fotoMentah.split("id=")[1].split("&")[0];
          }
          if (fileId) fotoURL = `https://lh3.googleusercontent.com/d/${fileId}`;
        } else if (fotoMentah) {
          fotoURL = fotoMentah;
        }

        if (document.getElementById('baca-penulis')) document.getElementById('baca-penulis').innerText = penulis;
        if (document.getElementById('baca-kategori')) document.getElementById('baca-kategori').innerText = kategori;
        if (document.getElementById('baca-tanggal')) document.getElementById('baca-tanggal').innerText = tanggal;
        if (document.getElementById('baca-tanggal-penulis')) document.getElementById('baca-tanggal-penulis').innerText = tanggal;
        if (document.getElementById('baca-judul')) document.getElementById('baca-judul').innerText = judul;
        if (document.getElementById('baca-gambar')) document.getElementById('baca-gambar').src = fotoURL;

        let kontenHTML = konten.replace(/\n/g, '<br><br>');
        kontenHTML = kontenHTML.replace(/^(.*?)\s-\s/gm, '<strong>$1</strong> - ');
        if (document.getElementById('baca-konten')) document.getElementById('baca-konten').innerHTML = kontenHTML;

        const elemenSumber = document.getElementById('sumber-foto');
        if (elemenSumber) {
          if (sumberFoto) {
            elemenSumber.innerText = "Sumber: " + sumberFoto;
            elemenSumber.classList.remove('hidden');
          } else {
            elemenSumber.innerText = '';
            elemenSumber.classList.add('hidden');
          }
        }

        const sidebar = document.getElementById('sidebar-berita');
        if (sidebar) {
          sidebar.innerHTML = '';
          const artikelLain = dataDokumenGlobal.filter((item, i) => i !== index).slice(0, 3);

          if (artikelLain.length === 0) {
            sidebar.innerHTML = '<p class="text-sm text-white/70">Belum ada rilis terkait lainnya.</p>';
          } else {
            artikelLain.forEach(item => {
              const originalIndex = dataDokumenGlobal.indexOf(item);
              let thumb = item[4] || '';
              if (thumb.includes("id=")) thumb = `https://lh3.googleusercontent.com/d/${thumb.split("id=")[1].split("&")[0]}`;
              else if (thumb.includes("/d/")) thumb = `https://lh3.googleusercontent.com/d/${thumb.split("/d/")[1].split("/")[0].split("?")[0]}`;

              sidebar.innerHTML += `
              <div onclick="bukaDetailBerita(${originalIndex})" class="group cursor-pointer flex gap-4 items-center bg-white/5 p-3 rounded-xl hover:bg-white/10 transition-colors">
                  <div class="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-white/10">
                      <img src="${thumb || fotoURL}" class="w-full h-full object-cover group-hover:scale-110 transition-transform">
                  </div>
                  <div>
                      <span class="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded text-white mb-1 inline-block">${item[0]}</span>
                      <h4 class="text-sm font-semibold text-white line-clamp-2 group-hover:text-red-200">${item[1]}</h4>
                  </div>
              </div>
              `;
            });
          }
        }
        try {
          const paramJudul = encodeURIComponent(judul);
          const basePath = window.location.href.split('?')[0].split('#')[0];
          const urlBaru = basePath + "?berita=" + paramJudul;
          window.history.pushState({ path: urlBaru }, '', urlBaru);
        } catch (e) {
          console.error("Gagal mengubah URL:", e);
        }
        if (typeof bukaHalaman === 'function') {
          bukaHalaman('detail-berita');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }


      function shareBerita(platform) {
        const judul = document.getElementById('baca-judul').innerText;
        const baseURL = window.location.origin + window.location.pathname;
        const linkURL = baseURL + "?berita=" + encodeURIComponent(judul);

        if (platform === 'wa') {
          const pesan = `Baca Press Release Parlemen Vaktavya:\n*${judul}*\n\n${linkURL}`;
          window.open(`https://wa.me/?text=${encodeURIComponent(pesan)}`, '_blank');
        }
        else if (platform === 'fb') {
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(linkURL)}`, '_blank');
        }
        else if (platform === 'twitter') {
          const pesan = `Baca: ${judul}`;
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(pesan)}&url=${encodeURIComponent(linkURL)}`, '_blank');
        }
        else if (platform === 'copy') {
          navigator.clipboard.writeText(linkURL).then(() => {
            tampilkanToast();
          }).catch(err => {
            console.error("Gagal menyalin link: ", err);
          });
        }
      }

      function tampilkanToast() {
        const toast = document.getElementById('toast-copy');
        if (toast) {
          toast.classList.remove('opacity-0', 'translate-y-5');
          toast.classList.add('opacity-100', 'translate-y-0');

          setTimeout(() => {
            toast.classList.remove('opacity-100', 'translate-y-0');
            toast.classList.add('opacity-0', 'translate-y-5');
          }, 3000);
        }
      }

      window.addEventListener("DOMContentLoaded", function () {
        const cekUrlAwal = new URLSearchParams(window.location.search);
        if (!cekUrlAwal.get('berita')) {
          if (typeof bukaHalaman === 'function') {
            bukaHalaman('beranda');
          }
        }
        muatDokumen();
      });

      function tutupModal() {
        document.getElementById("suksesModal").classList.add("hidden");
      }

      function salinResiModal() {
        const teksResi = document.getElementById('teksNomorTiket').innerText;
        const btnSalin = document.getElementById('btnSalin');

        const inputDummy = document.createElement("textarea");
        inputDummy.value = teksResi;
        document.body.appendChild(inputDummy);
        inputDummy.select();

        try {
          var berhasil = document.execCommand('copy');
          if (berhasil) {
            btnSalin.classList.remove('bg-red-50', 'text-maroon', 'hover:bg-maroon', 'hover:text-white');
            btnSalin.classList.add('bg-green-600', 'text-white');

            setTimeout(function () {
              btnSalin.classList.remove('bg-green-600', 'text-white');
              btnSalin.classList.add('bg-red-50', 'text-maroon', 'hover:bg-maroon', 'hover:text-white');
            }, 2000);
          } else {
            alert("Gagal menyalin otomatis.");
          }
        } catch (err) {
          alert("Browser Anda tidak mendepung salin otomatis.");
        }
        document.body.removeChild(inputDummy);
      }

      function lacakLangsungModal() {
        const resiBaru = document.getElementById('teksNomorTiket').innerText;
        document.getElementById('suksesModal').classList.add('hidden');
        bukaHalaman('lacak-laporan');

        setTimeout(() => {
          const inputLacak = document.getElementById('inputTiket');
          if (inputLacak) {
            inputLacak.value = resiBaru;
            inputLacak.focus();
          }
        }, 150);
      }

      function toggleMenuHP() {
        const menu = document.getElementById('menuHP');
        if (menu.classList.contains('hidden')) {
          menu.classList.remove('hidden');
          menu.classList.add('flex');
        } else {
          menu.classList.add('hidden');
          menu.classList.remove('flex');
        }
      }

      document.addEventListener('DOMContentLoaded', () => {
        const slider = document.getElementById('slider-profil');
        if (!slider) return;

        let isDown = false;
        let startX;
        let scrollLeft;

        slider.addEventListener('mousedown', (e) => {
          isDown = true;
          slider.style.cursor = 'grabbing';
          slider.style.scrollSnapType = 'none';
          startX = e.pageX - slider.offsetLeft;
          scrollLeft = slider.scrollLeft;
        });
        slider.addEventListener('mouseleave', () => {
          isDown = false;
          slider.style.cursor = 'grab';
          slider.style.scrollSnapType = 'x mandatory';
        });
        slider.addEventListener('mouseup', () => {
          isDown = false;
          slider.style.cursor = 'grab';
          slider.style.scrollSnapType = 'x mandatory';
        });
        slider.addEventListener('mousemove', (e) => {
          if (!isDown) return;
          e.preventDefault();
          const x = e.pageX - slider.offsetLeft;
          const walk = (x - startX) * 1.5;
          slider.scrollLeft = scrollLeft - walk;
        });
      });

      let posisiSlideSaatIni = 0;

      function geserSlide(arah) {
        const track = document.getElementById('slider-track');
        const jumlahSlide = track.children.length;

        posisiSlideSaatIni += arah;

        if (posisiSlideSaatIni >= jumlahSlide) {
          posisiSlideSaatIni = 0;
        } else if (posisiSlideSaatIni < 0) {
          posisiSlideSaatIni = jumlahSlide - 1;
        }

        track.style.transform = `translateX(-${posisiSlideSaatIni * 100}%)`;
      }
      const swiperProfil = new Swiper('.slider-profil', {
        slidesPerView: 'auto',
        spaceBetween: 24,
        grabCursor: true,
        freeMode: true,
      });

      function bukaDenganIntro(idTarget, urlLogo, namaDivisi) {
        const introAnimasi = document.getElementById('intro-animasi');
        const introLogo = document.getElementById('intro-logo');
        const introTeks = document.getElementById('intro-teks');


        introLogo.src = urlLogo;
        introTeks.innerText = namaDivisi;


        introAnimasi.classList.remove('opacity-0', 'pointer-events-none');
        introAnimasi.classList.add('opacity-100');


        introLogo.classList.remove('scale-50');
        introLogo.classList.add('scale-100');


        introTeks.classList.remove('opacity-0');
        introTeks.classList.add('opacity-100');

        setTimeout(() => {

          bukaHalaman('kepengurusan');
          bukaDivisi(idTarget);

          window.scrollTo(0, 0);

          introAnimasi.classList.remove('opacity-100');
          introAnimasi.classList.add('opacity-0', 'pointer-events-none');

          introLogo.classList.remove('scale-100');
          introLogo.classList.add('scale-50');
          introTeks.classList.remove('opacity-100');
          introTeks.classList.add('opacity-0');

        }, 1500);
      }

      window.addEventListener('hashchange', () => {
        const hash = window.location.hash.replace('#', '');
        if (hash) {
          bukaHalaman(hash);
          updateGarisMerahNavbar(hash);
        }
      });

document.addEventListener("DOMContentLoaded", () => {
  const counters = document.querySelectorAll(".counter");
  const speed = 150;

  const animateCounter = (counter) => {
    const target = +counter.getAttribute("data-target");
    const current = +counter.innerText;
    const increment = target / speed;

    if (current < target) {
      counter.innerText = Math.ceil(current + increment);
      requestAnimationFrame(() => animateCounter(counter));
    } else {
      counter.innerText = target;
    }
  };
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => observer.observe(counter));
});
function convertDriveLinkToPreview(linkAsli) {
  if (!linkAsli) return "";
  // Ubah format view GDrive menjadi format iframe preview
  if (linkAsli.includes('/preview')) return linkAsli;
  return linkAsli.replace(/\/view.*$/, '/preview');
}

let currentJudulDokumen = ""; 

function bukaDetailDokumen(index) {
  const baris = dataDokumenGlobal[index];
  if (!baris) return;

  const kategori = baris[0] || 'DOKUMEN';
  const judul = baris[1] || 'Tanpa Judul';
  const tanggal = baris[2] || '-';
  const linkGdriveAsli = baris[3] || '#';
  const penulis = baris[6] || 'Tim Legal'; // Membaca kolom ke-7 dari Excel, default ke Tim Legal

  currentJudulDokumen = judul; 

  const linkPreview = linkGdriveAsli.includes('/preview') 
    ? linkGdriveAsli 
    : linkGdriveAsli.replace(/\/view.*$/, '/preview');

  // Isi teks ke HTML
  if (document.getElementById('dokumen-penulis')) document.getElementById('dokumen-penulis').innerText = penulis;
  if (document.getElementById('dokumen-kategori')) document.getElementById('dokumen-kategori').innerText = kategori;
  if (document.getElementById('dokumen-tanggal')) document.getElementById('dokumen-tanggal').innerText = tanggal;
  if (document.getElementById('dokumen-tanggal-penulis')) document.getElementById('dokumen-tanggal-penulis').innerText = tanggal;
  if (document.getElementById('dokumen-judul')) document.getElementById('dokumen-judul').innerText = judul;

  // Render iframe GDrive
  const loadingSket = document.getElementById('dokumen-iframe-loading');
  if (loadingSket) loadingSket.classList.remove('hidden', 'opacity-0');
  if (document.getElementById('dokumen-iframe')) document.getElementById('dokumen-iframe').src = linkPreview;

  // --- LOGIKA SIDEBAR SAMA PERSIS SEPERTI BERITA ---
  const sidebar = document.getElementById('sidebar-dokumen');
  if (sidebar) {
    sidebar.innerHTML = '';
    // Ambil 3 data terbaru selain dokumen yang sedang dibuka
    const dokumenLain = dataDokumenGlobal.filter((item, i) => i !== index).slice(0, 3);

    if (dokumenLain.length === 0) {
      sidebar.innerHTML = '<p class="text-sm text-white/70">Belum ada dokumen terkait lainnya.</p>';
    } else {
      dokumenLain.forEach(item => {
        const originalIndex = dataDokumenGlobal.indexOf(item);
        
        // Pengecekan cerdas: jika yang diklik di sidebar adalah Press Release, panggil fungsi berita. Jika Dokumen Hukum, panggil fungsi dokumen.
        const isKategoriBerita = item[0].toUpperCase().includes('BERITA') || item[0].toUpperCase().includes('PRESS');
        const fungsiKlik = isKategoriBerita ? `bukaDetailBerita(${originalIndex})` : `bukaDetailDokumen(${originalIndex})`;
        
        let thumb = item[4] || ''; // Gunakan Thumbnail GDrive jika ada
        let fotoURL = 'https://via.placeholder.com/100x100?text=Dok';
        if (thumb.includes("id=")) fotoURL = `https://lh3.googleusercontent.com/d/${thumb.split("id=")[1].split("&")[0]}`;
        else if (thumb.includes("/d/")) fotoURL = `https://lh3.googleusercontent.com/d/${thumb.split("/d/")[1].split("/")[0].split("?")[0]}`;

        sidebar.innerHTML += `
        <div onclick="${fungsiKlik}" class="group cursor-pointer flex gap-4 items-center bg-white/5 p-3 rounded-xl hover:bg-white/10 transition-colors">
            <div class="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-white/10 flex items-center justify-center">
                <img src="${fotoURL}" class="w-full h-full object-cover group-hover:scale-110 transition-transform">
            </div>
            <div>
                <span class="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded text-white mb-1 inline-block">${item[0]}</span>
                <h4 class="text-sm font-semibold text-white line-clamp-2 group-hover:text-red-200">${item[1]}</h4>
            </div>
        </div>
        `;
      });
    }
  }

  // Update URL untuk Share Link
  try {
    const paramJudul = encodeURIComponent(judul);
    const basePath = window.location.href.split('?')[0].split('#')[0];
    const urlBaru = basePath + "?dokumen=" + paramJudul;
    window.history.pushState({ path: urlBaru }, '', urlBaru);
  } catch (e) {
    console.error("Gagal mengubah URL:", e);
  }

  if (typeof bukaHalaman === 'function') bukaHalaman('detail-dokumen');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hilangkanLoadingIframe() {
  const loadingSket = document.getElementById('dokumen-iframe-loading');
  if(loadingSket) {
      loadingSket.classList.add('opacity-0');
      setTimeout(() => loadingSket.classList.add('hidden'), 500);
  }
}

// Fungsi Share Dokumen ke Semua Platform (dilengkapi pengamanan Copy)
function shareDokumen(platform) {
  const judul = document.getElementById('dokumen-judul').innerText;
  const baseURL = window.location.origin + window.location.pathname;
  const linkURL = baseURL + "?dokumen=" + encodeURIComponent(judul);

  if (platform === 'wa') {
    const pesan = `Baca Dokumen Resmi Parlemen Vaktavya:\n*${judul}*\n\n${linkURL}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(pesan)}`, '_blank');
  } 
  else if (platform === 'fb') {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(linkURL)}`, '_blank');
  } 
  else if (platform === 'twitter') {
    const pesan = `Baca Dokumen: ${judul}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(pesan)}&url=${encodeURIComponent(linkURL)}`, '_blank');
  } 
  else if (platform === 'copy') {
    // Memastikan salin link berhasil 100% tanpa error
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(linkURL).then(() => {
        if (typeof tampilkanToast === 'function') tampilkanToast();
        else alert("Tautan berhasil disalin!");
      }).catch(() => salinManual(linkURL));
    } else {
      salinManual(linkURL);
    }
  }
}

function salinManual(teks) {
  const areaInput = document.createElement("textarea");
  areaInput.value = teks;
  document.body.appendChild(areaInput);
  areaInput.select();
  try {
    document.execCommand('copy');
    if (typeof tampilkanToast === 'function') tampilkanToast();
    else alert("Tautan berhasil disalin!");
  } catch (err) {
    alert("Gagal menyalin tautan.");
  }
  document.body.removeChild(areaInput);
}

function hilangkanLoadingIframe() {
    const loadingSket = document.getElementById('dokumen-iframe-loading');
    if(loadingSket) {
        loadingSket.classList.add('opacity-0');
        setTimeout(() => loadingSket.classList.add('hidden'), 500);
    }
}