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
const DEMO = false;

// Nome da Rádio
const NOME_RADIO = "Rock FM";

// Endereço do streaming Shoutcast com porta (se houver) e sem / no final. Exemplo: http://streaming.com:8080
const URL_STREAMING = "http://stm3.xcast.com.br:6804";

// Visite https://api.vagalume.com.br/docs/ para saber como conseguir uma chave para API de letras
const API_KEY = "18fe07917957c289983464588aabddfb";

// Caso queira pegar a lista das últimas músicas tocadas exibidas pelo Shoutcast, mude o valor para true ou 1
const HISTORICO = true;

// Caso queira receber a informação da próxima música a ser tocada pelo Auto DJ, mude este valor para true ou 1 (Necessário o servidor estar exibindo esta informação)
// Para verificar acesse o endereço do seu streaming e porta /nextsong, exemplo http://streaming.com:8080/nextsong
const PROX_MUSICA = true;

window.onload = function () {
    var pagina = new Pagina;
    pagina.alterarTitle();
    pagina.setVolume();

    var player = new Player();
    player.play();

    setInterval(function () {
        pegarDadosStreaming();
    }, 4000);

    document.getElementsByClassName('capa-album')[0].style.height = capaAlbum.offsetWidth + 'px';
}

// Controle do DOM
function Pagina() {
    // Alterar o título da página para o nome da rádio
    this.alterarTitle = function (titulo = NOME_RADIO) {
        document.title = titulo;
    };

    // Atualizar faixa atual
    this.atualizarFaixaAtual = function (musica, artista) {
        var faixaAtual = document.getElementById('faixaAtual');
        var artistaAtual = document.getElementById('artistaAtual');

        if (musica !== faixaAtual.innerHTML) {
            // Caso a faixa seja diferente da atual, atualizar e inserir a classe com animação em css
            faixaAtual.className = 'animated flipInY text-uppercase';
            faixaAtual.innerHTML = musica;

            artistaAtual.className = 'animated flipInY text-capitalize';
            artistaAtual.innerHTML = artista;

            // Atualizar o título do modal com a letra da música
            document.getElementById('letraMusica').innerHTML = musica + ' - ' + artista;

            // Remove as classes de animação
            setTimeout(function () {
                faixaAtual.className = 'text-uppercase';
                artistaAtual.className = 'text-capitalize';
            }, 2000);
        }
    }

    this.atualizarHistorico = function () {
        // Pega as informações atuais
        var faixaAtual = document.getElementById('faixaAtual').innerText;
        var artistaAtual = document.getElementById('artistaAtual').innerText;
        var capaAtual = document.getElementById('capaAtual').getAttribute('style');

        // Simplificando os seletores
        let $nomeMusica = document.querySelectorAll('#historicoMusicas article .info-musica .nome-musica');
        let $nomeArtista = document.querySelectorAll('#historicoMusicas article .info-musica .nome-artista');
        let $capaAlbum = document.querySelectorAll('#historicoMusicas article .capa-album-historico');

        // Pegar as primeiras informações do histórico
        var ultimaMusica = $nomeMusica[0].innerText;
        var ultimoArtista = $nomeArtista[0].innerText;
        var ultimaCapa = $capaAlbum[0].getAttribute('style');

        // Passa as informações do primeiro para o segundo bloco do histórico de músicas
        $nomeMusica[1].innerHTML = ultimaMusica;
        $nomeArtista[1].innerHTML = ultimoArtista;
        $capaAlbum[1].setAttribute('style', ultimaCapa);

        // Passa as informações atuais para o primeiro bloco do histórico de músicas
        $nomeMusica[0].innerHTML = faixaAtual;
        $nomeArtista[0].innerHTML = artistaAtual;
        $capaAlbum[0].setAttribute('style', capaAtual);

        // Faz animação das caixas com informações
        for (var i = 0; i < 2; i++) {
            var $blocoHistorico = document.querySelectorAll('#historicoMusicas article')[i].classList;
            $blocoHistorico.add('animated');
            $blocoHistorico.add('flipInX');

            // Atrasa a remoção da classe em 1 segundo para evitar que cancele a animação
            setTimeout(function () {
                for (var j = 0; j < 2; j++) {
                    $blocosHistorico = document.querySelectorAll('#historicoMusicas article')[j].classList;
                    $blocosHistorico.remove('animated');
                    $blocosHistorico.remove('flipInX');
                }
            }, 1000);
        }
    }

    this.atualizarHistorico = function (info, n) {
        // Seletores dos blocos do histórico
        var $blocoHistorico = document.querySelectorAll('#historicoMusicas article');
        var $nomeMusica = document.querySelectorAll('#historicoMusicas article .info-musica .nome-musica');
        var $nomeArtista = document.querySelectorAll('#historicoMusicas article .info-musica .nome-artista');

        // Capa padrão
        var urlCapa = 'img/bg-capa.jpg';

        // Busca as imagens de capa para as músicas do histórico
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            // Buscar imagem da capa na API do iTunes
            if (this.readyState === 4 && this.status === 200) {
                var dados = JSON.parse(this.responseText);
                var artworkUrl100 = (dados.resultCount) ? dados.results[0].artworkUrl100 : urlCapa;

                // Se retornar algum dado, alterar a resolução da imagem ou definir a padrão
                document.querySelectorAll('#historicoMusicas article .capa-album-historico')[n].style.backgroundImage = 'url(' + artworkUrl100 + ')';

                // Converte caracteres especiais para utf8
                var musica = info.faixa.replace('&apos;', '\'');
                var musicaHist = musica.replace('&amp;', '&');

                var artista = info.artista.replace('&apos;', '\'');
                var artistaHist = artista.replace('&amp;', '&');

                // Insere os dados
                $nomeMusica[n].innerHTML = musicaHist;
                $nomeArtista[n].innerHTML = artistaHist;

                // Insere a classe de animação no bloco
                $blocoHistorico[n].classList.add('animated');
                $blocoHistorico[n].classList.add('slideInRight');
            }
        }
        xhttp.open('GET', 'https://itunes.apple.com/search?term=' + info.artista + ' ' + info.faixa + '&media=music&limit=1', true);
        xhttp.send();

        setTimeout(function () {
            for (var j = 0; j < 2; j++) {
                $blocoHistorico[j].classList.remove('animated');
                $blocoHistorico[j].classList.remove('slideInRight');
            }
        }, 2000);
    }

    // Atualizar o bloco de próxima música
    this.atualizarProximaMusica = function (musica, artista = '') {
        // Converte caracteres especiais
        let strMusica = musica.replace('&apos;', '\'');
        let proxMusica = strMusica.replace('&amp;', '&');

        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                var dados = JSON.parse(this.responseText);

                // Verifica se há resultados
                var capaAlbum = (dados.resultCount) ? dados.results[0].artworkUrl100 : 'img/bg-capa.jpg';

                // Converte o nome do artista para utf8
                let strArtista = (artista) ? artista.replace('&apos;', '\'') : dados.results[0].artistName.replace('&apos;', '\'');
                let proxArtista = strArtista.replace('&amp;', '&');

                // Altera capa de album
                document.querySelector('#proximaMusica article .capa-album-historico').style.backgroundImage = 'url(' + capaAlbum + ')';

                // Altera as informaçoes do bloco
                document.querySelector('#proximaMusica article .info-musica .nome-musica').innerHTML = musica;
                document.querySelector('#proximaMusica article .info-musica .nome-artista').innerHTML = proxArtista;

                // Seletor do bloco da proxima musica
                $proxMusica =  document.querySelector('#proximaMusica article');
                
                // Adiciona classes de animação
                $proxMusica.classList.add('animated');
                $proxMusica.classList.add('slideInLeft');

                setTimeout(function() {
                    $proxMusica.classList.remove('animated');
                    $proxMusica.classList.remove('slideInLeft');
                }, 2000);
            }
        }
        xhttp.open('GET', 'https://itunes.apple.com/search?term=' + artista + ' ' + proxMusica + '&media=music&limit=1', true);
        xhttp.send();
    }

    // Atualizar a imagem de capa do Player e do Background
    this.atualizarCapa = function (musica, artista) {
        // Imagem padrão caso não encontre nenhuma na API do iTunes
        var urlCapa = 'img/bg-capa.jpg';

        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            // Seletores de onde alterar a imagem de capa do album
            var capaMusica = document.getElementById('capaAtual');
            var capaBackground = document.getElementById('capaBg');

            // Buscar imagem da capa na API do iTunes
            if (this.readyState === 4 && this.status === 200) {
                var dados = JSON.parse(this.responseText);
                var artworkUrl100 = (dados.resultCount) ? dados.results[0].artworkUrl100 : urlCapa;

                // Se retornar algum dado, alterar a resolução da imagem ou definir a padrão
                urlCapa = (artworkUrl100 != urlCapa) ? artworkUrl100.replace('100x100bb', '512x512bb') : urlCapa;
                var urlCapa96 = (artworkUrl100 != urlCapa) ? urlCapa.replace('512x512bb', '96x96bb') : urlCapa;
                var urlCapa128 = (artworkUrl100 != urlCapa) ? urlCapa.replace('512x512bb', '128x128bb') : urlCapa;
                var urlCapa192 = (artworkUrl100 != urlCapa) ? urlCapa.replace('512x512bb', '192x192bb') : urlCapa;
                var urlCapa256 = (artworkUrl100 != urlCapa) ? urlCapa.replace('512x512bb', '256x256bb') : urlCapa;
                var urlCapa384 = (artworkUrl100 != urlCapa) ? urlCapa.replace('512x512bb', '384x384bb') : urlCapa;

                // Imagem do player
                capaMusica.style.backgroundImage = 'url(' + urlCapa + ')';
                capaMusica.className = 'animated bounceInLeft';

                // Imagem do background da página
                capaBackground.style.backgroundImage = 'url(' + urlCapa + ')';

                setTimeout(function () {
                    capaMusica.className = '';
                }, 2000);

                if ('mediaSession' in navigator) {
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: musica,
                        artist: artista,
                        artwork: [{
                                src: urlCapa96,
                                sizes: '96x96',
                                type: 'image/png'
                            },
                            {
                                src: urlCapa128,
                                sizes: '128x128',
                                type: 'image/png'
                            },
                            {
                                src: urlCapa192,
                                sizes: '192x192',
                                type: 'image/png'
                            },
                            {
                                src: urlCapa256,
                                sizes: '256x256',
                                type: 'image/png'
                            },
                            {
                                src: urlCapa384,
                                sizes: '384x384',
                                type: 'image/png'
                            },
                            {
                                src: urlCapa,
                                sizes: '512x512',
                                type: 'image/png'
                            }
                        ]
                    });
                }
            }
        }
        xhttp.open('GET', 'https://itunes.apple.com/search?term=' + artista + ' ' + musica + '&media=music&limit=1', true);
        xhttp.send();
    }

    // Altera o percentual do indicador de volume
    this.alterarPorcentagemVolume = function (volume) {
        document.getElementById('indicadorVol').innerHTML = volume;

        if (typeof (Storage) !== 'undefined') {
            localStorage.setItem('volume', volume);
        }
    }

    // Configura o volume se já tiver sido alterado antes
    this.setVolume = function () {
        if (typeof (Storage) !== 'undefined') {
            var volumeLocalStorage = (localStorage.getItem('volume') === null) ? 80 : localStorage.getItem('volume');
            document.getElementById('volume').value = volumeLocalStorage;
            document.getElementById('indicadorVol').innerHTML = volumeLocalStorage;
        }
    }
    // Atualiza a exibição da letra da música
    this.atualizarLetra = function (musica, artista) {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                var retorno = JSON.parse(this.responseText);

                var botaoVerLetra = document.getElementsByClassName('ver-letra')[0];

                if (retorno.type === 'exact' || retorno.type === 'aprox') {
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
                    (document.getElementsByClassName('modal-backdrop')[0]) ? document.getElementsByClassName('modal-backdrop')[0].remove(): '';
                }
            } else {
                document.getElementsByClassName('ver-letra')[0].style.opacity = "0.3";
                document.getElementsByClassName('ver-letra')[0].removeAttribute('data-toggle');
            }
        }
        xhttp.open('GET', 'https://api.vagalume.com.br/search.php?apikey=' + API_KEY + '&art=' + artista + '&mus=' + musica.toLowerCase(), true);
        xhttp.send()
    }
}

