<?php
function autoGenerateSPP($db, $id_siswa, $nama_siswa, $kelas) {
    $current_m = (int)date('n');
    $current_y = (int)date('Y');
    
    $start_m = 7;
    $start_y = $current_m >= 7 ? $current_y : $current_y - 1;
    
    $bulan_indo = [1=>'Januari', 2=>'Februari', 3=>'Maret', 4=>'April', 5=>'Mei', 6=>'Juni', 7=>'Juli', 8=>'Agustus', 9=>'September', 10=>'Oktober', 11=>'November', 12=>'Desember'];
    
    $is_kelas_x = (strpos($kelas, 'X ') === 0) || $kelas === 'X';
    
    $m = $start_m;
    $y = $start_y;
    
    $max_iterations = 12; 
    $iter = 0;
    
    while ($iter < $max_iterations) {
        $is_juli = ($m === 7);
        if (!($is_kelas_x && $is_juli)) {
            $nama_bulan = $bulan_indo[$m];
            $periode_spp = "SPP $nama_bulan $y";
            
            $q_check = $db->prepare("SELECT id_tunggakan FROM tunggakan WHERE id_siswa = ? AND periode_tagihan = ?");
            $q_check->bind_param('is', $id_siswa, $periode_spp);
            $q_check->execute();
            $exists = $q_check->get_result()->num_rows > 0;
            $q_check->close();
            
            if (!$exists) {
                $tgl_jatuh_tempo = date('Y-m-t', strtotime("$y-$m-01"));
                $nominal = 100000;
                $q_ins = $db->prepare("INSERT INTO tunggakan (id_siswa, nama_siswa, jml_tunggakan, jumlah_tagihan_awal, jenis_tagihan, periode_tagihan, tgl_jatuh_tempo) VALUES (?, ?, ?, ?, 'spp', ?, ?)");
                $q_ins->bind_param('isddss', $id_siswa, $nama_siswa, $nominal, $nominal, $periode_spp, $tgl_jatuh_tempo);
                $q_ins->execute();
                $q_ins->close();
            }
        }
        
        if ($m === $current_m && $y === $current_y) {
            break;
        }

        $m++;
        if ($m > 12) {
            $m = 1;
            $y++;
        }
        $iter++;
    }
}
?>
