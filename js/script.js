/*
The MIT License (MIT)

Copyright (c) 2017 Guilherme Sávio
Github: https://github.com/gsavio

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

// Ao utilizar, mudar para false para evitar erros ao tentar buscar os dados de seu streaming
const DEMO = true;

// Nome da Rádio
const NOME_RADIO = "Rock FM";

// Endereço do streaming Shoutcast com porta (se houver) e sem / no final. Exemplo: http://streaming.com:8080
const URL_STREAMING = "http://104.156.244.180:8484";

// Visite https://api.vagalume.com.br/docs/ para saber como conseguir uma chave para API de letras
var API_KEY = "18fe07917957c289983464588aabddfb";

window.onload = function() {
	var pagina = new Pagina;
    pagina.alterarTitle();
    pagina.setVolume();

    var player = new Player();
    player.play();

    setInterval(function() {
        pegarDadosStreaming();
    }, 4000);

    var capaAlbum = document.getElementsByClassName('capa-album')[0];
    capaAlbum.style.height = capaAlbum.offsetWidth + 'px';
}

// Controle do DOM
function Pagina() {
    // Alterar o título da página para o nome da rádio
	this.alterarTitle = function(titulo = NOME_RADIO) {
		document.title = titulo;
	};

    // Atualizar faixa atual
    this.atualizarFaixaAtual = function(musica, artista) {
        var faixaAtual = document.getElementById('faixaAtual');
        var artistaAtual = document.getElementById('artistaAtual');

        if(musica !== faixaAtual.innerHTML) {
            // Caso a faixa seja diferente da atual, atualizar e inserir a classe com animação em css
            faixaAtual.className = 'animated flipInY text-uppercase';
            faixaAtual.innerHTML = musica;

            artistaAtual.className = 'animated flipInY text-capitalize';
            artistaAtual.innerHTML = artista;
            
            // Atualizar o título do modal com a letra da música
            document.getElementById('letraMusica').innerHTML = musica + ' - ' + artista; 
            // Removendo as classes de animação
            setTimeout(function() {
                faixaAtual.className = 'text-uppercase';
                artistaAtual.className = 'text-capitalize';
            }, 2000);
        }
    }

    // Atualizar a imagem de capa do Player e do Background
    this.atualizarCapa = function(musica, artista) {
        // Imagem padrão caso não encontre nenhuma na API do iTunes
        var urlCapa = 'img/bg-capa.jpg';

        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            // Seletores de onde alterar a imagem de capa do album
            var capaMusica = document.getElementById('capaAtual');
            var capaBackground = document.getElementById('capaBg');

            // Buscar imagem da capa na API do iTunes
            if(this.readyState === 4 && this.status === 200) {
                var dados = JSON.parse(this.responseText);
                var artworkUrl100 = (dados.resultCount) ? dados.results[0].artworkUrl100 : urlCapa;
                // Se retornar algum dado, alterar a resolução da imagem ou definir a padrão
                urlCapa = (artworkUrl100 != urlCapa) ? artworkUrl100.replace('100x100bb', '512x512bb') : urlCapa;

                capaMusica.style.backgroundImage = 'url(' + urlCapa + ')';
                capaBackground.style.backgroundImage = 'url(' + urlCapa + ')';

                if('mediaSession' in navigator) {
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: musica,
                        artist: artista,
                        artwork: [
                            {src: urlCapa, sizes: '512x512', type: 'image/png'},
                        ]
                    });
                }
            }
        }
        xhttp.open('GET', 'https://itunes.apple.com/search?term=' + musica + ' ' + artista +'&limit=1', true);
        xhttp.send();
    }

    // Altera o percentual do indicador de volume
    this.alterarPorcentagemVolume = function(volume) {
        document.getElementById('indicadorVol').innerHTML = volume;

        if(typeof(Storage) !== 'undefined') {
            localStorage.setItem('volume', volume);
        }
    }

    // Configura o volume se já tiver sido alterado antes
    this.setVolume = function() {
        if(typeof(Storage) !== 'undefined') {
            var volumeLocalStorage = (localStorage.getItem('volume') === null) ? 80 : localStorage.getItem('volume');
            document.getElementById('volume').value = volumeLocalStorage;
            document.getElementById('indicadorVol').innerHTML = volumeLocalStorage;
        }
    }
    // Atualiza a exibição da letra da música
	this.atualizarLetra = function(musica, artista) {
        var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if(this.readyState === 4 && this.status === 200) {
                var retorno = JSON.parse(this.responseText);

                var botaoVerLetra = document.getElementsByClassName('ver-letra')[0];

                if(retorno.type === 'exact' || retorno.type === 'aprox') {
                    var letra = retorno.mus[0].text;

				    document.getElementById('letra').innerHTML = letra.replace(/\n/g, '<br />');
                    botaoVerLetra.style.opacity = "1";
                    botaoVerLetra.setAttribute('data-toggle', 'modal');
                } else {
                    botaoVerLetra.style.opacity = "0.3";
                    botaoVerLetra.removeAttribute('data-toggle');
                    
                    var modalLetra = document.getElementById('modalLetra');
                    modalLetra.style.display = "none";
                    modalLetra.setAttribute('aria-hidden', 'true');
                    document.getElementsByClassName('modal-backdrop')[0].remove();
                }
			}
		}
		xhttp.open('GET', 'https://api.vagalume.com.br/search.php?apikey=' + API_KEY +'&art=' + artista + '&mus=' + musica, true);
		xhttp.send()
	}
}

var audio = new Audio(URL_STREAMING + '/;');

// Controle do áudio e player
function Player() {
	this.play = function() {
        audio.play();
        
        var volumePadrao = document.getElementById('volume').value;

        if(typeof(Storage) !== 'undefined') {
            if(localStorage.getItem('volume') !== null) {
                audio.volume = intToDecimal(localStorage.getItem('volume'));
            } else {
                audio.volume = intToDecimal(volumePadrao);
            }
        } else {
            audio.volume = intToDecimal(volumePadrao);
        }
        document.getElementById('indicadorVol').innerHTML = volumePadrao;

        audio.onabort = function() {
            audio.load();
            audio.play();
        }
	};

	this.pause = function() {
		audio.pause();
	};
}

// Ao audio ser parado, muda o botão de play para pause
audio.onplay = function() {
    var botao = document.getElementById('botaoPlayer');

    if(botao.className === 'fa fa-play') {
        botao.className = 'fa fa-pause';
    }
}

// Ao audio ser parado, muda o botão de pause para play
audio.onpause = function() {
    var botao = document.getElementById('botaoPlayer');

    if(botao.className === 'fa fa-pause') {
        botao.className = 'fa fa-play';
    }
}

// Caso perca a conexão com o servidor do streaming, exibe este alerta
audio.onerror = function() {
    var confirmacao = confirm('Houve um problema ao tentar se conectar ao servidor. \nClique em OK para tentar novamente.');

    if(confirmacao) {
        window.location.reload();
    }
}

// Ao deslizar a barra de volume, muda o volume do áudio e do indicador
document.getElementById('volume').oninput = function() {
    audio.volume = intToDecimal(this.value);

    var pagina = new Pagina()
    pagina.alterarPorcentagemVolume(this.value);
}

// Função de play e pause do player
function togglePlay() {
    if(!audio.paused) {
        audio.pause();
    } else {
        audio.load();
        audio.play();
    }
}

// Busca os dados de transmissão do streaming
function pegarDadosStreaming() {
    var xhttp = new XMLHttpRequest();
    var urlRequest = (!DEMO) ? 'dados.php' : 'https://web-radio-demo.000webhostapp.com/dados.php';
	xhttp.onreadystatechange = function() {
        if(this.readyState === 4 && this.status === 200) {
            var dados = JSON.parse(this.responseText);

            var pagina = new Pagina();

            // Alterando o título da página com a música e artista atual
            document.title = dados.faixa + ' - ' + dados.artista + ' | ' + NOME_RADIO; 

            // Substituindo caracteres de url para UTF-8
            var musicaAtual = dados.faixa.replace('&apos;', '\'');
            musicaAtual = musicaAtual.replace('&amp;', '&');

            var artistaAtual = dados.artista.replace('&apos;', '\'');
            artistaAtual = artistaAtual.replace('&amp;', '&');

            if(document.getElementById('faixaAtual').innerHTML !== musicaAtual) {
                pagina.atualizarCapa(musicaAtual, artistaAtual);
                pagina.atualizarFaixaAtual(musicaAtual, artistaAtual);
    			pagina.atualizarLetra(musicaAtual, artistaAtual);
            }
        }
    };
    xhttp.open('GET', urlRequest + '?url=' + URL_STREAMING, true);
    xhttp.send();
}

// Converter valor inteiro em decimal
function intToDecimal(vol) {
    var tamanhoStr = vol.length;

    if(tamanhoStr > 0 && tamanhoStr < 3) {
        if(tamanhoStr === 1) {
            volume = '0.0' + vol ;
        } else {
            volume = '0.' + vol;
        }
    } else if(vol === '100') {
        volume = 1;
    }

    return volume;
}
