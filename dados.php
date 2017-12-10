<?php
$url = filter_input(INPUT_GET, 'url', FILTER_SANITIZE_URL);

if(!empty($url)) {
  $curl = curl_init($url . '/7.html');
  curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
  curl_setopt($curl, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.79 Safari/537.36');
  $dados = curl_exec($curl);
  curl_close($curl);

  $retorno = explode(',', $dados);

  $array['streamingId'] = $retorno[1];
  $array['maxOuvintes'] = $retorno[2];
  $array['limiteOuvintes'] = $retorno[3];
  $array['ouvintes'] = $retorno[4];
  $array['taxaTransmissao'] = $retorno[5];

  // Separa artista de faixa
  $faixaAtual = explode('-', $retorno[6]);
  // Remover tags html da string
  $array['faixa'] = (!empty($faixaAtual[1])) ? substr($faixaAtual[1], 0, -14) : '...';
  $array['artista'] = (empty($faixaAtual[1])) ? substr($faixaAtual[0], 0, -14) : $faixaAtual[0];

  header('Access-Control-Allow-Origin: *');
  header('Content-type: application/json', true);

  echo json_encode($array);
}