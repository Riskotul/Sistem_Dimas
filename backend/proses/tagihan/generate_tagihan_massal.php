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
$keterangan = trim($_POST['keterangan'] ?? '');
$nominal = floatval($_POST['nominal'] ?? 0);

if (empty($kelas_target) || empty($keterangan) || $nominal <= 0) {
    echo json_encode(['success' => false, 'message' => 'Semua data (termasuk nominal) wajib diisi dengan valid']);
    exit;
}

$db = getDB();

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

$check_stmt = $db->prepare("SELECT id_tagihan_keg FROM tagihan_kegiatan WHERE id_siswa = ? AND nama_kegiatan = ?");
$insert_stmt = $db->prepare("INSERT INTO tagihan_kegiatan (id_siswa, nama_kegiatan, jenis_tagihan, kelas_label, jumlah, sisa_tagihan, status) VALUES (?, ?, 'kegiatan', ?, ?, ?, 'belum_lunas')");

foreach ($siswa_list as $siswa) {
    $id_siswa = (int)$siswa['id_siswa'];
    $k = $siswa['kelas'];
    
    $check_stmt->bind_param("is", $id_siswa, $keterangan);
    $check_stmt->execute();
    $check_stmt->store_result();
    if ($check_stmt->num_rows > 0) {
        $count_skipped++;
        continue;
    }
    
    $insert_stmt->bind_param("issdd", $id_siswa, $keterangan, $k, $nominal, $nominal);
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