var audio = new Audio(URL_STREAMING + '/;');

// Controle do áudio e player
function Player() {
    this.play = function () {
        audio.play();

        var volumePadrao = document.getElementById('volume').value;

        if (typeof (Storage) !== 'undefined') {
            if (localStorage.getItem('volume') !== null) {
                audio.volume = intToDecimal(localStorage.getItem('volume'));
            } else {
                audio.volume = intToDecimal(volumePadrao);
            }
        } else {
            audio.volume = intToDecimal(volumePadrao);
        }
        document.getElementById('indicadorVol').innerHTML = volumePadrao;

        // audio.onabort = function() {
        //     audio.load();
        //     audio.play();
        // }
    };

    this.pause = function () {
        audio.pause();
    };
}

// Ao audio ser parado, muda o botão de play para pause
audio.onplay = function () {
    var botao = document.getElementById('botaoPlayer');

    if (botao.className === 'fa fa-play') {
        botao.className = 'fa fa-pause';
    }
}

// Ao audio ser parado, muda o botão de pause para play
audio.onpause = function () {
    var botao = document.getElementById('botaoPlayer');

    if (botao.className === 'fa fa-pause') {
        botao.className = 'fa fa-play';
    }
}

// Remove o mudo caso o volume seja alterado
audio.onvolumechange = function () {
    if (audio.volume > 0) {
        audio.muted = false;
    }
}

