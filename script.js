// Acessando os elementos HTML
const alavanca = document.getElementById('alavanca');
const resultado = document.getElementById('resultado');
const saldoEl = document.getElementById('saldo');
const apostaEl = document.getElementById('aposta');
const celulas = document.querySelectorAll('.grid-cell');
const musicaFundo = document.getElementById('musica-fundo');

// Elementos de fogos de artifício
const fireworksLeft = document.getElementById('fireworks-left');
const fireworksRight = document.getElementById('fireworks-right');

// Acessando os novos elementos HTML
const btnTurbo = document.getElementById('btn-turbo');
const rodadasTurboEl = document.getElementById('rodadas-turbo');

// Adicione aqui a variável para o som de vitória
const somVitoria = document.getElementById('som-vitoria');

// Símbolos do jogo. '🧙' é o Wildcard
const simbolos = [
    '⚔️', '⚔️', '⚔️', '⚔️', '⚔️', '⚔️', '⚔️', '⚔️',
    '🛡️', '🛡️', '🛡️', '🛡️', '🛡️', '🛡️', '🛡️',
    '🪙', '🪙', '🪙', '🪙', '🪙', '🪙',
    '👑', '👑', '👑',
    '🐉', '🐉',
    '🧙'
];

// Tabela de prêmios por símbolo
const tabelaDePremios = {
    '🐉': 25,
    '👑': 15,
    '🪙': 10,
    '🛡️': 8,
    '⚔️': 5,
    '🧙': 25,
};

// Variáveis de estado
let saldo = 1000;
let premioTotalRodada = 0;
let isPlaying = false;
let sequenceCount = 0;
let musicaTocando = false;
let modoTurbo = false;
let rodadasRestantes = 0;

// Função para tocar/pausar a música de fundo
function toggleMusica() {
    if (!musicaTocando) {
        musicaFundo.play();
        musicaTocando = true;
    }
}

// Atualiza o saldo na interface
function atualizarSaldo(valor) {
    saldo += valor;
    saldoEl.textContent = saldo;
}

// Simula o giro da roleta
function girarRoleta() {
    return new Promise(resolve => {
        let intervalo = setInterval(() => {
            celulas.forEach(celula => {
                celula.textContent = simbolos[Math.floor(Math.random() * simbolos.length)];
            });
        }, 50);

        setTimeout(() => {
            clearInterval(intervalo);
            resolve();
        }, 2000);
    });
}

// Pega os resultados finais das células
function pararRoleta() {
    const resultadosFinais = [];
    celulas.forEach(celula => {
        resultadosFinais.push(celula.textContent);
    });
    return resultadosFinais;
}

// Preenche as células vazias com novos símbolos
function preencherCelulas(indicesParaPreencher) {
    return new Promise(resolve => {
        indicesParaPreencher.forEach(index => {
            const celula = celulas[index];
            celula.textContent = '';
            celula.classList.add('replacing');

            setTimeout(() => {
                celula.textContent = simbolos[Math.floor(Math.random() * simbolos.length)];
                celula.classList.remove('replacing');
            }, 300);
        });
        setTimeout(resolve, 500);
    });
}

// Verifica todas as linhas de vitória (horizontal, vertical, diagonal)
function verificarLinhas(resultados, aposta) {
    let premio = 0;
    const celulasVencedorasIndices = new Set();
    const linhasVencedorasInfo = [];

    const linhas = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    linhas.forEach(indices => {
        const [a, b, c] = indices;
        const s1 = resultados[a];
        const s2 = resultados[b];
        const s3 = resultados[c];
        
        let winningSymbol = null;
        
        if (s1 === s2 && s1 === s3) {
            winningSymbol = s1;
        } 
        else if (s1 === '🧙' && s2 === s3) {
            winningSymbol = s2;
        } else if (s2 === '🧙' && s1 === s3) {
            winningSymbol = s1;
        } else if (s3 === '🧙' && s1 === s2) {
            winningSymbol = s1;
        }
        else if ((s1 === '🧙' && s2 === '🧙') || (s1 === '🧙' && s3 === '🧙') || (s2 === '🧙' && s3 === '🧙')) {
             const nonWilds = [s1, s2, s3].filter(s => s !== '🧙');
             if (nonWilds.length === 1) {
                 winningSymbol = nonWilds[0];
             } else if (nonWilds.length === 0) {
                 winningSymbol = '🐉';
             }
        }

        if (winningSymbol && tabelaDePremios[winningSymbol] !== undefined) {
            const multiplicador = tabelaDePremios[winningSymbol];
            premio += aposta * multiplicador;
            celulasVencedorasIndices.add(a);
            celulasVencedorasIndices.add(b);
            celulasVencedorasIndices.add(c);
            linhasVencedorasInfo.push({ indices, winningSymbol });
        }
    });

    return { premio, celulasVencedorasIndices: Array.from(celulasVencedorasIndices), linhasVencedorasInfo };
}

