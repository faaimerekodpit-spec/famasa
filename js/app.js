// File: js/app.js

// --- 1. Sistem Navigasi SPA Sederhana ---
function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(el => el.classList.add('d-none'));
    document.getElementById('page-' + pageId).classList.remove('d-none');
    
    // Auto load data saat halaman dibuka
    if(pageId === 'dashboard') loadDashboard();
    if(pageId === 'anggota') loadAnggota();
}

function showPage(pageId) {
 document.querySelectorAll('.page-section').forEach(el => el.classList.add('d-none'));
    document.getElementById('page-' + pageId).classList.remove('d-none');   
    
    // Auto load data saat halaman dibuka
    if(pageId === 'dashboard') loadDashboard();
    if(pageId === 'anggota') loadAnggota();
    if(pageId === 'laporan') loadLaporan(); // TAMBAHAN BARU
}

// Fungsi format rupiah
const formatRp = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
}

// Menampilkan / Menyembunyikan Loading
const toggleLoading = (show) => {
    document.getElementById('loading').classList.toggle('d-none', !show);
}

// --- 2. Fitur Modul Dashboard ---
async function loadDashboard() {
    try {
        const res = await API.get('getDashboard');
        document.getElementById('dash-anggota').innerText = res.totalAnggota || 0;
        document.getElementById('dash-piutang').innerText = formatRp(res.totalPiutang || 0);
        document.getElementById('dash-simpanan').innerText = formatRp(res.totalSimpanan || 0);
        document.getElementById('dash-tagihan').innerText = formatRp(res.tagihanHariIni || 0);
    } catch (e) {
        console.log("Gagal load dashboard", e);
    }
}

// --- 3. Fitur Penagihan Lapangan (Pencarian Anggota) ---
let currentAnggota = null;


// --- FITUR LAPORAN HASIL PENAGIHAN ---
let dataLaporanGlobal = []; // Menyimpan data master agar tidak perlu fetch berulang kali saat filter

async function loadLaporan() {
    toggleLoading(true);
    const tbody = document.getElementById('tableLaporanBody');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted p-3">Memuat data laporan...</td></tr>';
    
    try {
        const res = await API.get('getLaporan');
        dataLaporanGlobal = res; // Simpan ke variabel global
        renderTabelLaporan();    // Panggil fungsi render
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger p-3">Gagal memuat data.</td></tr>';
        console.error(e);
    } finally {
        toggleLoading(false);
    }
}

function renderTabelLaporan() {
    const tbody = document.getElementById('tableLaporanBody');
    const keyword = document.getElementById('filterPencarian').value.toLowerCase();
    const filterJenis = document.getElementById('filterJenis').value;
    
    tbody.innerHTML = '';
    
    let totalSaham = 0;
    let totalNonSaham = 0;
    let totalAngsuran = 0;

    // Filter Data berdasarkan inputan user
    const dataFiltered = dataLaporanGlobal.filter(item => {
        const textMatch = 
            (item.Nama && item.Nama.toLowerCase().includes(keyword)) ||
            (item.No_Buku && item.No_Buku.toString().toLowerCase().includes(keyword)) ||
            (item.Petugas && item.Petugas.toLowerCase().includes(keyword));
        
        const jenisMatch = (filterJenis === "Semua") || (item.Jenis === filterJenis);
        
        return textMatch && jenisMatch;
    });

    if (dataFiltered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted p-3">Tidak ada data transaksi.</td></tr>';
    } else {
        // Cetak Tabel sekaligus Kalkulasi Total
        dataFiltered.forEach(item => {
            const nominal = parseFloat(item.Nominal) || 0;
            
            // Kalkulasi Rekap
            if(item.Jenis === 'Simpanan Saham') totalSaham += nominal;
            if(item.Jenis === 'Simpanan Non Saham') totalNonSaham += nominal;
            if(item.Jenis === 'Angsuran Pinjaman') totalAngsuran += nominal;

            // Penentuan Warna Badge
            let badgeClass = "bg-secondary";
            if(item.Jenis === 'Simpanan Saham') badgeClass = "bg-primary";
            if(item.Jenis === 'Simpanan Non Saham') badgeClass = "bg-success";
            if(item.Jenis === 'Angsuran Pinjaman') badgeClass = "bg-danger";

            // Tambah baris ke tabel
            tbody.innerHTML += `
                <tr>
                    <td>
                        <span class="d-block small fw-bold">${item.Tanggal}</span>
                        <span class="small text-muted">${item.ID}</span>
                    </td>
                    <td>
                        <span class="d-block fw-bold">${item.Nama}</span>
                        <span class="small text-muted">No: ${item.No_Buku}</span>
                    </td>
                    <td><span class="badge ${badgeClass}">${item.Jenis}</span></td>
                    <td class="fw-bold">${formatRp(nominal)}</td>
                    <td class="small text-muted">${item.Petugas}</td>
                </tr>
            `;
        });
    }

    // Perbarui Tampilan Angka Rekap
    const totalKeseluruhan = totalSaham + totalNonSaham + totalAngsuran;
    document.getElementById('rek-saham').innerText = formatRp(totalSaham);
    document.getElementById('rek-nonsaham').innerText = formatRp(totalNonSaham);
    document.getElementById('rek-angsuran').innerText = formatRp(totalAngsuran);
    document.getElementById('rek-total').innerText = formatRp(totalKeseluruhan);
}