// Caso perca a conexão com o servidor do streaming, exibe este alerta
audio.onerror = function () {
    var confirmacao = confirm('Houve um problema ao tentar se conectar ao servidor. \nClique em OK para tentar novamente.');

    if (confirmacao) {
        window.location.reload();
    }
}

// Ao deslizar a barra de volume, muda o volume do áudio e do indicador
document.getElementById('volume').oninput = function () {
    audio.volume = intToDecimal(this.value);

    var pagina = new Pagina();
    pagina.alterarPorcentagemVolume(this.value);
}

// Função de play e pause do player
function togglePlay() {
    if (!audio.paused) {
        audio.pause();
    } else {
        audio.load();
        audio.play();
    }
}

// Função para mutar e desmutar o player 
function mutar() {
    if (!audio.muted) {
        // Seleciona direto o elemento para não alterar o volume salvo no localstorage
        document.getElementById('indicadorVol').innerHTML = 0;
        document.getElementById('volume').value = 0;
        audio.volume = 0;
        audio.muted = true;
    } else {
        var localVolume = localStorage.getItem('volume');
        document.getElementById('indicadorVol').innerHTML = localVolume;
        document.getElementById('volume').value = localVolume;
        audio.volume = intToDecimal(localVolume);
        audio.muted = false;
    }
}

