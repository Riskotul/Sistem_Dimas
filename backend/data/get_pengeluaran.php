<?php
require_once '../config/database.php';
require_once '../helpers/session.php';

requireRoleJson('bendahara');

header('Content-Type: application/json; charset=utf-8');

$db = getDB();

$result = $db->query(
    "SELECT id_uang, tgl_uang, ket_uang, jml_uang, kategori
     FROM keuangan
     WHERE jenis_uang = 'pengeluaran'
     ORDER BY tgl_uang DESC"
);

$rows = [];
while ($row = $result->fetch_assoc()) {
    $rows[] = $row;
}

$totalResult = $db->query("SELECT COALESCE(SUM(jml_uang),0) AS total FROM keuangan WHERE jenis_uang = 'pengeluaran'");
$totalRow    = $totalResult->fetch_assoc();

$tp = (float) $db->query(
    "SELECT COALESCE(SUM(jml_uang),0) AS t FROM keuangan WHERE jenis_uang='pengeluaran' AND kategori='Pengeluaran Pendidikan'"
)->fetch_assoc()['t'];
$ts = (float) $db->query(
    "SELECT COALESCE(SUM(jml_uang),0) AS t FROM keuangan WHERE jenis_uang='pengeluaran' AND kategori='Pengeluaran Sarana'"
)->fetch_assoc()['t'];
$ta = (float) $db->query(
    "SELECT COALESCE(SUM(jml_uang),0) AS t FROM keuangan WHERE jenis_uang='pengeluaran' AND kategori='ATK'"
)->fetch_assoc()['t'];

$db->close();

$user = getLoggedUser();

echo json_encode([
    'success'            => true,
    'user'               => $user,
    'data'               => $rows,
    'total'              => (float) $totalRow['total'],
    'total_pendidikan'   => $tp,
    'total_sarana'       => $ts,
    'total_atk'          => $ta,
]);