// Menambahkan Reset Dropdown pada fungsi searchAnggota()
// Cari fungsi searchAnggota() sebelumnya dan tambahkan kode reset dropdown ini:
async function searchAnggota() {
    const noBuku = document.getElementById('inputNoBuku').value.trim();
    if (!noBuku) return;
    
    toggleLoading(true);
    document.getElementById('panelTransaksi').classList.add('d-none');
    
    // --- RESET FORM SAAT ANGGOTA BARU DICARI ---
    document.getElementById('jenisTransaksi').value = "";
    document.getElementById('wrapperForm').classList.add('d-none');
    resetSemuaInput();
    
    try {
        const res = await API.get('getAnggotaByNoBuku', { no_buku: noBuku });
        if (res.status === 'success') {
            currentAnggota = res.data;
            document.getElementById('infoNama').innerText = currentAnggota.Nama;
            document.getElementById('infoNoBuku').innerText = currentAnggota.No_Buku;
            document.getElementById('infoStatus').innerText = currentAnggota.Status;
            document.getElementById('panelTransaksi').classList.remove('d-none');
            
            Swal.fire({ icon: 'success', title: 'Ditemukan', text: `Anggota: ${currentAnggota.Nama}`, timer: 1500, showConfirmButton: false });
        } else {
            Swal.fire({ icon: 'error', title: 'Oops...', text: 'Data anggota tidak ditemukan!' });
        }
    } catch (e) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Gagal terhubung ke server.' });
    } finally {
        toggleLoading(false);
    }
}

// --- LOGIKA FORM DINAMIS (TAMBAHKAN KODE INI) ---

function resetSemuaInput() {
    // Reset Nilai
    const inputs = ['valWajib', 'valSikap', 'valPokok', 'valBunga', 'valDenda', 'valSibuhar', 'valSisuka', 'valSimapan', 'valSipendik'];
    inputs.forEach(id => document.getElementById(id).value = 0);
    
    // Reset Checkbox
    const checkboxes = ['checkSibuhar', 'checkSisuka', 'checkSimapan', 'checkSipendik'];
    checkboxes.forEach(id => document.getElementById(id).checked = false);
    
    // Sembunyikan Input Non Saham
    const divs = ['divValSibuhar', 'divValSisuka', 'divValSimapan', 'divValSipendik'];
    divs.forEach(id => document.getElementById(id).classList.add('d-none'));

    document.getElementById('valCatatan').value = '';
    document.getElementById('valTotal').innerText = 'Rp 0';
}

