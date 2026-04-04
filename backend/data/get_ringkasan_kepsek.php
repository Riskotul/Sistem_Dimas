<?php
require_once '../config/database.php';
require_once '../helpers/session.php';

requireRoleJson('kepala');

header('Content-Type: application/json; charset=utf-8');

$tahun = (int) ($_GET['tahun'] ?? date('Y'));
$bulan = (int) ($_GET['bulan'] ?? date('n'));
if ($bulan < 1 || $bulan > 12) {
    $bulan = (int) date('n');
}

$db = getDB();

$q = $db->prepare(
    "SELECT tgl_uang, ket_uang, jenis_uang, jml_uang
     FROM laporan_keuangan
     WHERE YEAR(tgl_uang) = ? AND MONTH(tgl_uang) = ?
     ORDER BY tgl_uang ASC"
);
$q->bind_param('ii', $tahun, $bulan);
$q->execute();
$res = $q->get_result();

$rows      = [];
$masuk     = 0.0;
$keluar    = 0.0;
$namaBulan = [
    1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April', 5 => 'Mei', 6 => 'Juni',
    7 => 'Juli', 8 => 'Agustus', 9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
];

while ($row = $res->fetch_assoc()) {
    $rows[] = $row;
    if ($row['jenis_uang'] === 'pemasukan') {
        $masuk += (float) $row['jml_uang'];
    } else {
        $keluar += (float) $row['jml_uang'];
    }
}
$q->close();

$db->close();

echo json_encode([
    'success'         => true,
    'tahun'           => $tahun,
    'bulan'           => $bulan,
    'nama_bulan'      => $namaBulan[$bulan] ?? '',
    'rows'            => $rows,
    'total_pemasukan' => $masuk,
    'total_pengeluaran'=> $keluar,
    'saldo'           => $masuk - $keluar,
]);
