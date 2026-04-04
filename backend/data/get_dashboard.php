<?php
require_once '../config/database.php';
require_once '../helpers/session.php';

requireRoleJson(['bendahara', 'kepala']);

header('Content-Type: application/json; charset=utf-8');

$db = getDB();

$total_siswa = (int) $db->query('SELECT COUNT(*) as jml FROM siswa')->fetch_assoc()['jml'];

$total_tunggakan = (int) $db->query(
    'SELECT COUNT(*) as jml FROM tunggakan WHERE jml_tunggakan > 0'
)->fetch_assoc()['jml'];

$total_jml_tunggakan = (float) $db->query(
    'SELECT IFNULL(SUM(jml_tunggakan),0) as jml FROM tunggakan'
)->fetch_assoc()['jml'];

$total_pemasukan = (float) $db->query(
    'SELECT IFNULL(SUM(jml_bayar),0) as jml FROM transaksi WHERE MONTH(tgl_transaksi)=MONTH(NOW()) AND YEAR(tgl_transaksi)=YEAR(NOW())'
)->fetch_assoc()['jml'];

$db->close();

echo json_encode([
    'success'                   => true,
    'total_siswa'               => $total_siswa,
    'total_tunggakan'           => $total_tunggakan,
    'total_jml_tunggakan'       => $total_jml_tunggakan,
    'total_pemasukan_bulan_ini' => $total_pemasukan,
]);