// Cria um fogos de artifício em uma posição específica
function createFireworkAtPosition(x, y, container) {
    const firework = document.createElement('div');
    firework.className = 'firework';
    firework.style.left = `${x}px`;
    firework.style.top = `${y}px`;
    
    const colors = ['#ffd700', '#ff4500', '#00ff00', '#00ffff', '#ff00ff', '#ffffff'];
    firework.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    
    container.appendChild(firework);

    firework.addEventListener('animationend', () => {
        firework.remove();
    });
}

// Ativa fogos de artifício nos locais das linhas vencedoras
async function triggerFireworksAtWinners(linhasVencedoras) {
    const gridContainer = document.querySelector('.grid-container');
    const rect = gridContainer.getBoundingClientRect();
    
    for (const linha of linhasVencedoras) {
        await new Promise(resolve => {
            const { indices } = linha;
            const celula1 = celulas[indices[0]];
            const celula3 = celulas[indices[2]];
            
            const pos1 = celula1.getBoundingClientRect();
            const pos3 = celula3.getBoundingClientRect();
            
            const centerX = ((pos1.left + pos3.right) / 2) - rect.left;
            const centerY = ((pos1.top + pos3.bottom) / 2) - rect.top;

            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    createFireworkAtPosition(centerX + (Math.random() - 0.5) * 50, centerY + (Math.random() - 0.5) * 50, gridContainer);
                }, i * 100);
            }
            resolve();
        });
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

// Adiciona a classe 'winner' para brilhar as células vencedoras
function brilharCelulasVencedoras(indicesVencedores) {
    indicesVencedores.forEach(index => {
        celulas[index].classList.add('winner');
    });

    setTimeout(() => {
        indicesVencedores.forEach(index => {
            celulas[index].classList.remove('winner');
        });
    }, 2000);
}

// Gerencia o processo de vitórias em cascata
async function processarVitoriaEmCascata(apostaAtual) {
    let houveVitoriaNestaRodada = true;
    while (houveVitoriaNestaRodada) {
        const resultadosAtuais = pararRoleta();
        const { premio, celulasVencedorasIndices, linhasVencedorasInfo } = verificarLinhas(resultadosAtuais, apostaAtual);

        if (premio > 0) {
            // Toca o som de vitória
            somVitoria.play();
            
            sequenceCount++;
            premioTotalRodada += premio;
            atualizarSaldo(premio);
            
            brilharCelulasVencedoras(celulasVencedorasIndices);
            await triggerFireworksAtWinners(linhasVencedorasInfo);
            
            celulasVencedorasIndices.forEach(index => {
                celulas[index].textContent = '';
                celulas[index].classList.add('exploding');
            });
            await new Promise(resolve => setTimeout(resolve, 500));

            await preencherCelulas(celulasVencedorasIndices);

            const simbolosVencedoresTexto = [...new Set(linhasVencedorasInfo.map(info => info.winningSymbol))].join(' e ');
            resultado.textContent = `🎉 +${premio} moedas! ${sequenceCount > 1 ? `Sequência ${sequenceCount}!` : ''} Combos de ${simbolosVencedoresTexto}. Total: ${premioTotalRodada} moedas.`;
            resultado.classList.add('ganhou');
            
            await new Promise(resolve => setTimeout(resolve, 800));

        } else {
            houveVitoriaNestaRodada = false;
        }
    }
}