function toggleJenisTransaksi() {
    const jenis = document.getElementById('jenisTransaksi').value;
    const wrapper = document.getElementById('wrapperForm');
    
    // Reset & Sembunyikan Semua Section
    resetSemuaInput();
    document.getElementById('section-saham').classList.add('d-none');
    document.getElementById('section-non-saham').classList.add('d-none');
    document.getElementById('section-angsuran').classList.add('d-none');
    
    // Tampilkan Section Berdasarkan Pilihan
    if(jenis !== "") wrapper.classList.remove('d-none');
    if(jenis === 'saham') {
        document.getElementById('section-saham').classList.remove('d-none');
        document.getElementById('labelTotal').innerText = "Total Simpanan Saham";
    }
    else if(jenis === 'non_saham') {
        document.getElementById('section-non-saham').classList.remove('d-none');
        document.getElementById('labelTotal').innerText = "Total Simpanan Non Saham";
    }
    else if(jenis === 'angsuran') {
        document.getElementById('section-angsuran').classList.remove('d-none');
        document.getElementById('labelTotal').innerText = "Total Angsuran";
    }
}

function toggleNonSaham(jenis) {
    const isChecked = document.getElementById(`check${jenis}`).checked;
    const divInput = document.getElementById(`divVal${jenis}`);
    const inputVal = document.getElementById(`val${jenis}`);
    
    if(isChecked) {
        divInput.classList.remove('d-none');
        inputVal.focus();
    } else {
        divInput.classList.add('d-none');
        inputVal.value = 0;
    }
    hitungTotal();
}

// Perbarui Fungsi Hitung Total
function hitungTotal() {
    const jenis = document.getElementById('jenisTransaksi').value;
    let total = 0;
    
    if (jenis === 'saham') {
        const wajib = parseFloat(document.getElementById('valWajib').value) || 0;
        const sikap = parseFloat(document.getElementById('valSikap').value) || 0;
        total = wajib + sikap;
    } 
    else if (jenis === 'non_saham') {
        const sibuhar = parseFloat(document.getElementById('valSibuhar').value) || 0;
        const sisuka = parseFloat(document.getElementById('valSisuka').value) || 0;
        const simapan = parseFloat(document.getElementById('valSimapan').value) || 0;
        const sipendik = parseFloat(document.getElementById('valSipendik').value) || 0;
        total = sibuhar + sisuka + simapan + sipendik;
    } 
    else if (jenis === 'angsuran') {
        const pokok = parseFloat(document.getElementById('valPokok').value) || 0;
        const bunga = parseFloat(document.getElementById('valBunga').value) || 0;
        const denda = parseFloat(document.getElementById('valDenda').value) || 0;
        total = pokok + bunga + denda;
    }
    
    document.getElementById('valTotal').innerText = formatRp(total);
    return total;
}

