<?php
// proses/siswa/tambah_siswa.php
// Proses tambah data siswa baru (Bendahara only)

require_once '../../config/database.php';
require_once '../../helpers/session.php';
requireRole('bendahara');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../../../Data_Siswa.html');
    exit;
}

$nama_siswa = trim($_POST['nama_siswa'] ?? '');
$nis        = trim($_POST['nis'] ?? '');
$kelas      = trim($_POST['kelas'] ?? '');
$email      = trim($_POST['email'] ?? '');
$username   = trim($_POST['username'] ?? '');
$password   = trim($_POST['password'] ?? '');

if (empty($nama_siswa) || empty($nis) || empty($kelas) || empty($username) || empty($password)) {
    header('Location: ../../../Data_Siswa.html?error=Semua+field+wajib+diisi');
    exit;
}

$db = getDB();

// Cek NIS duplikat
$cek = $db->prepare("SELECT id_siswa FROM siswa WHERE nis = ?");
$cek->bind_param("s", $nis);
$cek->execute();
$cek->store_result();
if ($cek->num_rows > 0) {
    $cek->close();
    $db->close();
    header('Location: ../../../Data_Siswa.html?error=NIS+sudah+terdaftar');
    exit;
}
$cek->close();

// Buat user terlebih dahulu
$hash = password_hash($password, PASSWORD_BCRYPT);
$stmt_user = $db->prepare("INSERT INTO users (username, password, role) VALUES (?, ?, 'siswa')");
$stmt_user->bind_param("ss", $username, $hash);
$stmt_user->execute();
$id_user = $db->insert_id;
$stmt_user->close();

$emailVal = $email === '' ? '' : $email;

// Buat data siswa
$stmt_siswa = $db->prepare('INSERT INTO siswa (id_user, nama_siswa, nis, kelas, email) VALUES (?, ?, ?, ?, ?)');
$stmt_siswa->bind_param('issss', $id_user, $nama_siswa, $nis, $kelas, $emailVal);
$stmt_siswa->execute();
$id_siswa = $db->insert_id;
$stmt_siswa->close();

// Buat record tunggakan awal default SPP
$defaultTagihan = 100000.00;
$bulanIndo = ['Jan' => 'Januari', 'Feb' => 'Februari', 'Mar' => 'Maret', 'Apr' => 'April', 'May' => 'Mei', 'Jun' => 'Juni', 'Jul' => 'Juli', 'Aug' => 'Agustus', 'Sep' => 'September', 'Oct' => 'Oktober', 'Nov' => 'November', 'Dec' => 'Desember'];
$now     = new DateTime();
$bulanKey = $now->format('M');
$periodeTagihan = ($bulanIndo[$bulanKey] ?? $now->format('F')) . ' ' . $now->format('Y');
$tglJatuhTempo = $now->format('Y-m-10');
$stmt_tngg = $db->prepare("INSERT INTO tunggakan (id_siswa, nama_siswa, jml_tunggakan, periode_tagihan, tgl_jatuh_tempo) VALUES (?, ?, ?, ?, ?)");
$stmt_tngg->bind_param("isdss", $id_siswa, $nama_siswa, $defaultTagihan, $periodeTagihan, $tglJatuhTempo);
$stmt_tngg->execute();
$stmt_tngg->close();

$db->close();
header('Location: ../../../Data_Siswa.html?sukses=Siswa+berhasil+ditambahkan');
exit;