// Busca os dados de transmissão do streaming
function pegarDadosStreaming() {
    var xhttp = new XMLHttpRequest();
    var urlRequest = (!DEMO) ? 'dados.php' : 'https://web-radio-demo.000webhostapp.com/dados.php';
    xhttp.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            var dados = JSON.parse(this.responseText);

            var pagina = new Pagina();

            // Substituindo caracteres de url para UTF-8
            let musica = dados.faixa.replace('&apos;', '\'');
            musicaAtual = musica.replace('&amp;', '&');

            let artista = dados.artista.replace('&apos;', '\'');
            artistaAtual = artista.replace('&amp;', '&');

            // Alterando o título da página com a música e artista atual
            document.title = musicaAtual + ' - ' + artistaAtual + ' | ' + NOME_RADIO;

            if (document.getElementById('faixaAtual').innerHTML !== musica) {
                pagina.atualizarCapa(musicaAtual, artistaAtual);
                pagina.atualizarFaixaAtual(musicaAtual, artistaAtual);
                pagina.atualizarLetra(musicaAtual, artistaAtual);
                pagina.atualizarProximaMusica(dados.proximaMusica.faixa, dados.proximaMusica.artista);
                for (var i = 0; i < 2; i++) {
                    pagina.atualizarHistorico(dados.historicoMusicas[i], i);
                }
            }
        }
    };

    // Gera timestamp atual
    var d = new Date();

    // Requisição com timestamp para impedir cache em aparelhos móveis
    xhttp.open('GET', urlRequest + '?url=' + URL_STREAMING + '&prox=' + PROX_MUSICA + '&historico=' + HISTORICO + '&t=' + d.getTime(), true);
    xhttp.send();
}

