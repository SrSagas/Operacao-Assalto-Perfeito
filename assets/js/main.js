document.addEventListener('DOMContentLoaded', () => {
    // 1. GERENCIAMENTO DE ESTADO E NAVEGAÇÃO
    const sections = document.querySelectorAll('.story-section');
    let currentSectionIndex = 0;
    let isAnimating = false;
    let isLocked = true;

    // Controlador Global de Áudio (Previne vazamento de memória)
    const globalAudioPlayer = new Audio();
    globalAudioPlayer.volume = 0.7;

    function navigateToSection(index) {
        if (isAnimating || !isLocked || index < 0 || index >= sections.length) return;
        
        isAnimating = true;
        sections[currentSectionIndex].classList.remove('active');
        currentSectionIndex = index;
        sections[currentSectionIndex].classList.add('active');

        triggerSectionEvents(sections[currentSectionIndex]);

        // Prevenção de múltiplas chamadas de scroll simulando debounce
        setTimeout(() => { isAnimating = false; }, 1500); 
    }

    // Escutadores de Eventos de Rolagem (Blindados contra toques acidentais múltiplos e inércia)
    let touchStartY = 0;
    
    window.addEventListener('wheel', (e) => {
        if (!isLocked) return;
        e.preventDefault(); // Evita rolagem nativa (e ajuda contra a inércia em trackpads)
        if (isAnimating) return;
        
        if (e.deltaY > 40) navigateToSection(currentSectionIndex + 1);
        else if (e.deltaY < -40) navigateToSection(currentSectionIndex - 1);
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
        if (isLocked) e.preventDefault(); // Previne o elástico da tela no mobile
    }, { passive: false });

    window.addEventListener('touchstart', e => { 
        if (isLocked) touchStartY = e.touches[0].clientY; 
    }, { passive: true });

    window.addEventListener('touchend', e => {
        if (!isLocked || isAnimating) return; // Se ainda estiver animando, ignora arrastos soltos
        const touchEndY = e.changedTouches[0].clientY;
        const deltaY = touchStartY - touchEndY;
        
        if (deltaY > 50) navigateToSection(currentSectionIndex + 1);
        else if (deltaY < -50) navigateToSection(currentSectionIndex - 1);
    }, { passive: true });

    // 2. GATILHOS DE ANIMAÇÃO POR SEÇÃO
    function triggerSectionEvents(section) {
        if (window.audioDelayTimeout) {
            clearTimeout(window.audioDelayTimeout);
            window.audioDelayTimeout = null;
        }

        // Tocar Áudio Global se houver placeholder
        const audioData = section.querySelector('.audio-sync-placeholder');
        if (audioData && audioData.dataset.audio) {
            const delay = audioData.dataset.delay ? parseInt(audioData.dataset.delay) : 0;
            const playAudio = () => {
                globalAudioPlayer.src = `assets/audio/${audioData.dataset.audio}`;
                globalAudioPlayer.play().catch(() => console.warn("Interação de áudio bloqueada pelo navegador."));
            };
            if (delay > 0) {
                window.audioDelayTimeout = setTimeout(playAudio, delay);
            } else {
                playAudio();
            }
        } else {
            globalAudioPlayer.pause();
        }

        // Máquina de Escrever Segura (Utilizando textContent e validação de estado)
        const typeTargets = section.querySelectorAll('.type-target, .type-target-final');
        typeTargets.forEach(target => {
            if (target.dataset.typed === "true") return; // Impede reexecução
            
            const textToType = target.dataset.originalText || target.textContent.trim();
            if (!target.dataset.originalText) target.dataset.originalText = textToType;
            
            target.textContent = ""; 
            target.dataset.typed = "true";
            
            let i = 0;
            const typingInterval = setInterval(() => {
                if (i < textToType.length) {
                    target.textContent += textToType.charAt(i);
                    i++;
                } else {
                    clearInterval(typingInterval);
                }
            }, 30);
        });

        // Revelação de Elementos (Sec 5, Sec 3, etc)
        const reveals = section.querySelectorAll('[class*="reveal-"], [class*="seq-"], .timeline-item, .dossier-card, .briefing-card');
        reveals.forEach(el => {
            el.classList.remove('anim-active');
            const content = el.querySelector('.content');
            if (content) content.classList.remove('shake-now');
        });
        
        let accumulatedDelay = 0;
        reveals.forEach((el, index) => {
            const currentDelay = ((index + 1) * 1800) + accumulatedDelay;
            
            setTimeout(() => { 
                el.classList.add('anim-active'); 
                if (el.classList.contains('timeline-failed')) {
                    const content = el.querySelector('.content');
                    if (content) content.classList.add('shake-now');
                }
            }, currentDelay);

            // Atraso dramático para o próximo elemento se a missão atual falhou
            if (el.classList.contains('timeline-failed')) {
                accumulatedDelay += 1500; 
            }
        });
    }

    // 3. GALERIA SEGURA E MODAL (Com limite rígido de carregamento)
    const galleryGrid = document.getElementById('gallery-grid');
    const imageList = ['ev1.jpg', 'ev2.jpg', 'ev3.jpg', 'ev4.jpg']; // Exemplo: Substitua pelo seu array real
    const loadedImages = [];

    if (galleryGrid) {
        imageList.forEach((imgSrc, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'photo-wrapper';
            
            // Rotação aleatória estilo quadro de investigação
            const randomRot = (Math.random() * 12 - 6).toFixed(1);
            wrapper.style.transform = `rotate(${randomRot}deg)`;

            // Agulha (Pino) com cor aleatória
            const pin = document.createElement('div');
            pin.className = 'photo-pin';
            const pinColors = ['#e63946', '#f4a261', '#e9c46a', '#2a9d8f', '#457b9d'];
            pin.style.backgroundColor = pinColors[Math.floor(Math.random() * pinColors.length)];

            const imgEl = document.createElement('img');
            imgEl.src = `assets/images/gallery/${imgSrc}`;
            imgEl.className = 'gallery-item';
            if (imgSrc === 'ev2.jpg') {
                imgEl.classList.add('horizontal');
            }
            
            // Tratamento de erro silencioso para imagens ausentes
            imgEl.onerror = () => { wrapper.style.display = 'none'; };
            
            // Closure seguro para manter a referência correta do índice
            imgEl.onclick = () => openModal(index); 
            
            wrapper.appendChild(pin);
            wrapper.appendChild(imgEl);
            
            loadedImages.push(imgEl);
            galleryGrid.appendChild(wrapper);
        });

        // Função para desenhar as linhas SVG entre os pinos
        function drawStrings() {
            const svg = document.getElementById('string-svg');
            if (!svg) return;
            svg.innerHTML = '';
            const wrappers = document.querySelectorAll('.photo-wrapper');
            if (wrappers.length < 2) return;

            // Timeout garante que o layout final foi calculado
            setTimeout(() => {
                for (let i = 0; i < wrappers.length - 1; i++) {
                    const w1 = wrappers[i];
                    const w2 = wrappers[i + 1];

                    // Coordenadas do centro do pino em relação ao grid
                    // O pino está no top center
                    const x1 = w1.offsetLeft + (w1.offsetWidth / 2);
                    const y1 = w1.offsetTop + 4; // Ajuste para o pino
                    const x2 = w2.offsetLeft + (w2.offsetWidth / 2);
                    const y2 = w2.offsetTop + 4;

                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', x1);
                    line.setAttribute('y1', y1);
                    line.setAttribute('x2', x2);
                    line.setAttribute('y2', y2);
                    line.setAttribute('stroke', 'rgba(193, 18, 31, 0.85)');
                    line.setAttribute('stroke-width', '2');
                    line.style.filter = "drop-shadow(0px 2px 2px rgba(0,0,0,0.5))";
                    svg.appendChild(line);
                }
            }, 100);
        }

        window.addEventListener('resize', drawStrings);
        // Desenha na carga inicial
        drawStrings();
    }

    // Lógica do Modal
    const modal = document.getElementById('gallery-modal');
    const modalImg = document.getElementById('modal-img');
    let currentModalIndex = 0;

    function openModal(index) {
        if (!loadedImages[index] || loadedImages[index].style.display === 'none') return;
        currentModalIndex = index;
        modal.style.display = "flex";
        modalImg.src = loadedImages[currentModalIndex].src;
    }

    document.querySelector('.close-modal')?.addEventListener('click', () => { modal.style.display = "none"; });
    
    // Tratamento de segurança para garantir que botões existam antes de atrelar eventos
    const btnNext = document.querySelector('.next-img');
    const btnPrev = document.querySelector('.prev-img');
    
    if (btnNext) btnNext.onclick = () => {
        currentModalIndex = (currentModalIndex + 1) % loadedImages.length;
        openModal(currentModalIndex);
    };
    if (btnPrev) btnPrev.onclick = () => {
        currentModalIndex = (currentModalIndex - 1 + loadedImages.length) % loadedImages.length;
        openModal(currentModalIndex);
    };

    // 4. DESBLOQUEIO E ENCERRAMENTO (Modo Livre)
    document.getElementById('btn-enter')?.addEventListener('click', () => navigateToSection(1));
    
    document.getElementById('btn-unlock')?.addEventListener('click', () => {
        isLocked = false;
        document.body.classList.remove('locked');
        globalAudioPlayer.pause();
        
        // Reposiciona as seções para rolagem nativa
        sections.forEach(sec => {
            sec.style.position = 'relative';
            sec.style.opacity = '1';
            sec.style.transform = 'none';
            sec.style.pointerEvents = 'auto';
            sec.classList.add('active'); // Garante que tudo fique visível
        });
        
        const gui = document.getElementById('gui-controls');
        if (gui) gui.style.display = 'none';
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Inicialização segura
    if (sections.length > 0) {
        sections[0].classList.add('active');
        document.getElementById('gui-controls').style.opacity = "1";
    }

    // 5. CÁLCULO DE TEMPO DA OPERAÇÃO (ESTATÍSTICAS)
    // Defina a data de início do relacionamento (Ano-Mês-Dia)
    const startDate = new Date('2023-01-01T00:00:00'); // ATENÇÃO: Substitua pela data real

    function updateCounters() {
        const now = new Date();
        const diffInMs = now - startDate;
        
        if (diffInMs < 0) return; // Proteção caso a data seja no futuro
        
        const diffInSeconds = Math.floor(diffInMs / 1000);
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);
        
        // Cálculo aproximado de meses
        const diffInMonths = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());

        const elDays = document.getElementById('stat-days');
        const elHours = document.getElementById('stat-hours');
        const elMinutes = document.getElementById('stat-minutes');
        const elMonths = document.getElementById('stat-months');
        const elSeconds = document.getElementById('stat-seconds');

        // Contadores da Tela Final
        const finalCounter = document.getElementById('final-counter');
        if (finalCounter) {
            finalCounter.innerHTML = `${diffInMonths} MESES, ${diffInDays} DIAS<br><span style="font-size: 0.85em; color: var(--white);">${diffInHours % 24} HORAS, ${diffInMinutes % 60} MIN, ${diffInSeconds % 60} SEG</span>`;
        }

        if(elDays) elDays.textContent = diffInDays.toLocaleString('pt-BR');
        if(elHours) elHours.textContent = diffInHours.toLocaleString('pt-BR');
        if(elMinutes) elMinutes.textContent = diffInMinutes.toLocaleString('pt-BR');
        if(elMonths) elMonths.textContent = diffInMonths.toLocaleString('pt-BR');
        if(elSeconds) elSeconds.textContent = diffInSeconds.toLocaleString('pt-BR');
    }

    // Atualiza a cada segundo
    setInterval(updateCounters, 1000);
    updateCounters(); // Chamada inicial

    // 6. CUSTOM AUDIO PLAYER LOGIC
    const audioEl = document.getElementById('main-audio');
    const playBtn = document.getElementById('play-pause-btn');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const currentTimeEl = document.getElementById('current-time');
    const totalTimeEl = document.getElementById('total-time');

    if (audioEl && playBtn) {
        const formatTime = (time) => {
            if (isNaN(time)) return "0:00";
            const mins = Math.floor(time / 60);
            const secs = Math.floor(time % 60);
            return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        };

        audioEl.addEventListener('loadedmetadata', () => {
            totalTimeEl.textContent = formatTime(audioEl.duration);
        });

        audioEl.addEventListener('timeupdate', () => {
            currentTimeEl.textContent = formatTime(audioEl.currentTime);
            if(audioEl.duration) {
                const progressPercent = (audioEl.currentTime / audioEl.duration) * 100;
                progressBar.style.width = `${progressPercent}%`;
            }
            // Fallback para duração se loadedmetadata falhar em mobile
            if(totalTimeEl.textContent === "0:00" && audioEl.duration) {
                totalTimeEl.textContent = formatTime(audioEl.duration);
            }
        });

        playBtn.addEventListener('click', () => {
            if (audioEl.paused) {
                if (!globalAudioPlayer.paused) globalAudioPlayer.pause();
                audioEl.play().catch(() => console.warn("Mídia ausente ou bloqueada"));
                playBtn.textContent = '❚❚';
            } else {
                audioEl.pause();
                playBtn.textContent = '▶';
            }
        });

        progressContainer.addEventListener('click', (e) => {
            if(!audioEl.duration) return;
            const clickX = e.offsetX;
            const width = progressContainer.clientWidth;
            audioEl.currentTime = (clickX / width) * audioEl.duration;
        });
        
        audioEl.addEventListener('ended', () => {
            playBtn.textContent = '▶';
            progressBar.style.width = '0%';
            currentTimeEl.textContent = "0:00";
        });
    }

    // 7. SEQUÊNCIA DE HACKING INICIAL
    const hackingContainer = document.getElementById('hacking-sequence');
    const mainTitleContainer = document.getElementById('main-title-container');

    if (hackingContainer && mainTitleContainer) {
        // Trava para evitar scroll durante a abertura
        isLocked = true; 

        const typeText = (id, text, speed, callback) => {
            const el = document.getElementById(id);
            if(!el) return;
            let i = 0;
            const iv = setInterval(() => {
                if (i < text.length) {
                    el.textContent += text.charAt(i);
                    i++;
                } else {
                    clearInterval(iv);
                    if(callback) callback();
                }
            }, speed);
        };

        setTimeout(() => typeText('hack-msg-1', 'ssh -p 22 admin@tinder-srv.net', 20), 500);
        setTimeout(() => typeText('hack-msg-2', 'Acesso remoto estabelecido com sucesso.', 15), 1800);
        setTimeout(() => typeText('hack-msg-3', './exploit.sh --target=firewall_principal', 20), 3000);
        setTimeout(() => typeText('hack-msg-4', 'Bypass no firewall executado. Porta 8080 aberta.', 15), 4500);
        setTimeout(() => typeText('hack-msg-5', 'cat /dossier/operacao-assalto.enc | decrypt --force', 20), 6000);
        setTimeout(() => typeText('hack-msg-6', 'Descriptografando arquivo confidencial... Aguarde...', 15), 7800);
        setTimeout(() => typeText('hack-msg-7', 'Validando credenciais do visualizador...', 15), 9500);

        setTimeout(() => {
            const elAuth = document.getElementById('hack-msg-auth');
            if(elAuth) elAuth.style.display = 'block';
        }, 11500);

        setTimeout(() => {
            hackingContainer.style.display = 'none';
            mainTitleContainer.style.display = 'block';
            
            // Pequeno delay para garantir que o CSS aplique a transição
            setTimeout(() => {
                mainTitleContainer.style.opacity = '1';
            }, 50);
        }, 13000);
    }
});
