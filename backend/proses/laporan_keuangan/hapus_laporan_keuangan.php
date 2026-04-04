<?php
require_once '../../config/database.php';
require_once '../../helpers/session.php';
requireRole(['bendahara', 'kepala']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../../../Laporan_Pengeluaran.html');
    exit;
}

$id_lapuang = (int) ($_POST['id_lapuang'] ?? 0);
if (!$id_lapuang) {
    header('Location: ../../../Laporan_Pengeluaran.html?error=ID+tidak+valid');
    exit;
}

$db   = getDB();
$stmt = $db->prepare('SELECT id_kuangan FROM laporan_keuangan WHERE id_lapuang=?');
$stmt->bind_param('i', $id_lapuang);
$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();
$stmt->close();

if ($row && !empty($row['id_kuangan'])) {
    $idu = (int) $row['id_kuangan'];
    $s2  = $db->prepare('DELETE FROM keuangan WHERE id_uang=?');
    $s2->bind_param('i', $idu);
    $s2->execute();
    $s2->close();
} else {
    $s3 = $db->prepare('DELETE FROM laporan_keuangan WHERE id_lapuang=?');
    $s3->bind_param('i', $id_lapuang);
    $s3->execute();
    $s3->close();
}

$db->close();
header('Location: ../../../Laporan_Pengeluaran.html?sukses=Laporan+keuangan+dihapus');
exit;
