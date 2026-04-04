<?php
require_once '../config/database.php';
require_once '../helpers/session.php';

requireRoleJson(['bendahara', 'kepala']);

header('Content-Type: application/json; charset=utf-8');

$db     = getDB();
$result = $db->query('SELECT * FROM laporan_keuangan ORDER BY tgl_uang DESC');
$data   = [];
while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}
$db->close();

echo json_encode(['success' => true, 'data' => $data]);
