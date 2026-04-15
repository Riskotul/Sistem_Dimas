<?php
require_once '../../config/database.php';
require_once '../../helpers/session.php';
requireRole('bendahara');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../../../Data_Siswa.html');
    exit;
}

$id_siswa   = (int) ($_POST['id_siswa'] ?? 0);
$nama_siswa = trim($_POST['nama_siswa'] ?? '');
$email      = trim($_POST['email'] ?? '');

if (!$id_siswa || $nama_siswa === '' || $email === '') {
    header('Location: ../../../Data_Siswa.html?error=Data+tidak+lengkap');
    exit;
}

$db   = getDB();
$stmt = $db->prepare('UPDATE siswa SET nama_siswa=?, email=? WHERE id_siswa=?');
$stmt->bind_param('ssi', $nama_siswa, $email, $id_siswa);
$stmt->execute();
$stmt->close();

$stmt2 = $db->prepare('UPDATE tunggakan SET nama_siswa=? WHERE id_siswa=?');
$stmt2->bind_param('si', $nama_siswa, $id_siswa);
$stmt2->execute();
$stmt2->close();

$stmt3 = $db->prepare('UPDATE transaksi SET nama_siswa=? WHERE id_siswa=?');
$stmt3->bind_param('si', $nama_siswa, $id_siswa);
$stmt3->execute();
$stmt3->close();

$stmt4 = $db->prepare('UPDATE laporan_pembayaran SET nama_siswa=? WHERE id_siswa=?');
$stmt4->bind_param('si', $nama_siswa, $id_siswa);
$stmt4->execute();
$stmt4->close();

$db->close();
header('Location: ../../../Data_Siswa.html?sukses=Data+siswa+berhasil+diperbarui');
exit;