// Perbarui Fungsi Simpan Penagihan
async function simpanPenagihan() {
    if (!currentAnggota) return;
    
    const jenisTransaksi = document.getElementById('jenisTransaksi').value;
    const total = hitungTotal();
    const catatan = document.getElementById('valCatatan').value;

    if (total <= 0) {
        return Swal.fire({ icon: 'warning', title: 'Perhatian', text: 'Total tagihan harus lebih dari 0!' });
    }

    const confirm = await Swal.fire({
        title: 'Konfirmasi Transaksi',
        text: `Simpan transaksi sebesar ${formatRp(total)} untuk ${currentAnggota.Nama}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Ya, Simpan',
        cancelButtonText: 'Batal'
    });

    if (!confirm.isConfirmed) return;

    toggleLoading(true);
    
    const idTransaksi = "TRX-" + Date.now();
    const tanggal = new Date().toLocaleString('id-ID');
    const petugas = "Petugas Lapangan"; // Ganti dengan sistem auth jika ada
    
    let targetSheet = "";
    let rowData = [];

    // SIAPKAN PAYLOAD BERDASARKAN JENIS TRANSAKSI 
    // Sesuaikan posisi array dengan kolom pada Spreadsheet Anda
    if (jenisTransaksi === 'saham') {
        targetSheet = 'SimpananWajib';
        const wajib = parseFloat(document.getElementById('valWajib').value) || 0;
        const sikap = parseFloat(document.getElementById('valSikap').value) || 0;
        const keterangan = `Wajib: ${wajib}, SIKAP: ${sikap}. Catatan: ${catatan}`;
        // Header Asumsi: ID, Tanggal, No_Buku, Nama, Nominal Total, Keterangan, Petugas
        rowData = [idTransaksi, tanggal, currentAnggota.No_Buku, currentAnggota.Nama, total, keterangan, petugas];
    } 
    else if (jenisTransaksi === 'non_saham') {
        targetSheet = 'SimpananNonSaham';
        let detailJenis = [];
        if(document.getElementById('checkSibuhar').checked) detailJenis.push("Sibuhar: " + document.getElementById('valSibuhar').value);
        if(document.getElementById('checkSisuka').checked) detailJenis.push("Sisuka: " + document.getElementById('valSisuka').value);
        if(document.getElementById('checkSimapan').checked) detailJenis.push("Simapan: " + document.getElementById('valSimapan').value);
        if(document.getElementById('checkSipendik').checked) detailJenis.push("Sipendik: " + document.getElementById('valSipendik').value);
        
        const stringJenis = detailJenis.join(", ");
        // Header Asumsi: ID, Tanggal, No_Buku, Nama, Jenis, Nominal, Petugas, Keterangan
        rowData = [idTransaksi, tanggal, currentAnggota.No_Buku, currentAnggota.Nama, stringJenis, total, petugas, catatan];
    } 
    else if (jenisTransaksi === 'angsuran') {
        targetSheet = 'Piutang';
        const pokok = parseFloat(document.getElementById('valPokok').value) || 0;
        const bunga = parseFloat(document.getElementById('valBunga').value) || 0;
        const denda = parseFloat(document.getElementById('valDenda').value) || 0;
        
        // Header Asumsi: ID, Tanggal, No_Buku, Nama, Pokok, Bunga, Denda, Total, Dibayar, Sisa, Status, Petugas, Catatan
        rowData = [idTransaksi, tanggal, currentAnggota.No_Buku, currentAnggota.Nama, pokok, bunga, denda, total, total, 0, "Lunas", petugas, catatan];
    }

    try {
        const res = await API.post('create', targetSheet, rowData);
        if (res.status === 'success') {
            Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Transaksi berhasil disimpan.', timer: 2000 });
            document.getElementById('panelTransaksi').classList.add('d-none');
            document.getElementById('inputNoBuku').value = '';
        } else {
            Swal.fire({ icon: 'error', title: 'Gagal', text: res.message });
        }
    } catch (e) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Terjadi kesalahan jaringan.' });
    } finally {
        toggleLoading(false);
    }
}







// Inisialisasi awal
document.addEventListener('DOMContentLoaded', () => {
    showPage('dashboard');
});

// --- FITUR TAMBAH ANGGOTA BARU ---
async function simpanAnggota() {
    // Ambil nilai dari input form modal
    const noBuku = document.getElementById('tambahNoBuku').value.trim();
    const nama = document.getElementById('tambahNama').value.trim();
    const nik = document.getElementById('tambahNIK').value.trim() || "-";
    const alamat = document.getElementById('tambahAlamat').value.trim() || "-";
    const telepon = document.getElementById('tambahTelepon').value.trim() || "-";
    const status = document.getElementById('tambahStatus').value;

    if (!noBuku || !nama) {
        return Swal.fire({ icon: 'warning', title: 'Perhatian', text: 'Nomor Buku dan Nama Lengkap wajib diisi!' });
    }

    // Susun array rowData harus persis dengan urutan Header di Sheet 'Anggota'
    // (A: No_Buku, B: Nama, C: NIK, D: Alamat, E: Telepon, F: Status)
    const rowData = [noBuku, nama, nik, alamat, telepon, status];

    // Tutup Modal menggunakan API Bootstrap
    const modalEl = document.getElementById('modalTambahAnggota');
    const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    modal.hide();

    toggleLoading(true);

    try {
        // Kirim data ke Sheet 'Anggota' menggunakan endpoint 'create'
        const res = await API.post('create', 'Anggota', rowData);
        
        if (res.status === 'success') {
            Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Anggota baru telah ditambahkan.', timer: 2000 });
            
            // Kosongkan form input
            document.getElementById('formTambahAnggota').reset();
            
            // Otomatis refresh tabel anggota agar data baru langsung muncul
            loadAnggota(); 
        } else {
            Swal.fire({ icon: 'error', title: 'Gagal', text: res.message });
        }
    } catch (e) {
        Swal.fire({ icon: 'error', title: 'Error Koneksi', text: 'Gagal menyimpan data anggota ke server.' });
    } finally {
        toggleLoading(false);
    }
}