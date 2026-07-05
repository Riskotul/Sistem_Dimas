<?php
require_once '../../config/database.php';
require_once '../../helpers/session.php';

requireRoleJson('bendahara');

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Metode tidak diizinkan']);
    exit;
}

$kelas_target = trim($_POST['kelas'] ?? '');
$jenis_tagihan = trim($_POST['jenis_tagihan'] ?? '');
$periode_tagihan = trim($_POST['periode_tagihan'] ?? '');

if (empty($kelas_target) || empty($jenis_tagihan) || empty($periode_tagihan)) {
    echo json_encode(['success' => false, 'message' => 'Semua data wajib diisi']);
    exit;
}

$db = getDB();

// Find all students starting with the target class (e.g. 'X' will match 'X TKJ', 'X TSM')
$kelas_like = $kelas_target . '%';
$stmt = $db->prepare("SELECT id_siswa, nama_siswa, kelas FROM siswa WHERE kelas LIKE ?");
$stmt->bind_param("s", $kelas_like);
$stmt->execute();
$res = $stmt->get_result();
$siswa_list = [];
while ($row = $res->fetch_assoc()) {
    $siswa_list[] = $row;
}
$stmt->close();

if (count($siswa_list) === 0) {
    echo json_encode(['success' => false, 'message' => "Tidak ada siswa yang ditemukan untuk kelas $kelas_target"]);
    exit;
}

$count_generated = 0;
$count_skipped = 0;

$tgl_jatuh_tempo = date('Y-m-d', strtotime('+30 days'));

// Prepare statement to check existing bill
if ($jenis_tagihan === 'spp') {
    $check_stmt = $db->prepare("SELECT id_tunggakan FROM tunggakan WHERE id_siswa = ? AND periode_tagihan = ?");
    $insert_stmt = $db->prepare("INSERT INTO tunggakan (id_siswa, nama_siswa, jml_tunggakan, jumlah_tagihan_awal, jenis_tagihan, periode_tagihan, tgl_jatuh_tempo) VALUES (?, ?, ?, ?, ?, ?, ?)");
} else {
    // DSP or Kegiatan
    $check_stmt = $db->prepare("SELECT id_tagihan_keg FROM tagihan_kegiatan WHERE id_siswa = ? AND nama_kegiatan = ?");
    $insert_stmt = $db->prepare("INSERT INTO tagihan_kegiatan (id_siswa, nama_kegiatan, jenis_tagihan, kelas_label, jumlah, sisa_tagihan, status) VALUES (?, ?, ?, ?, ?, ?, 'belum_lunas')");
}

foreach ($siswa_list as $siswa) {
    $id_siswa = (int)$siswa['id_siswa'];
    $nama = $siswa['nama_siswa'];
    $k = $siswa['kelas'];
    
    // Check if bill already exists
    $check_stmt->bind_param("is", $id_siswa, $periode_tagihan);
    $check_stmt->execute();
    $check_stmt->store_result();
    if ($check_stmt->num_rows > 0) {
        $count_skipped++;
        continue;
    }
    
    // Determine amount based on class rules
    $nominal = 0;
    if ($jenis_tagihan === 'spp') {
        $nominal = 100000; // Standar SPP bulanan (atau bisa disesuaikan)
    } elseif ($jenis_tagihan === 'dsp') {
        if (strpos($k, 'X ') === 0) {
            $nominal = 2750000;
        } else {
            $nominal = 1000000;
        }
    } elseif ($jenis_tagihan === 'kegiatan') {
        if (strpos($k, 'XII') === 0) {
            $nominal = 1200000;
        } else {
            $nominal = 500000; // Contoh default jika diterapkan untuk kelas lain
        }
    }
    
    // Insert new bill
    if ($jenis_tagihan === 'spp') {
        $insert_stmt->bind_param("isddsss", $id_siswa, $nama, $nominal, $nominal, $jenis_tagihan, $periode_tagihan, $tgl_jatuh_tempo);
    } else {
        $insert_stmt->bind_param("isssdd", $id_siswa, $periode_tagihan, $jenis_tagihan, $k, $nominal, $nominal);
    }
    
    if ($insert_stmt->execute()) {
        $count_generated++;
    }
}

$check_stmt->close();
$insert_stmt->close();
$db->close();

echo json_encode([
    'success' => true, 
    'message' => "Berhasil memproses tagihan massal. $count_generated tagihan dibuat, $count_skipped dilewati karena sudah ada."
]);
