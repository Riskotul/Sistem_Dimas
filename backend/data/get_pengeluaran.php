<?php
require_once '../config/database.php';
require_once '../helpers/session.php';

if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Belum login']);
    exit;
}

header('Content-Type: application/json');

$db = getDB();

$result = $db->query("
    SELECT id_uang, tgl_uang, ket_uang, jml_uang
    FROM keuangan
    WHERE jenis_uang = 'pengeluaran'
    ORDER BY tgl_uang DESC
");

$rows = [];
while ($row = $result->fetch_assoc()) {
    $rows[] = $row;
}

// Hitung total pengeluaran
$totalResult = $db->query("SELECT COALESCE(SUM(jml_uang),0) AS total FROM keuangan WHERE jenis_uang = 'pengeluaran'");
$totalRow = $totalResult->fetch_assoc();

$db->close();

$user = getLoggedUser();

echo json_encode([
    'success'  => true,
    'user'     => $user,
    'data'     => $rows,
    'total'    => (float)$totalRow['total'],
]);
