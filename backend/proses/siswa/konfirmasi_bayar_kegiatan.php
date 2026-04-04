<?php
/**
 * Siswa konfirmasi transfer kegiatan khusus → transaksi + update tagihan_kegiatan.
 */
require_once '../../config/database.php';
require_once '../../helpers/session.php';
require_once '../../helpers/transaksi_helper.php';
requireRole('siswa');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../../../Tagihan_Spp.html');
    exit;
}

$id_tagihan_keg = (int) ($_POST['id_tagihan_keg'] ?? 0);
$tgl            = trim($_POST['tgl_transaksi'] ?? date('Y-m-d'));

if (!$id_tagihan_keg) {
    header('Location: ../../../Tagihan_Spp.html?error=Data+tidak+valid');
    exit;
}

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

$st = $db->prepare(
    'SELECT nama_kegiatan, jumlah, status FROM tagihan_kegiatan WHERE id_tagihan_keg = ? AND id_siswa = ?'
);
$st->bind_param('ii', $id_tagihan_keg, $id_siswa);
$st->execute();
$row = $st->get_result()->fetch_assoc();
$st->close();

if (!$row) {
    $db->close();
    header('Location: ../../../Tagihan_Spp.html?error=Tagihan+tidak+ditemukan');
    exit;
}
if ($row['status'] === 'lunas') {
    $db->close();
    header('Location: ../../../Tagihan_Spp.html?info=Sudah+lunas');
    exit;
}

$nama_keg = $row['nama_kegiatan'];
$jumlah   = (float) $row['jumlah'];
$ket      = 'Kegiatan: ' . $nama_keg;

try {
    $db->begin_transaction();
    $id_trx = simpanTransaksiPembayaran($db, $id_siswa, null, $jumlah, $tgl, $ket);
    $up = $db->prepare(
        'UPDATE tagihan_kegiatan SET status = \'lunas\', tgl_bayar = ?, id_transaksi = ? WHERE id_tagihan_keg = ? AND id_siswa = ?'
    );
    $up->bind_param('siii', $tgl, $id_trx, $id_tagihan_keg, $id_siswa);
    $up->execute();
    $up->close();
    $db->commit();
} catch (Throwable $e) {
    $db->rollback();
    $db->close();
    header('Location: ../../../Tagihan_Spp.html?error=Gagal+menyimpan');
    exit;
}
$db->close();
header('Location: ../../../Tagihan_Spp.html?sukses=Pembayaran+kegiatan+dicatat');
exit;
