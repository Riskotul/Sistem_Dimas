<?php
require_once '../config/database.php';
require_once '../helpers/session.php';

requireRoleJson('siswa');

header('Content-Type: application/json; charset=utf-8');

$db     = getDB();
$uid    = (int) getLoggedUser()['id_user'];
$stmt   = $db->prepare(
    'SELECT s.id_siswa, s.nama_siswa, s.kelas,
            IFNULL(t.jml_tunggakan, 0) AS jml_tunggakan,
            IFNULL(t.periode_tagihan, \'\') AS periode_tagihan,
            t.tgl_jatuh_tempo,
            t.id_tunggakan
     FROM siswa s
     LEFT JOIN tunggakan t ON s.id_siswa = t.id_siswa
     WHERE s.id_user = ?'
);
$stmt->bind_param('i', $uid);
$stmt->execute();
$res  = $stmt->get_result();
$sis  = $res->fetch_assoc();
$stmt->close();

$id_siswa = (int) ($sis['id_siswa'] ?? 0);

$total_bayar = 0.0;
if ($id_siswa) {
    $q = $db->prepare('SELECT IFNULL(SUM(jml_bayar),0) AS j FROM transaksi WHERE id_siswa=?');
    $q->bind_param('i', $id_siswa);
    $q->execute();
    $total_bayar = (float) $q->get_result()->fetch_assoc()['j'];
    $q->close();
}

$sisa   = (float) ($sis['jml_tunggakan'] ?? 0);
$total  = $total_bayar + $sisa;
$persen = $total > 0 ? round(($total_bayar / $total) * 100) : 0;

$byMonth = [];
if ($id_siswa) {
    $q2 = $db->prepare(
        'SELECT MONTH(tgl_transaksi) AS m, SUM(jml_bayar) AS j
         FROM transaksi WHERE id_siswa=? GROUP BY MONTH(tgl_transaksi) ORDER BY m'
    );
    $q2->bind_param('i', $id_siswa);
    $q2->execute();
    $r2 = $q2->get_result();
    while ($row = $r2->fetch_assoc()) {
        $byMonth[(int) $row['m']] = (float) $row['j'];
    }
    $q2->close();
}

$recent = [];
if ($id_siswa) {
    $q3 = $db->prepare(
        'SELECT DATE_FORMAT(tgl_transaksi, "%M") AS bulan, tgl_transaksi, jml_bayar
         FROM transaksi WHERE id_siswa=? ORDER BY tgl_transaksi DESC LIMIT 5'
    );
    $q3->bind_param('i', $id_siswa);
    $q3->execute();
    $r3 = $q3->get_result();
    while ($row = $r3->fetch_assoc()) {
        $recent[] = $row;
    }
    $q3->close();
}

$db->close();

echo json_encode([
    'success'       => true,
    'siswa'         => $sis,
    'total_tagihan' => $total,
    'sisa_tunggakan'=> $sisa,
    'total_bayar'   => $total_bayar,
    'progress_pct'  => $persen,
    'chart_months'  => $byMonth,
    'recent'        => $recent,
]);
