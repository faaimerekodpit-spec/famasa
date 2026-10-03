// File: js/app.js

// --- 1. Sistem Navigasi SPA Sederhana ---
function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(el => el.classList.add('d-none'));
    document.getElementById('page-' + pageId).classList.remove('d-none');
    
    // Auto load data saat halaman dibuka
    if(pageId === 'dashboard') loadDashboard();
    if(pageId === 'anggota') loadAnggota();
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

async function searchAnggota() {
    const noBuku = document.getElementById('inputNoBuku').value.trim();
    if (!noBuku) return;

    toggleLoading(true);
    document.getElementById('panelTransaksi').classList.add('d-none');
    
    try {
        const res = await API.get('getAnggotaByNoBuku', { no_buku: noBuku });
        
        if (res.status === 'success') {
            currentAnggota = res.data;
            document.getElementById('infoNama').innerText = currentAnggota.Nama;
            document.getElementById('infoNoBuku').innerText = currentAnggota.No_Buku;
            document.getElementById('infoStatus').innerText = currentAnggota.Status;
            
            // Tampilkan form transaksi
            document.getElementById('panelTransaksi').classList.remove('d-none');
            
            // Reset input form
            document.getElementById('valPokok').value = 0;
            document.getElementById('valBunga').value = 0;
            document.getElementById('valDenda').value = 0;
            document.getElementById('valCatatan').value = '';
            hitungTotal();
            
            Swal.fire({ icon: 'success', title: 'Ditemukan', text: `Anggota: ${currentAnggota.Nama}`, timer: 1500, showConfirmButton: false });
        } else {
            Swal.fire({ icon: 'error', title: 'Oops...', text: 'Data anggota tidak ditemukan!' });
        }
    } catch (e) {
        Swal.fire({ icon: 'error', title: 'Error Koneksi', text: 'Gagal terhubung ke server.' });
    } finally {
        toggleLoading(false);
    }
}

// --- Kalkulasi Total Penagihan ---
function hitungTotal() {
    const pokok = parseFloat(document.getElementById('valPokok').value) || 0;
    const bunga = parseFloat(document.getElementById('valBunga').value) || 0;
    const denda = parseFloat(document.getElementById('valDenda').value) || 0;
    
    // Validasi negatif
    if (pokok < 0 || bunga < 0 || denda < 0) {
        Swal.fire({ icon: 'warning', title: 'Perhatian', text: 'Nominal tidak boleh negatif!' });
    }
    
    const total = Math.max(0, pokok + bunga + denda);
    document.getElementById('valTotal').innerText = formatRp(total);
    return total;
}

// --- Simpan Penagihan ke Google Sheet ---
async function simpanPenagihan() {
    if (!currentAnggota) return;
    const pokok = parseFloat(document.getElementById('valPokok').value) || 0;
    const bunga = parseFloat(document.getElementById('valBunga').value) || 0;
    const denda = parseFloat(document.getElementById('valDenda').value) || 0;
    const total = hitungTotal();
    const catatan = document.getElementById('valCatatan').value;

    if (total <= 0) {
        return Swal.fire({ icon: 'warning', title: 'Perhatian', text: 'Total tagihan harus lebih dari 0!' });
    }

    // Konfirmasi SweetAlert
    const confirm = await Swal.fire({
        title: 'Konfirmasi Penagihan',
        text: `Terima pembayaran ${formatRp(total)} dari ${currentAnggota.Nama}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Ya, Simpan',
        cancelButtonText: 'Batal'
    });

    if (!confirm.isConfirmed) return;

    toggleLoading(true);
    
    // Data untuk diinsert ke Sheet 'Piutang'
    // Urutan harus sesuai dengan header Sheet: ID_Transaksi, Tanggal, No_Buku, Nama, Pokok, Bunga, Denda, Total, Dibayar, Sisa, Status, Petugas, Catatan
    const idTransaksi = "TRX-" + Date.now();
    const tanggal = new Date().toLocaleString('id-ID');
    const statusPembayaran = "Lunas"; // Logika Sisa bisa dikembangkan
    const petugas = "Petugas Lapangan 1"; // Bisa diambil dari session login nantinya
    
    const rowData = [
        idTransaksi, tanggal, currentAnggota.No_Buku, currentAnggota.Nama,
        pokok, bunga, denda, total, total, 0, statusPembayaran, petugas, catatan
    ];

    try {
        const res = await API.post('create', 'Piutang', rowData);
        if (res.status === 'success') {
            Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Transaksi penagihan tersimpan.', timer: 2000 });
            document.getElementById('panelTransaksi').classList.add('d-none');
            document.getElementById('inputNoBuku').value = '';
        } else {
            Swal.fire({ icon: 'error', title: 'Gagal', text: res.message });
        }
    } catch (e) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Gagal menyimpan transaksi.' });
    } finally {
        toggleLoading(false);
    }
}

// --- 4. Load Tabel Data Anggota ---
async function loadAnggota() {
    toggleLoading(true);
    const tbody = document.getElementById('tableAnggotaBody');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Memuat data...</td></tr>';
    
    try {
        const res = await API.get('getData', { sheetName: 'Anggota' });
        tbody.innerHTML = '';
        
        if(res.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Belum ada data.</td></tr>';
            return;
        }

        res.forEach(item => {
            tbody.innerHTML += `
                <tr>
                    <td class="fw-bold">${item.No_Buku}</td>
                    <td>${item.Nama}</td>
                    <td>${item.Telepon}</td>
                    <td><span class="badge ${item.Status === 'Aktif' ? 'bg-success' : 'bg-danger'}">${item.Status}</span></td>
                </tr>
            `;
        });
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Gagal memuat data.</td></tr>';
    } finally {
        toggleLoading(false);
    }
}

// Inisialisasi awal
document.addEventListener('DOMContentLoaded', () => {
    showPage('dashboard');
});