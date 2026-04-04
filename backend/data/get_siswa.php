<?php
require_once '../config/database.php';
require_once '../helpers/session.php';

requireRoleJson('bendahara');

header('Content-Type: application/json; charset=utf-8');

$db    = getDB();
$query = 'SELECT s.id_siswa, s.nama_siswa, s.nis, s.kelas, s.email,
                 u.username,
                 IFNULL(t.jml_tunggakan, 0) AS jml_tunggakan
          FROM siswa s
          JOIN users u ON s.id_user = u.id_user
          LEFT JOIN tunggakan t ON s.id_siswa = t.id_siswa
          ORDER BY s.nama_siswa ASC';
$result = $db->query($query);
$data   = [];
while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}
$db->close();

echo json_encode(['success' => true, 'data' => $data]);
