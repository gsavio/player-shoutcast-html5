<?php
// Recebe o valor obrigatório da url com porta do streaming
$url = filter_input(INPUT_GET, 'url', FILTER_SANITIZE_URL);

// Recebe o valor 1 ou true se quiser que retorne a próxima música a ser tocada pelo auto DJ
// Necessário a informação ser exibir pelo seu streaming, verifique a pagina {http://url do streaming:porta/nextsong}
$proxMusica = filter_input(INPUT_GET, 'prox', FILTER_VALIDATE_BOOLEAN);

// Recebe o valor 1 ou true para que o histórico de músicas tocadas seja exibido
$historico = filter_input(INPUT_GET, 'historico', FILTER_VALIDATE_BOOLEAN);

if(!empty($url)) {
	if($historico) {
		$urls[] = $url . '/7.html';
		$urls[] = $url . '/played';
		if($proxMusica) $urls[] = $url . '/nextsong';
		
		$curl = curl_multi_init();
		foreach($urls as $key => $value){
			$ch[$key] = curl_init($value);
			curl_setopt($ch[$key], CURLOPT_RETURNTRANSFER, true);
			curl_setopt($ch[$key], CURLOPT_USERAGENT, 'Mozilla/5.0');
			curl_multi_add_handle($curl, $ch[$key]);
		}
		
		// Executa consulta cURL
		do {
		curl_multi_exec($curl, $running);
		curl_multi_select($curl);
		} while ($running > 0);
		
		// Obtendo dados das consultas e retirando da fila
		foreach(array_keys($ch) as $key){
			curl_multi_remove_handle($curl, $ch[$key]);
			$conteudo[] = curl_multi_getcontent($ch[$key]);
		}

		$dados = $conteudo[0];

		// Se a opção de exibir a música seguinte estiver ativa
		if($proxMusica) {
			$nomeProximaMusica = (isset($conteudo[2])) ? explode('-', $conteudo[2]) : '';

			if(isset($nomeProximaMusica[1])) {
				$array['proximaMusica'] = ['artista' => $nomeProximaMusica[0], 'faixa' => $nomeProximaMusica[1]];
			} else {
				$array['proximaMusica'] = ['artista' => '', 'faixa' => $nomeProximaMusica[0]];
			}
		}

		// Substitui todas as ocorrências para facilitar na busca no DOM
		$pagina = str_replace('</td><td>', '<musica>', $conteudo[1], $count);

		// Separa as musicas na tag personalizada
		$musicasTocadas = explode('<musica>', $pagina);

		// Remove conteúdo não relacionado
		unset($musicasTocadas[0]);
		unset($musicasTocadas[1]);
		unset($musicasTocadas[2]);

		foreach($musicasTocadas as $musica) {
			// Busca a posição da ocorrência e corta a string com o nome da música
			$corteStr = strpos($musica, '</td></tr>');
			$musicaTocada = substr($musica, 0, $corteStr);
			
			// Quebra a string para ser exibir as informações de artista e faixa separadamente
			$dadosMusica = explode('-', $musicaTocada);
			$nomeMusicaHistorico = (!empty($dadosMusica[1])) ? trim($dadosMusica[1]) : '';
			
			// Adiciona as informações das músicas ao array principal
			$array['historicoMusicas'][] = ['artista' => rtrim($dadosMusica[0]), 'faixa' => $nomeMusicaHistorico];
		}
		
		curl_multi_close($curl);
	} else {
		$curl = curl_init($url . '/7.html');

		curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($curl, CURLOPT_USERAGENT, 'Mozilla/5.0');
		
		$dados = curl_exec($curl);
		
		curl_close($curl);
	}

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

		$artista = trim($faixaAtual[0]);

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