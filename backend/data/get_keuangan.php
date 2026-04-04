<?php
require_once '../config/database.php';
require_once '../helpers/session.php';

requireLoginJson();

header('Content-Type: application/json; charset=utf-8');

$jenis = $_GET['jenis'] ?? '';
$db    = getDB();

if (in_array($jenis, ['pemasukan', 'pengeluaran'], true)) {
    $stmt = $db->prepare('SELECT * FROM keuangan WHERE jenis_uang=? ORDER BY tgl_uang DESC');
    $stmt->bind_param('s', $jenis);
    $stmt->execute();
    $result = $stmt->get_result();
} else {
    $result = $db->query('SELECT * FROM keuangan ORDER BY tgl_uang DESC');
}

$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}
$db->close();

echo json_encode(['success' => true, 'data' => $data]);