// Controle do player por teclas 
document.addEventListener('keydown', function (k) {
    var k = k || window.event;
    var tecla = k.keyCode || k.which;
    var slideVolume = document.getElementById('volume');

    var pagina = new Pagina();

    switch (tecla) {
        // Barra de espaço
        case 32:
            togglePlay();
            break;
            // Tecla P
        case 80:
            togglePlay();
            break;
            // Tecla M
        case 77:
            mutar();
            break;
            // Tecla 0
        case 48:
            audio.volume = 0;
            slideVolume.value = 0;
            pagina.alterarPorcentagemVolume(0);
            break;
            // Tecla 0 do teclado numérico
        case 96:
            audio.volume = 0;
            slideVolume.value = 0;
            pagina.alterarPorcentagemVolume(0);
            break;
            // Tecla 1
        case 49:
            audio.volume = .1;
            slideVolume.value = 10;
            pagina.alterarPorcentagemVolume(10);
            break;
            // Tecla 1 do teclado numérico
        case 97:
            audio.volume = .1;
            slideVolume.value = 10;
            pagina.alterarPorcentagemVolume(10);
            break;
            // Tecla 2
        case 50:
            audio.volume = .2;
            slideVolume.value = 20;
            pagina.alterarPorcentagemVolume(20);
            break;
            // Tecla 2 do teclado numérico
        case 98:
            audio.volume = .2;
            slideVolume.value = 20;
            pagina.alterarPorcentagemVolume(20);
            break;
            // Tecla 3
        case 51:
            audio.volume = .3;
            slideVolume.value = 30;
            pagina.alterarPorcentagemVolume(30);
            break;
            // Tecla 3 do teclado numérico
        case 99:
            audio.volume = .3;
            slideVolume.value = 30;
            pagina.alterarPorcentagemVolume(30);
            break;
            // Tecla 4
        case 52:
            audio.volume = .4;
            slideVolume.value = 40;
            pagina.alterarPorcentagemVolume(40);
            break;
            // Tecla 4 do teclado numérico
        case 100:
            audio.volume = .4;
            slideVolume.value = 40;
            pagina.alterarPorcentagemVolume(40);
            break;
            // Tecla 5
        case 53:
            audio.volume = .5;
            slideVolume.value = 50;
            pagina.alterarPorcentagemVolume(50);
            break;
            // Tecla 5 do teclado numérico
        case 101:
            audio.volume = .5;
            slideVolume.value = 50;
            pagina.alterarPorcentagemVolume(50);
            break;
            // Tecla 6 
        case 54:
            audio.volume = .6;
            slideVolume.value = 60;
            pagina.alterarPorcentagemVolume(60);
            break;
            // Tecla 6 do teclado numérico
        case 102:
            audio.volume = .6;
            slideVolume.value = 60;
            pagina.alterarPorcentagemVolume(60);
            break;
            // Tecla 7
        case 55:
            audio.volume = .7;
            slideVolume.value = 70;
            pagina.alterarPorcentagemVolume(70);
            break;
            // Tecla 7 do teclado numérico
        case 103:
            audio.volume = .7;
            slideVolume.value = 70;
            pagina.alterarPorcentagemVolume(70);
            break;
            // Tecla 8
        case 56:
            audio.volume = .8;
            slideVolume.value = 80;
            pagina.alterarPorcentagemVolume(80);
            break;
            // Tecla 8 do teclado númerico
        case 104:
            audio.volume = .8;
            slideVolume.value = 80;
            pagina.alterarPorcentagemVolume(80);
            break;
            // Tecla 9
        case 57:
            audio.volume = .9;
            slideVolume.value = 90;
            pagina.alterarPorcentagemVolume(90);
            break;
            // Tecla 9 do teclado número
        case 105:
            audio.volume = .9;
            slideVolume.value = 90;
            pagina.alterarPorcentagemVolume(90);
            break;
    }
});

// Converter valor inteiro em decimal
function intToDecimal(vol) {
    var tamanhoStr = vol.length;

    if (tamanhoStr > 0 && tamanhoStr < 3) {
        if (tamanhoStr === 1) {
            volume = '0.0' + vol;
        } else {
            volume = '0.' + vol;
        }
    } else if (vol === '100') {
        volume = 1;
    }

    return volume;
}