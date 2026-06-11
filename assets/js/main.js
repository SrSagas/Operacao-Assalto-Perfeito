document.addEventListener("DOMContentLoaded", () => {
    // ---- ESTATÍSTICAS E DATAS ----
    const startDate = new Date("2025-08-01T00:00:00");
    const statDays = document.getElementById('stat-days');
    const statHours = document.getElementById('stat-hours');
    const statMinutes = document.getElementById('stat-minutes');
    const statMonths = document.getElementById('stat-months');
    const finalCounter = document.getElementById('final-counter');

    const statSeconds = document.getElementById('stat-seconds');

    function updateStats() {
        const now = new Date();
        const diffMs = now - startDate;
        
        // Se a data atual for anterior a 2025 (desenvolvimento), mostrar 0 ou mock
        if(diffMs < 0) return;

        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffSeconds = Math.floor(diffMs / 1000); // Tempo total de Missão em Segundos
        
        const months = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());

        if(statDays) statDays.innerText = diffDays;
        if(statHours) statHours.innerText = diffHours;
        if(statMinutes) statMinutes.innerText = diffMinutes;
        if(statMonths) statMonths.innerText = months;
        if(statSeconds) statSeconds.innerText = diffSeconds.toLocaleString('pt-BR'); // Formatação local

        if(finalCounter) {
            const h = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
            const m = Math.floor((diffMs / 1000 / 60) % 60);
            const s = Math.floor((diffMs / 1000) % 60);
            finalCounter.innerText = `${diffDays} Dias, ${h} Horas, ${m} Minutos e ${s} Segundos`;
        }
    }
    
    updateStats();
    setInterval(updateStats, 1000); // Atualização em tempo real

    // ---- MÁQUINA DE ESCREVER ----
    async function typeWriter(element, speed = 40) {
        if(!element) return;
        const text = element.innerText;
        element.innerText = '';
        element.style.opacity = 1;
        
        return new Promise(resolve => {
            let i = 0;
            function type() {
                if (i < text.length) {
                    element.innerHTML += text.charAt(i);
                    i++;
                    setTimeout(type, speed);
                } else {
                    resolve();
                }
            }
            type();
        });
    }

    // ---- GALERIA AUTOMÁTICA ----
    const galleryGrid = document.getElementById('gallery-grid');
    const modal = document.getElementById("gallery-modal");
    const modalImg = document.getElementById("modal-img");
    const closeBtn = document.getElementsByClassName("close-modal")[0];
    let imagesLoaded = [];
    let currentImgIndex = 0;

    function loadImages() {
        let idx = 1;
        function tryLoad() {
            const img = new Image();
            img.src = `assets/images/casal-${idx}.png`;
            img.onload = () => {
                imagesLoaded.push(img.src);
                const el = document.createElement('img');
                el.src = img.src;
                el.classList.add('gallery-item');
                el.onclick = () => openModal(imagesLoaded.length - 1);
                
                // Suporte para mobile (Touch para revelar foto sem abrir modal instantaneamente)
                let lastTouch = 0;
                el.addEventListener('touchstart', (e) => {
                    const now = new Date().getTime();
                    if(now - lastTouch < 300) {
                        openModal(imagesLoaded.length - 1); // Double tap abre modal
                    } else {
                        e.preventDefault(); // Previne click normal no primeiro touch
                        document.querySelectorAll('.gallery-item').forEach(i => i.classList.remove('revealed'));
                        el.classList.add('revealed'); // Simula hover
                    }
                    lastTouch = now;
                });

                galleryGrid.appendChild(el);
                idx++;
                tryLoad();
            };
            img.onerror = () => {
                // Parar ao não encontrar imagem
            };
        }
        tryLoad();
    }
    loadImages();

    function openModal(index) {
        modal.style.display = "block";
        modalImg.src = imagesLoaded[index];
        currentImgIndex = index;
    }

    closeBtn.onclick = () => modal.style.display = "none";
    document.querySelector('.prev-img').onclick = () => {
        currentImgIndex = (currentImgIndex > 0) ? currentImgIndex - 1 : imagesLoaded.length - 1;
        modalImg.src = imagesLoaded[currentImgIndex];
    };
    document.querySelector('.next-img').onclick = () => {
        currentImgIndex = (currentImgIndex < imagesLoaded.length - 1) ? currentImgIndex + 1 : 0;
        modalImg.src = imagesLoaded[currentImgIndex];
    };

    // ---- EXPERIÊNCIA GUIADA E SCROLL ----
    const sections = document.querySelectorAll('.story-section');
    const container = document.getElementById('story-container');
    const btnEnter = document.getElementById('btn-enter');
    const btnUnlock = document.getElementById('btn-unlock');
    const guiControls = document.getElementById('gui-controls');
    const btnPause = document.getElementById('btn-pause');
    const btnPlay = document.getElementById('btn-play');
    
    let currentIndex = 0;
    let isLocked = true;
    let autoAdvanceTimer = null;
    let isPaused = false;
    let isAnimating = false;

    function goToSection(index) {
        if(isAnimating || index < 0 || index >= sections.length) return;
        isAnimating = true; // Bloqueia interações durante a transição E animações

        if(autoAdvanceTimer) clearTimeout(autoAdvanceTimer);

        sections[currentIndex].classList.remove('active');
        currentIndex = index;
        sections[currentIndex].classList.add('active');

        const currentSec = sections[currentIndex];
        
        let maxAnimTime = 1500; // Tempo base da transição de opacidade da cena
        
        // Revelar itens sequenciais com ritmo mais lento (1200ms)
        const reveals = currentSec.querySelectorAll('.terminal-body p, .narrative-block p, .revelation-box, .timeline-item, .briefing-card, .impact-reveal, .climax-reveal, .dramatic-text');
        reveals.forEach((el, i) => {
            let delay = 1000 + (i * 1500); // Revela um por vez de forma bem contemplativa
            maxAnimTime = Math.max(maxAnimTime, delay + 1000);
            setTimeout(() => {
                el.style.opacity = 1;
                el.style.transform = 'translateY(0) translateX(0)';
            }, delay);
        });

        // Narração Typewriter (Professor)
        const typeTarget = currentSec.querySelector('.type-target, .type-target-final');
        if(typeTarget && !typeTarget.dataset.typed) {
            typeTarget.dataset.typed = "true";
            let typeSpeed = 38; // 25% mais rápido (antes era 50)
            let estimatedTypeTime = typeTarget.innerText.length * typeSpeed;
            maxAnimTime = Math.max(maxAnimTime, estimatedTypeTime + 1000);
            typeWriter(typeTarget, typeSpeed);
        }

        // Tocar áudio
        const audioPlaceholder = currentSec.querySelector('.audio-sync-placeholder');
        if(audioPlaceholder) {
            const src = `assets/audio/${audioPlaceholder.dataset.audio}`;
            const audio = new Audio(src);
            audio.play().catch(e => console.log("Sem autoplay de áudio", e));
        }

        // Cálculo de permanência APÓS a cena estar 100% renderizada
        const textLength = currentSec.innerText.trim().length || 50;
        let readingTime = textLength * 60; // 60ms por caractere
        let totalSceneDuration = maxAnimTime + Math.max(7000, readingTime); // Mínimo de 7s de leitura após animação

        // Avanço automático
        if(isLocked && !isPaused && currentIndex < sections.length - 1 && currentIndex > 0) {
            autoAdvanceTimer = setTimeout(() => {
                goToSection(currentIndex + 1);
            }, totalSceneDuration);
        }

        // O usuário só pode tentar pular a cena DEPOIS que todas as animações terminarem!
        setTimeout(() => { isAnimating = false; }, maxAnimTime);
    }

    // Iniciar Experiência
    btnEnter.addEventListener('click', () => {
        // Tentar iniciar música de fundo principal caso exista
        const mainAudio = document.getElementById('main-audio');
        if(mainAudio) {
            mainAudio.volume = 0.3;
            mainAudio.play().catch(()=>console.log("Sem áudio"));
            document.getElementById('sec-9').style.display = 'flex'; // Mostra seção da música na timeline
        }

        guiControls.style.opacity = 1;
        goToSection(1);
    });

    // Desbloquear (Modo Livre)
    btnUnlock.addEventListener('click', () => {
        isLocked = false;
        document.body.classList.remove('locked');
        container.style.transform = 'none';
        guiControls.style.display = 'none';
        if(autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
        
        // Resetar classes para exibição normal em scroll
        sections.forEach(s => {
            s.classList.add('active');
            s.style.minHeight = 'auto';
            s.style.padding = '5rem 2rem';
        });
        
        window.scrollTo({top: 0, behavior: 'smooth'});
    });

    // Controles Manuais
    btnPause.addEventListener('click', () => {
        isPaused = true;
        if(autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
        btnPause.style.display = 'none';
        btnPlay.style.display = 'flex';
    });

    btnPlay.addEventListener('click', () => {
        isPaused = false;
        btnPlay.style.display = 'none';
        btnPause.style.display = 'flex';
        goToSection(currentIndex + 1); // Força avanço se retomar
    });

    // Rolagem por Wheel (Mouse)
    window.addEventListener('wheel', (e) => {
        if(!isLocked || isAnimating) return;
        const currentSec = sections[currentIndex];
        
        if(e.deltaY > 0) {
            if (currentSec.scrollHeight - currentSec.scrollTop <= currentSec.clientHeight + 10) {
                goToSection(currentIndex + 1);
            }
        } else {
            if (currentSec.scrollTop <= 0) {
                goToSection(currentIndex - 1);
            }
        }
    });

    // Rolagem por Touch (Mobile)
    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
        if(!isLocked) return;
        touchStartY = e.changedTouches[0].screenY;
    });

    window.addEventListener('touchend', (e) => {
        if(!isLocked || isAnimating) return;
        let touchEndY = e.changedTouches[0].screenY;
        const currentSec = sections[currentIndex];

        if (touchStartY - touchEndY > 50) { // Swipe up (next)
            if (currentSec.scrollHeight - currentSec.scrollTop <= currentSec.clientHeight + 10) {
                goToSection(currentIndex + 1);
            }
        } else if (touchEndY - touchStartY > 50) { // Swipe down (prev)
            if (currentSec.scrollTop <= 0) {
                goToSection(currentIndex - 1);
            }
        }
    });

    // ---- PWA SERVICE WORKER ----
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('service-worker.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                }, err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
        });
    }
});
