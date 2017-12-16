<?php
$url = filter_input(INPUT_GET, 'url', FILTER_SANITIZE_URL);

if(!empty($url)) {
	$curl = curl_init($url . '/7.html');
	curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($curl, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.79 Safari/537.36');
	$dados = curl_exec($curl);
	curl_close($curl);

	if(!empty($dados)) {
		// Separa os dados do streaming onde houver vírgulas
		$retorno = explode(',', $dados);

		$array['streamingId'] = $retorno[1];
		$array['maxOuvintes'] = $retorno[2];
		$array['limiteOuvintes'] = $retorno[3];
		$array['ouvintes'] = $retorno[4];
		$array['taxaTransmissao'] = $retorno[5];	
		$musicaAtual = $retorno[6];

		// Se na informação da música houver vírgula, junta os arrays em uma string
		if(count($retorno) > 7) {
			$musicaAtual = '';
			for($i = 6; $i < count($retorno); $i++) {
				$musicaAtual .= ','.$retorno[$i];
			}
		}
		
		// Separa artista de faixa
		$faixaAtual = explode('-', $musicaAtual);

		$artista = $faixaAtual[0];

		if(substr($faixaAtual[0], 0, 1) === ',') {
			$artista = substr($faixaAtual[0], 1, -1);
		}

		// Remover tags html da string
		if(count($faixaAtual) === 2) {
			if(substr($faixaAtual[1], -14) === '</body></html>') {
				$array['faixa'] = (!empty($faixaAtual[1])) ? trim(substr($faixaAtual[1], 0, -14)) : '...';
			} else {
				$array['faixa'] = (!empty($faixaAtual[1])) ? $faixaAtual[1] : '...';
			}

			$array['artista'] = (empty($faixaAtual[1])) ? trim(substr($musicaAtual, 0, -14)) : $artista;
		} elseif(count($faixaAtual) < 2) {
			$array['faixa'] = (!empty($musicaAtual)) ? trim(substr($musicaAtual, 0, -14)) : '...';
			$array['artista'] = '...';
		} else {
			$array['faixa'] = trim($faixaAtual[1]);
			$array['artista'] = trim($artista);
		}
	} else {
		$array = ['erro' => 'Falha ao conseguir dados'];
	}
} else {
	$array = ['erro' => 'Paramentro url nao identificado'];
	
}
header('Access-Control-Allow-Origin: *');
header('Content-type: application/json', true);

echo json_encode($array);
