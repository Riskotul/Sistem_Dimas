<?php
/**
 * Siswa konfirmasi transfer SPP → catat transaksi (tampil di Pembayaran Masuk admin).
 */
require_once '../../config/database.php';
require_once '../../helpers/session.php';
require_once '../../helpers/transaksi_helper.php';
requireRole('siswa');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../../../Tagihan_Spp.html');
    exit;
}

$id_tunggakan = (int) ($_POST['id_tunggakan'] ?? 0);
$jml_input    = floatval($_POST['jml_bayar'] ?? 0);
$tgl          = trim($_POST['tgl_transaksi'] ?? date('Y-m-d'));

$user = getLoggedUser();
$db   = getDB();

$stmt = $db->prepare('SELECT id_siswa FROM siswa WHERE id_user = ?');
$stmt->bind_param('i', $user['id_user']);
$stmt->execute();
$res = $stmt->get_result();
$srow = $res->fetch_assoc();
$stmt->close();

if (!$srow) {
    $db->close();
    header('Location: ../../../Tagihan_Spp.html?error=Profil+tidak+ditemukan');
    exit;
}
$id_siswa = (int) $srow['id_siswa'];

if (!$id_tunggakan) {
    $st2 = $db->prepare('SELECT id_tunggakan, jml_tunggakan FROM tunggakan WHERE id_siswa = ? LIMIT 1');
    $st2->bind_param('i', $id_siswa);
    $st2->execute();
    $r2 = $st2->get_result()->fetch_assoc();
    $st2->close();
    if (!$r2) {
        $db->close();
        header('Location: ../../../Tagihan_Spp.html?error=Tidak+ada+tagihan+SPP');
        exit;
    }
    $id_tunggakan = (int) $r2['id_tunggakan'];
    $jml_max      = (float) $r2['jml_tunggakan'];
} else {
    $st2 = $db->prepare('SELECT jml_tunggakan FROM tunggakan WHERE id_tunggakan = ? AND id_siswa = ?');
    $st2->bind_param('ii', $id_tunggakan, $id_siswa);
    $st2->execute();
    $r2 = $st2->get_result()->fetch_assoc();
    $st2->close();
    if (!$r2) {
        $db->close();
        header('Location: ../../../Tagihan_Spp.html?error=Tagihan+tidak+valid');
        exit;
    }
    $jml_max = (float) $r2['jml_tunggakan'];
}

if ($jml_max <= 0) {
    $db->close();
    header('Location: ../../../Tagihan_Spp.html?info=SPP+sudah+lunas');
    exit;
}

$jml_bayar = $jml_input > 0 ? min($jml_input, $jml_max) : $jml_max;

try {
    simpanTransaksiPembayaran($db, $id_siswa, $id_tunggakan, $jml_bayar, $tgl, 'Pembayaran SPP');
} catch (Throwable $e) {
    $db->close();
    header('Location: ../../../Tagihan_Spp.html?error=Gagal+menyimpan');
    exit;
}
$db->close();
header('Location: ../../../Tagihan_Spp.html?sukses=Pembayaran+SPP+dicatat');
exit;
