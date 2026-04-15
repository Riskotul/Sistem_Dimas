<?php
require_once '../config/database.php';
require_once '../helpers/session.php';

$referer = '../../login.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ' . $referer);
    exit;
}

$username = trim($_POST['username'] ?? '');
$password = trim($_POST['password'] ?? '');

if (empty($username) || empty($password)) {
    $separator = (strpos($referer, '?') !== false) ? '&' : '?';
    header('Location: ' . $referer . $separator . 'error=Lengkapi+username+dan+password');
    exit;
}

$db   = getDB();

// Cek apakah input adalah NIS (untuk siswa) atau username (untuk admin/kepsek)
$user   = null;
$role   = null;

if (is_numeric($username)) {
    // Jika input numerik, cek sebagai NIS siswa
    $stmt = $db->prepare("SELECT u.id_user, u.username, u.password, u.role FROM users u JOIN siswa s ON u.id_user = s.id_user WHERE s.nis = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    $user   = $result->fetch_assoc();
    $stmt->close();
} else {
    // Jika input bukan numerik, cek sebagai username biasa
    $stmt = $db->prepare("SELECT id_user, username, password, role FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    $user   = $result->fetch_assoc();
    $stmt->close();
}

$db->close();

if (!$user || !password_verify($password, $user['password'])) {
    $separator = (strpos($referer, '?') !== false) ? '&' : '?';
    header('Location: ' . $referer . $separator . 'error=Username+atau+password+salah');
    exit;
}

setSession($user['id_user'], $user['username'], $user['role']);

switch ($user['role']) {
    case 'bendahara':
        header('Location: ../../index_admin.html');
        break;
    case 'kepala':
        header('Location: ../../index_kepsek.html');
        break;
    case 'siswa':
        header('Location: ../../Index_siswa.html');
        break;
    default:
        header('Location: ../../login.php');
}
exit;

