<?php
require_once '../../config/database.php';
require_once '../../helpers/session.php';
requireRole('bendahara');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../../../Tagihan_Bulanan.html');
    exit;
}

$id_tunggakan = (int) ($_POST['id_tunggakan'] ?? 0);
if (!$id_tunggakan) {
    header('Location: ../../../Tagihan_Bulanan.html?error=ID+tidak+valid');
    exit;
}

$db   = getDB();
$stmt = $db->prepare('DELETE FROM tunggakan WHERE id_tunggakan=?');
$stmt->bind_param('i', $id_tunggakan);
$stmt->execute();
$stmt->close();
$db->close();

header('Location: ../../../Tagihan_Bulanan.html?sukses=Tagihan+dihapus');
exit;
