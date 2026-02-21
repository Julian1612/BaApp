const Flashcards = {
    deck: [],
    deckId: null,
    currentIndex: 0,
    isFlipped: false,

    open: async (id) => {
        const item = window.app.data.find(i => i.id === id);
        if (!item) return;
        Flashcards.deckId = id;

        const url = `content/${item.subjectKey}/flashcards/${item.id}.csv`;
        
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error('No flashcards');
            const text = await res.text();
            Flashcards.deck = Flashcards.parseCSV(text, id);
            if (Flashcards.deck.length === 0) throw new Error('Empty deck');
            
            Flashcards.currentIndex = 0;
            Flashcards.isFlipped = false;
            
            const container = document.getElementById('view-flashcards');
            container.classList.remove('hidden');
            Flashcards.render();
        } catch (e) {
            console.error(e);
            alert('Keine Lernkarten für dieses Thema gefunden.');
        }
    },

    close: () => {
        document.getElementById('view-flashcards').classList.add('hidden');
    },

    parseCSV: (text, deckId) => {
        const lines = text.trim().split(/\r?\n/);
        if (lines.length < 2) return [];
        const headers = lines[0].split('|').map(h => h.trim());
        return lines.slice(1).map((line, idx) => {
            const values = line.split('|');
            const obj = { _id: `${deckId}_${idx}` };
            headers.forEach((h, i) => {
                obj[h] = values[i] ? values[i].trim() : '';
            });
            return obj;
        });
    },

    render: () => {
        const container = document.getElementById('view-flashcards');
        const cardData = Flashcards.deck[Flashcards.currentIndex];
        const progress = `${Flashcards.currentIndex + 1} / ${Flashcards.deck.length}`;
        
        let html = `
        <div class="w-full flex justify-between items-center p-4" style="padding-top: max(env(safe-area-inset-top), 40px);">
            <div class="w-12"></div>
            <div class="text-sm font-bold text-gray-500 bg-[#2c2c2e] px-4 py-2 rounded-full border border-white/5">${progress}</div>
            <div class="w-12"></div>
        </div>
        
        <button onclick="Flashcards.close()" class="fixed bottom-32 right-4 z-[60] w-12 h-12 flex items-center justify-center text-gray-500 hover:text-white transition"><i class="fas fa-times text-xl"></i></button>
        
        <div class="flex-1 flex flex-col justify-center items-center p-4 pb-32 overflow-y-auto w-full" onclick="Flashcards.handleTap(event)">
            <div id="card-wrapper" class="w-full max-w-md perspective-1000">
                ${Flashcards.isFlipped ? Flashcards.getBackTemplate(cardData) : Flashcards.getFrontTemplate(cardData)}
            </div>
        </div>`;

        if (Flashcards.isFlipped) {
            html += `
            <div class="fixed bottom-0 w-full p-4 grid grid-cols-4 gap-3 bg-black/20 backdrop-blur-xl border-t border-white/10" style="padding-bottom: max(env(safe-area-inset-bottom), 24px);">
                <button onclick="event.stopPropagation(); Flashcards.rate(1)" class="flex flex-col items-center justify-center bg-red-900/90 h-16 p-3 rounded-2xl border border-red-500/30 active:scale-95 transition">
                    <span class="text-sm font-bold text-red-200">Nochmal</span>
                </button>
                <button onclick="event.stopPropagation(); Flashcards.rate(3)" class="flex flex-col items-center justify-center bg-gray-800/90 h-16 p-3 rounded-2xl border border-gray-600/30 active:scale-95 transition">
                    <span class="text-sm font-bold text-gray-300">Schwer</span>
                </button>
                <button onclick="event.stopPropagation(); Flashcards.rate(4)" class="flex flex-col items-center justify-center bg-blue-900/90 h-16 p-3 rounded-2xl border border-blue-500/30 active:scale-95 transition">
                    <span class="text-sm font-bold text-blue-200">Gut</span>
                </button>
                <button onclick="event.stopPropagation(); Flashcards.rate(5)" class="flex flex-col items-center justify-center bg-green-900/90 h-16 p-3 rounded-2xl border border-green-500/30 active:scale-95 transition">
                    <span class="text-sm font-bold text-green-200">Einfach</span>
                </button>
            </div>`;
        } else {
            html += `
            <div class="fixed bottom-0 w-full p-6 text-center pointer-events-none opacity-50" style="padding-bottom: max(env(safe-area-inset-bottom), 30px);">
                <span class="text-sm font-medium text-gray-400 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">Tippen zum Umdrehen</span>
            </div>`;
        }

        container.innerHTML = html;
    },
    flip: () => { Flashcards.isFlipped = !Flashcards.isFlipped; Flashcards.render(); },
    rate: (quality) => { if (window.SpacedRepetition) SpacedRepetition.processResult(Flashcards.deck[Flashcards.currentIndex]._id, quality); Flashcards.next(); },
    next: () => {
        if (Flashcards.currentIndex < Flashcards.deck.length - 1) { Flashcards.currentIndex++; Flashcards.isFlipped = false; Flashcards.render(); } 
        else {
            document.getElementById('view-flashcards').innerHTML = `
                <div class="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                    <div class="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6 text-4xl"><i class="fas fa-check"></i></div>
                    <h2 class="text-2xl font-bold text-white mb-2">Einheit abgeschlossen!</h2>
                    <button onclick="Flashcards.close()" class="mt-8 bg-white text-black font-bold py-3 px-8 rounded-full shadow-lg">Zurück</button>
                </div>`;
        }
    },
    handleTap: (e) => { if (!e.target.closest('button, .quiz-option, summary')) Flashcards.flip(); },
    
    getFrontTemplate: (data) => {
        const mcSection = data.MC_Richtig ? `
        <div class="mc-section" id="mc-module" onclick="event.stopPropagation()">
          <div class="mc-trigger-wrapper">
            <button class="mc-trigger-btn" onclick="Flashcards.startQuiz(this)">Multiple Choice</button>
          </div>
          <div id="quiz-interface" class="quiz-container" style="display:none;">
            <div class="quiz-header">
              <span class="quiz-label">Wähle die richtige Antwort</span>
              <button class="joker-pill" id="joker-5050" onclick="Flashcards.trigger5050()">50:50</button>
            </div>
            <div class="options-stack" id="options-container"></div>
          </div>
          <div id="mc-data-store" style="display:none;"
               data-correct="${data.MC_Richtig}"
               data-w1="${data.MC_Falsch1}"
               data-w2="${data.MC_Falsch2}"
               data-w3="${data.MC_Falsch3}">
          </div>
        </div>` : '';

        const hints = `
        <div class="hints-wrapper" onclick="event.stopPropagation()">
          ${data.Hinweis_1 ? `<details class="hint-card"><summary><span class="status-dot"></span>Tipp 01</summary><div class="hint-content">${data.Hinweis_1}</div></details>` : ''}
          ${data.Hinweis_2 ? `<details class="hint-card"><summary><span class="status-dot"></span>Tipp 02</summary><div class="hint-content">${data.Hinweis_2}</div></details>` : ''}
        </div>`;

        return `
        <div class="card-container animate-fade-in h-full flex flex-col">
            <div class="header-nav">
              <div class="course-pill-wrapper"><div class="course-pill">${data.Kurs || 'Kurs'}</div></div>
              <div class="topic-dimmed">${data.Thema || 'Thema'}</div>
            </div>
            <div class="content-focus flex-1 flex items-center justify-center">
              <div class="question-text text-center">${data.Frage}</div>
            </div>
            ${mcSection}
            ${hints}
        </div>`;
    },

    getBackTemplate: (data) => {
        const extra = data.Extra ? `
        <details class="bento-item">
            <summary class="label">🧠 Deep Dive</summary>
            <div class="bento-content">${data.Extra}</div>
        </details>` : '';
        
        const rwc = data.Real_World_Case ? `
        <details class="bento-item">
            <summary class="label">🚀 Praxis-Check</summary>
            <div class="bento-content">${data.Real_World_Case}</div>
        </details>` : '';

        const mnemo = data.Mnemonik ? `
        <div class="mnemonic-footer">
            <span class="glow-star">✦</span> <i>${data.Mnemonik}</i>
        </div>` : '';

        return `
        <div class="card-container active-state animate-fade-in h-full flex flex-col" onclick="event.stopPropagation()">
            <div class="header-nav dimmed">
              <div class="course-pill-wrapper"><div class="course-pill">${data.Kurs || 'Kurs'}</div></div>
              <div class="topic-dimmed">${data.Thema || 'Thema'}</div>
            </div>
            <div class="content-focus spotlight-effect flex-1 overflow-y-auto">
              <div class="question-ref">${data.Frage}</div>
              <div class="answer-main">${data.Antwort}</div>
            </div>
            <div class="bento-grid">
              ${rwc}
              ${extra}
            </div>
            <div class="footer-area mt-auto">
              ${mnemo}
              <div class="mastery-line" style="width: 100%;"></div>
            </div>
        </div>`;
    },
    startQuiz: (btn) => {
        const store = document.getElementById('mc-data-store');
        if (!store) return;
        let answers = [ { text: store.dataset.correct, type: 'correct' }, { text: store.dataset.w1, type: 'wrong' }, { text: store.dataset.w2, type: 'wrong' }, { text: store.dataset.w3, type: 'wrong' } ].filter(a => a.text && a.text.trim() !== "");
        for (let i = answers.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [answers[i], answers[j]] = [answers[j], answers[i]]; }
        const container = document.getElementById('options-container');
        container.innerHTML = ''; 
        answers.forEach(ans => {
            const el = document.createElement('div');
            el.className = 'quiz-option';
            el.innerHTML = `<span class="opt-text">${ans.text}</span>`;
            el.dataset.type = ans.type;
            el.onclick = function() { Flashcards.checkAnswer(this, container); };
            container.appendChild(el);
        });
        if(btn && btn.parentElement) btn.parentElement.style.display = 'none';
        document.getElementById('quiz-interface').style.display = 'block';
    },
    checkAnswer: (selectedBtn, container) => {
        if (selectedBtn.classList.contains('locked')) return;
        const allBtns = container.querySelectorAll('.quiz-option');
        allBtns.forEach(btn => { btn.classList.add('locked'); if (btn.dataset.type === 'correct') btn.classList.add('reveal-correct'); });
        if (selectedBtn.dataset.type === 'wrong') selectedBtn.classList.add('reveal-wrong');
    },
    trigger5050: () => {
        const container = document.getElementById('options-container');
        const jokerBtn = document.getElementById('joker-5050');
        const wrongs = Array.from(container.querySelectorAll('.quiz-option')).filter(b => b.dataset.type === 'wrong');
        if (wrongs.length < 2) return; 
        wrongs.sort(() => Math.random() - 0.5);
        wrongs[0].style.opacity = '0.05'; wrongs[0].style.pointerEvents = 'none';
        wrongs[1].style.opacity = '0.05'; wrongs[1].style.pointerEvents = 'none';
        jokerBtn.classList.add('used');
    }
};
window.Flashcards = Flashcards;