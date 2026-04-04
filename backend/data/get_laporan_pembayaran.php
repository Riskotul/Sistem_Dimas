<?php
require_once '../config/database.php';
require_once '../helpers/session.php';

requireLoginJson();

header('Content-Type: application/json; charset=utf-8');

$user = getLoggedUser();
$db   = getDB();

if ($user['role'] === 'siswa') {
    $cek = $db->prepare('SELECT id_siswa FROM siswa WHERE id_user=?');
    $cek->bind_param('i', $user['id_user']);
    $cek->execute();
    $cek->bind_result($id_siswa_login);
    $cek->fetch();
    $cek->close();

    $stmt = $db->prepare(
        'SELECT lp.id_lapbayar, lp.nama_siswa, lp.jml_bayar, lp.tgl_transaksi, s.kelas
         FROM laporan_pembayaran lp
         JOIN siswa s ON lp.id_siswa = s.id_siswa
         WHERE lp.id_siswa = ?
         ORDER BY lp.tgl_transaksi DESC'
    );
    $stmt->bind_param('i', $id_siswa_login);
    $stmt->execute();
    $result = $stmt->get_result();
} else {
    $result = $db->query(
        'SELECT lp.id_lapbayar, lp.nama_siswa, lp.jml_bayar, lp.tgl_transaksi, s.kelas
         FROM laporan_pembayaran lp
         JOIN siswa s ON lp.id_siswa = s.id_siswa
         ORDER BY lp.tgl_transaksi DESC'
    );
}

$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}
$db->close();

echo json_encode(['success' => true, 'data' => $data]);
