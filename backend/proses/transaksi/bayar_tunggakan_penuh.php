<?php
require_once '../../config/database.php';
require_once '../../helpers/session.php';
require_once '../../helpers/transaksi_helper.php';
requireRole('bendahara');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../../../Tagihan_Bulanan.html');
    exit;
}

$id_tunggakan = (int) ($_POST['id_tunggakan'] ?? 0);
$tgl          = trim($_POST['tgl_transaksi'] ?? date('Y-m-d'));

if (!$id_tunggakan) {
    header('Location: ../../../Tagihan_Bulanan.html?error=Data+tidak+valid');
    exit;
}

$db = getDB();
$stmt = $db->prepare('SELECT id_siswa, jml_tunggakan FROM tunggakan WHERE id_tunggakan=?');
$stmt->bind_param('i', $id_tunggakan);
$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();
$stmt->close();

if (!$row || (float) $row['jml_tunggakan'] <= 0) {
    $db->close();
    header('Location: ../../../Tagihan_Bulanan.html?error=Tidak+ada+tunggakan');
    exit;
}

$id_siswa = (int) $row['id_siswa'];
$jml      = (float) $row['jml_tunggakan'];

try {
    simpanTransaksiPembayaran($db, $id_siswa, $id_tunggakan, $jml, $tgl);
} catch (Throwable $e) {
    $db->close();
    header('Location: ../../../Tagihan_Bulanan.html?error=Gagal+memproses+pembayaran');
    exit;
}
$db->close();
header('Location: ../../../Tagihan_Bulanan.html?sukses=Pembayaran+berhasil');
exit;
