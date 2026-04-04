<?php
require_once '../../config/database.php';
require_once '../../helpers/session.php';
requireRole('bendahara');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method tidak diizinkan']);
    exit;
}

$nama_siswa        = trim($_POST['nama_siswa'] ?? '');
$kelas             = trim($_POST['kelas'] ?? '');
$periode_tagihan   = trim($_POST['periode_tagihan'] ?? '');
$jumlah_tagihan    = floatval($_POST['jumlah_tagihan'] ?? 0);
$tgl_jatuh_tempo   = trim($_POST['tgl_jatuh_tempo'] ?? '');

if ($nama_siswa === '' || $kelas === '' || $periode_tagihan === '' || $jumlah_tagihan <= 0) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Lengkapi semua data dengan benar']);
    exit;
}

if ($tgl_jatuh_tempo === '') {
    $tgl_jatuh_tempo = date('Y-m-d', strtotime('+30 days'));
}

$db = getDB();

$nis      = 'GEN' . substr((string) time(), -8);
$username = 'siswa_' . $nis;
$hash     = password_hash('siswa123', PASSWORD_BCRYPT);

$cek = $db->prepare('SELECT id_user FROM users WHERE username=?');
$cek->bind_param('s', $username);
$cek->execute();
$cek->store_result();
if ($cek->num_rows > 0) {
    $username = 'siswa_' . $nis . '_' . random_int(100, 999);
}
$cek->close();

$stmt_user = $db->prepare("INSERT INTO users (username, password, role) VALUES (?, ?, 'siswa')");
if (!$stmt_user) {
    $db->close();
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Error persiapan query user']);
    exit;
}
$stmt_user->bind_param('ss', $username, $hash);
if (!$stmt_user->execute()) {
    $stmt_user->close();
    $db->close();
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Gagal membuat akun user: ' . $stmt_user->error]);
    exit;
}
$id_user = (int) $db->insert_id;
$stmt_user->close();

$stmt_siswa = $db->prepare('INSERT INTO siswa (id_user, nama_siswa, nis, kelas, email) VALUES (?, ?, ?, ?, NULL)');
if (!$stmt_siswa) {
    $db->close();
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Error persiapan query siswa']);
    exit;
}
$stmt_siswa->bind_param('isss', $id_user, $nama_siswa, $nis, $kelas);
if (!$stmt_siswa->execute()) {
    $stmt_siswa->close();
    $db->close();
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Gagal membuat data siswa: ' . $stmt_siswa->error]);
    exit;
}
$id_siswa = (int) $db->insert_id;
$stmt_siswa->close();

$stmt_t = $db->prepare(
    'INSERT INTO tunggakan (id_siswa, nama_siswa, jml_tunggakan, periode_tagihan, tgl_jatuh_tempo)
     VALUES (?, ?, ?, ?, ?)'
);
if (!$stmt_t) {
    $db->close();
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Error persiapan query tunggakan']);
    exit;
}
$stmt_t->bind_param('isdss', $id_siswa, $nama_siswa, $jumlah_tagihan, $periode_tagihan, $tgl_jatuh_tempo);
if (!$stmt_t->execute()) {
    $stmt_t->close();
    $db->close();
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Gagal menyimpan tagihan: ' . $stmt_t->error]);
    exit;
}
$stmt_t->close();

$db->close();

header('Content-Type: application/json; charset=utf-8');
echo json_encode(['success' => true, 'message' => 'Siswa dan tagihan berhasil tersimpan']);
exit;