// Função principal de uma única rodada do jogo
async function executarRodadaUnica(aposta) {
    if (isNaN(aposta) || aposta < 10) {
        resultado.textContent = 'A aposta mínima é 10 moedas.';
        resultado.className = 'mensagem perdeu';
        return;
    }
    
    if (aposta > saldo) {
        resultado.textContent = 'Saldo insuficiente!';
        resultado.className = 'mensagem perdeu';
        if (modoTurbo) {
            modoTurbo = false;
            alavanca.classList.remove('puxando');
        }
        return;
    }
    
    atualizarSaldo(-aposta);
    
    if (!modoTurbo) {
        alavanca.classList.add('puxando');
        resultado.textContent = 'Girando a roleta...';
        resultado.className = 'mensagem';
    }

    await girarRoleta();

    if (!modoTurbo) {
        setTimeout(() => {
            alavanca.classList.remove('puxando');
        }, 200);
    }

    celulas.forEach(celula => celula.classList.remove('winner', 'exploding', 'replacing'));
    premioTotalRodada = 0;
    sequenceCount = 0;

    const resultadosFinaisPrimeiroGiro = pararRoleta();
    const { premio, celulasVencedorasIndices, linhasVencedorasInfo } = verificarLinhas(resultadosFinaisPrimeiroGiro, aposta);
    
    if (premio > 0) {
        brilharCelulasVencedoras(celulasVencedorasIndices);
        await new Promise(resolve => setTimeout(resolve, 1000));
        await processarVitoriaEmCascata(aposta);
        
        const simbolosFinais = [...new Set(linhasVencedorasInfo.map(info => info.winningSymbol))].join(' e ');
        resultado.textContent = `VOCÊ GANHOU! 🎉 Total: +${premioTotalRodada} moedas! ${sequenceCount > 1 ? ` (${sequenceCount} sequências!)` : ''} Combos de ${simbolosFinais}.`;
        resultado.classList.add('ganhou');

    } else {
        resultado.textContent = 'Você perdeu. Tente novamente.';
        resultado.classList.add('perdeu');
    }

    if (modoTurbo) {
        resultado.textContent = `Rodada ${rodadasRestantes + 1} de ${rodadasTurboEl.value}.`;
        await new Promise(resolve => setTimeout(resolve, 500)); 
    }
}

// Função para iniciar o modo turbo
async function iniciarTurbo() {
    if (isPlaying) return;

    const rodadasDesejadas = parseInt(rodadasTurboEl.value, 10);
    const aposta = parseInt(apostaEl.value, 10);

    if (isNaN(rodadasDesejadas) || rodadasDesejadas < 1) {
        resultado.textContent = 'Insira um número válido de rodadas.';
        resultado.className = 'mensagem perdeu';
        return;
    }
    
    modoTurbo = true;
    isPlaying = true;
    rodadasRestantes = rodadasDesejadas;

    toggleMusica();
    alavanca.classList.add('puxando');
    resultado.textContent = `Iniciando modo Turbo...`;

    while (rodadasRestantes > 0 && saldo >= aposta) {
        await executarRodadaUnica(aposta);
        rodadasRestantes--;
        
        await new Promise(resolve => setTimeout(resolve, 200)); 
    }
    
    modoTurbo = false;
    isPlaying = false;
    alavanca.classList.remove('puxando');
    
    if (saldo < aposta) {
        resultado.textContent = 'Modo turbo finalizado por saldo insuficiente.';
        resultado.classList.add('perdeu');
    } else {
        resultado.textContent = 'Modo turbo finalizado.';
        resultado.classList.add('ganhou');
    }
}

// Event Listeners
alavanca.addEventListener('click', async () => {
    if (isPlaying) return;
    
    toggleMusica();
    const aposta = parseInt(apostaEl.value, 10);
    isPlaying = true;
    await executarRodadaUnica(aposta);
    isPlaying = false;
});

btnTurbo.addEventListener('click', iniciarTurbo);

alavanca.addEventListener('mouseover', () => {
    if (!isPlaying) {
        alavanca.style.filter = 'brightness(1.1)';
    }
});

alavanca.addEventListener('mouseout', () => {
    if (!isPlaying) {
        alavanca.style.filter = 'brightness(1)';
    }
});