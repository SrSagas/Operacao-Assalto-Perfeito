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
        setTimeout(() => { isAnimating = false; }, 1200); 
    }

    // Escutadores de Eventos de Rolagem (Blindados contra toques acidentais múltiplos)
    let touchStartY = 0;
    
    window.addEventListener('wheel', (e) => {
        if (!isLocked) return;
        if (e.deltaY > 0) navigateToSection(currentSectionIndex + 1);
        else if (e.deltaY < 0) navigateToSection(currentSectionIndex - 1);
    }, { passive: false });

    window.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; }, { passive: true });
    window.addEventListener('touchend', e => {
        if (!isLocked) return;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaY = touchStartY - touchEndY;
        if (deltaY > 50) navigateToSection(currentSectionIndex + 1);
        else if (deltaY < -50) navigateToSection(currentSectionIndex - 1);
    }, { passive: true });

    // 2. GATILHOS DE ANIMAÇÃO POR SEÇÃO
    function triggerSectionEvents(section) {
        // Tocar Áudio Global se houver placeholder
        const audioData = section.querySelector('.audio-sync-placeholder');
        if (audioData && audioData.dataset.audio) {
            globalAudioPlayer.src = `assets/audio/${audioData.dataset.audio}`;
            globalAudioPlayer.play().catch(() => console.warn("Interação de áudio bloqueada pelo navegador."));
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
        const reveals = section.querySelectorAll('[class*="reveal-"], [class*="seq-"]');
        reveals.forEach((el, index) => {
            setTimeout(() => { el.style.opacity = "1"; }, (index + 1) * 800);
        });
    }

    // 3. GALERIA SEGURA E MODAL (Com limite rígido de carregamento)
    const galleryGrid = document.getElementById('gallery-grid');
    const imageList = ['ev1.jpg', 'ev2.jpg', 'ev3.jpg', 'ev4.jpg']; // Exemplo: Substitua pelo seu array real
    const loadedImages = [];

    if (galleryGrid) {
        imageList.forEach((imgSrc, index) => {
            const imgEl = document.createElement('img');
            imgEl.src = `assets/images/gallery/${imgSrc}`;
            imgEl.className = 'gallery-item';
            
            // Tratamento de erro silencioso para imagens ausentes
            imgEl.onerror = () => { imgEl.style.display = 'none'; };
            
            // Closure seguro para manter a referência correta do índice
            imgEl.onclick = () => openModal(index); 
            
            loadedImages.push(imgEl);
            galleryGrid.appendChild(imgEl);
        });
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
});
