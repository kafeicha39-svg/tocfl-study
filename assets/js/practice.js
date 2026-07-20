(function(){
  const app = document.getElementById('practiceApp');
  const announcement = document.getElementById('practiceAnnouncement');
  const studyStorage = window.tocflStudyStorage;
  const allWords = (window.TOCFL_COURSE?.lessons || [])
    .flatMap(lesson => lesson.words.map(word => ({...word, day: lesson.day})))
    .filter((word, index, words) => words.findIndex(item => item.w === word.w) === index);
  const wordById = new Map(allWords.map(word => [studyStorage.wordId(word.w), word]));
  const validModes = new Set(['weak', 'pinyin', 'dictation', 'mock']);
  let activeMode = 'weak';
  let recallState = null;
  let mockState = null;
  let mockTimer = null;

  function escapeHtml(value){
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function shuffle(items){
    const result = [...items];
    for(let index = result.length - 1; index > 0; index--){
      const target = Math.floor(Math.random() * (index + 1));
      [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
  }

  function announce(message){
    announcement.textContent = '';
    window.setTimeout(() => announcement.textContent = message, 20);
  }

  function activeWeakWords(){
    const entries = studyStorage.getMap();
    return Object.entries(entries)
      .filter(([, entry]) => entry.active === true)
      .map(([id, entry]) => ({word: wordById.get(id), entry}))
      .filter(item => item.word)
      .sort((first, second) => (second.entry.lastWrongAt || second.entry.updatedAt) - (first.entry.lastWrongAt || first.entry.updatedAt));
  }

  function updateWeakCount(){
    const count = activeWeakWords().length;
    const badge = document.getElementById('weakCount');
    if(badge) badge.textContent = `苦手 ${count}語`;
  }

  function setMode(mode){
    if(!validModes.has(mode)) mode = 'weak';
    stopMockTimer();
    recallState = null;
    mockState = null;
    activeMode = mode;
    const url = new URL(location.href);
    url.searchParams.set('mode', mode);
    history.replaceState(null, '', url);
    document.querySelectorAll('[data-mode]').forEach(button => {
      const selected = button.dataset.mode === mode;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    if(mode === 'weak') renderWeakReview();
    else if(mode === 'mock') renderMockSettings();
    else renderRecallSettings(mode);
    app.scrollIntoView({behavior: 'smooth', block: 'start'});
  }

  function wordControls(word){
    const active = studyStorage.isWeak(word.w);
    return `
      <div class="practice-actions">
        <button type="button" class="speak" data-speak="${escapeHtml(word.w)}">🔊 台湾華語で聞く</button>
        <button type="button" class="weak-toggle ${active ? 'active' : ''}" data-toggle-weak="${escapeHtml(word.w)}" aria-pressed="${active}">
          ${active ? '★ 苦手から解除' : '☆ 苦手に追加'}
        </button>
      </div>`;
  }

  function bindSharedControls(root = app){
    root.querySelectorAll('[data-speak]').forEach(button => {
      button.addEventListener('click', () => window.tocflSpeech.speak(button.dataset.speak));
    });
    root.querySelectorAll('[data-toggle-weak]').forEach(button => {
      button.addEventListener('click', () => {
        const word = button.dataset.toggleWeak;
        if(studyStorage.isWeak(word)) studyStorage.resolve(word);
        else studyStorage.addManual(word);
        if(activeMode === 'weak') renderWeakReview();
        else renderRecallQuestion();
        updateWeakCount();
      });
    });
  }

  function renderWeakReview(){
    const weakWords = activeWeakWords();
    app.innerHTML = `
      <section class="card">
        <span class="eyebrow">WEAK REVIEW</span>
        <h2>苦手な単語だけを復習</h2>
        ${weakWords.length ? `
          <p>${weakWords.length}語を保存しています。答えを隠したまま思い出し、覚えたら「克服した」を押してください。</p>
          <div class="practice-actions">
            <button type="button" class="primary" id="startWeakPinyin">ピンインで復習</button>
            <button type="button" class="secondary-button" id="startWeakDictation">書き取りで復習</button>
          </div>` : `
          <div class="empty-state">
            <p><strong>苦手な単語はまだありません。</strong></p>
            <p>各Dayの「☆ 苦手に追加」を押すか、練習で間違えると、ここに集まります。</p>
          </div>`}
      </section>
      ${weakWords.map(({word, entry}, index) => `
        <section class="card weak-word-card">
          <div class="section-head">
            <div>
              <span class="eyebrow">DAY ${word.day}</span>
              <div class="word" lang="zh-Hant">${escapeHtml(word.w)}</div>
            </div>
            <span class="status">${entry.wrongCount ? `間違い ${entry.wrongCount}回` : '自分で追加'}</span>
          </div>
          <button type="button" class="secondary-button reveal-button" data-reveal="weakAnswer${index}" aria-expanded="false">ピンイン・意味を見る</button>
          <div class="recall-answer" id="weakAnswer${index}" hidden>
            <p class="pinyin">${escapeHtml(word.p)}</p>
            <p>${escapeHtml(word.m)}</p>
          </div>
          <div class="practice-actions">
            <button type="button" class="speak" data-speak="${escapeHtml(word.w)}">🔊 聞く</button>
            <button type="button" class="mastered-button" data-mastered="${escapeHtml(word.w)}">✓ 克服した</button>
          </div>
        </section>`).join('')}`;

    document.getElementById('startWeakPinyin')?.addEventListener('click', () => startRecall('pinyin', weakWords.map(item => item.word)));
    document.getElementById('startWeakDictation')?.addEventListener('click', () => startRecall('dictation', weakWords.map(item => item.word)));
    app.querySelectorAll('[data-reveal]').forEach(button => {
      button.addEventListener('click', () => {
        const answer = document.getElementById(button.dataset.reveal);
        answer.hidden = !answer.hidden;
        button.setAttribute('aria-expanded', String(!answer.hidden));
        button.textContent = answer.hidden ? 'ピンイン・意味を見る' : '答えを隠す';
      });
    });
    app.querySelectorAll('[data-mastered]').forEach(button => {
      button.addEventListener('click', () => {
        studyStorage.resolve(button.dataset.mastered);
        announce(`${button.dataset.mastered}を苦手から解除しました。`);
        renderWeakReview();
        updateWeakCount();
      });
    });
    bindSharedControls();
  }

  function renderRecallSettings(mode){
    const isPinyin = mode === 'pinyin';
    const weakCount = activeWeakWords().length;
    app.innerHTML = `
      <section class="card">
        <span class="eyebrow">${isPinyin ? 'PINYIN' : 'DICTATION'}</span>
        <h2>${isPinyin ? 'ピンイン練習' : '書き取り練習'}</h2>
        <p>${isPinyin
          ? '繁体字を見て、声調記号付きのピンインを入力します。ピンインは答えるまで表示しません。'
          : '台湾華語（zh-TW）の音声を聞き、繁体字を入力します。スマホでは入力欄を選んで手書きキーボードへ切り替えられます。'}</p>
        <form id="recallSettings" class="practice-settings">
          <label>練習する範囲
            <select name="scope">
              <option value="all">全Dayの単語</option>
              <option value="weak" ${weakCount ? '' : 'disabled'}>苦手だけ（${weakCount}語）</option>
            </select>
          </label>
          <label>問題数
            <select name="count">
              <option value="10">10問</option>
              <option value="20">20問</option>
              <option value="all">すべて</option>
            </select>
          </label>
          <button type="submit" class="primary">練習を始める</button>
        </form>
        <p class="source-note">間違えた単語は苦手に保存され、2問ほど後でもう一度出ます。</p>
      </section>`;
    document.getElementById('recallSettings').addEventListener('submit', event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const source = data.get('scope') === 'weak' ? activeWeakWords().map(item => item.word) : allWords;
      const requested = data.get('count') === 'all' ? source.length : Number(data.get('count'));
      startRecall(mode, shuffle(source).slice(0, requested));
    });
  }

  function startRecall(mode, words){
    if(!words.length){
      renderRecallSettings(mode);
      announce('練習できる単語がありません。');
      return;
    }
    activeMode = mode;
    const url = new URL(location.href);
    url.searchParams.set('mode', mode);
    history.replaceState(null, '', url);
    document.querySelectorAll('[data-mode]').forEach(button => {
      const selected = button.dataset.mode === mode;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-selected', String(selected));
    });
    recallState = {
      mode,
      queue: words.map(word => ({word, retries: 0})),
      initialCount: words.length,
      mastered: new Set(),
      wrongAttempts: 0,
      result: null
    };
    renderRecallQuestion();
  }

  function normalizePinyin(value){
    return String(value).normalize('NFC').toLocaleLowerCase('zh-TW').replace(/[\s'’·-]+/g, '');
  }

  function normalizeHanzi(value){
    return String(value).normalize('NFC').replace(/[\s，。！？、,.!?]+/g, '');
  }

  function renderRecallQuestion(){
    if(!recallState) return;
    if(!recallState.queue.length){
      renderRecallSummary();
      return;
    }
    const {mode, queue, initialCount, mastered, result} = recallState;
    const item = result ? {word: result.word} : queue[0];
    const word = item.word;
    const isPinyin = mode === 'pinyin';
    const progress = Math.round(mastered.size / initialCount * 100);
    app.innerHTML = `
      <section class="card recall-card">
        <div class="section-head">
          <div>
            <span class="eyebrow">${isPinyin ? 'PINYIN' : 'DICTATION'}</span>
            <h2>${isPinyin ? '声調を思い出す' : '聞こえた繁体字を書く'}</h2>
          </div>
          <span class="status">完了 ${mastered.size} / ${initialCount}</span>
        </div>
        <div class="progress" aria-label="練習の進み具合"><span style="width:${progress}%"></span></div>
        ${isPinyin ? `
          <p class="recall-prompt" lang="zh-Hant">${escapeHtml(word.w)}</p>
          <p class="muted">声調記号を付けて入力してください。</p>` : `
          <div class="audio-prompt" aria-label="書き取り問題">
            <span aria-hidden="true">聽</span>
            <button type="button" class="speak listening-button" id="playDictation">🔊 音声を聞く・もう一度聞く</button>
          </div>
          <p class="muted">入力欄を選び、スマホの中国語（繁体字）手書きキーボードも利用できます。</p>`}
        <form id="recallForm">
          <label for="recallInput">${isPinyin ? 'ピンインの答え' : '繁体字の答え'}</label>
          ${isPinyin
            ? '<input class="recall-input" id="recallInput" name="answer" type="text" lang="zh-Latn" autocomplete="off" autocapitalize="none" spellcheck="false" enterkeyhint="done" required>'
            : '<textarea class="recall-input handwriting-input" id="recallInput" name="answer" lang="zh-TW" autocomplete="off" autocapitalize="none" spellcheck="false" enterkeyhint="done" rows="2" required></textarea>'}
          <div class="practice-actions">
            <button type="submit" class="primary" ${result ? 'disabled' : ''}>答え合わせ</button>
            <button type="button" class="secondary-button" id="showRecallAnswer" ${result ? 'disabled' : ''}>答えを見る</button>
            <button type="button" class="quiet-button" id="endRecall">練習を終える</button>
          </div>
        </form>
        ${result ? `
          <div class="result-message ${result.correct ? 'success' : 'error'}" role="status">
            <strong>${result.correct ? '○ 正解です' : '正解を確認しましょう'}</strong>
            <p><span lang="zh-Hant">${escapeHtml(word.w)}</span> <span class="pinyin">${escapeHtml(word.p)}</span><br>${escapeHtml(word.m)}</p>
            <button type="button" class="primary" id="nextRecall">次の問題へ</button>
          </div>` : ''}
        ${wordControls(word)}
      </section>`;

    const input = document.getElementById('recallInput');
    document.getElementById('playDictation')?.addEventListener('click', () => window.tocflSpeech.speak(word.w));
    document.getElementById('recallForm').addEventListener('submit', event => {
      event.preventDefault();
      if(recallState.result) return;
      const answer = new FormData(event.currentTarget).get('answer');
      const correct = isPinyin
        ? normalizePinyin(answer) === normalizePinyin(word.p)
        : normalizeHanzi(answer) === normalizeHanzi(word.w);
      evaluateRecall(correct);
    });
    document.getElementById('showRecallAnswer').addEventListener('click', () => evaluateRecall(false));
    document.getElementById('endRecall').addEventListener('click', renderRecallSummary);
    document.getElementById('nextRecall')?.addEventListener('click', () => {
      recallState.result = null;
      renderRecallQuestion();
    });
    bindSharedControls();
    if(!result) input.focus({preventScroll: true});
  }

  function evaluateRecall(correct){
    if(!recallState || recallState.result) return;
    const current = recallState.queue.shift();
    if(correct){
      recallState.mastered.add(current.word.w);
      recallState.result = {correct: true, word: current.word};
      announce('正解です。');
    }else{
      current.retries++;
      recallState.wrongAttempts++;
      const position = Math.min(2, recallState.queue.length);
      recallState.queue.splice(position, 0, current);
      studyStorage.markWrong(current.word.w);
      recallState.result = {correct: false, word: current.word};
      updateWeakCount();
      announce(`${current.word.w}を苦手に保存し、後でもう一度出題します。`);
    }
    renderRecallQuestion();
  }

  function renderRecallSummary(){
    if(!recallState) return;
    const {mode, initialCount, mastered, wrongAttempts} = recallState;
    app.innerHTML = `
      <section class="card result-summary">
        <span class="eyebrow">RESULT</span>
        <h2>練習結果</h2>
        <p class="score-number">${mastered.size} / ${initialCount}語</p>
        <p>間違い・答えの表示：${wrongAttempts}回</p>
        <p class="muted">間違えた単語は「苦手復習」に保存されています。</p>
        <div class="practice-actions">
          <button type="button" class="primary" id="retryRecall">もう一度練習</button>
          <button type="button" class="secondary-button" id="showWeakReview">苦手を確認</button>
        </div>
      </section>`;
    document.getElementById('retryRecall').addEventListener('click', () => renderRecallSettings(mode));
    document.getElementById('showWeakReview').addEventListener('click', () => setMode('weak'));
  }

  function renderMockSettings(){
    app.innerHTML = `
      <section class="card">
        <span class="eyebrow">MOCK TEST</span>
        <h2>模試モード</h2>
        <p>全Dayからランダムに出題します。回答中は正解を表示せず、最後に点数と間違いをまとめて確認します。</p>
        <form id="mockSettings" class="practice-settings">
          <label>問題数
            <select name="count">
              <option value="10">10問</option>
              <option value="20">20問</option>
              <option value="30">30問</option>
              <option value="all">全単語</option>
            </select>
          </label>
          <label>制限時間
            <select name="minutes">
              <option value="0">時間制限なし</option>
              <option value="5">5分</option>
              <option value="10">10分</option>
              <option value="20">20分</option>
            </select>
          </label>
          <button type="submit" class="primary">模試を始める</button>
        </form>
      </section>`;
    document.getElementById('mockSettings').addEventListener('submit', event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      startMock({
        count: data.get('count') === 'all' ? allWords.length : Number(data.get('count')),
        minutes: Number(data.get('minutes'))
      });
    });
  }

  function makeMockQuestions(count){
    const selected = shuffle(allWords).slice(0, Math.min(count, allWords.length));
    return selected.map((word, index) => {
      const type = ['meaning', 'pinyin', 'word'][index % 3];
      const correct = type === 'meaning' ? word.m : type === 'pinyin' ? word.p : word.w;
      const values = allWords.map(item => type === 'meaning' ? item.m : type === 'pinyin' ? item.p : item.w);
      const alternatives = shuffle([...new Set(values.filter(value => value !== correct))]).slice(0, 3);
      return {
        word,
        type,
        correct,
        options: shuffle([correct, ...alternatives])
      };
    });
  }

  function startMock(settings){
    stopMockTimer();
    mockState = {
      settings,
      questions: makeMockQuestions(settings.count),
      answers: [],
      index: 0,
      remainingSeconds: settings.minutes * 60,
      finished: false
    };
    renderMockQuestion();
    if(settings.minutes){
      updateMockTimer();
      mockTimer = window.setInterval(() => {
        mockState.remainingSeconds--;
        updateMockTimer();
        if(mockState.remainingSeconds <= 0) finishMock(true);
      }, 1000);
    }
  }

  function stopMockTimer(){
    if(mockTimer) window.clearInterval(mockTimer);
    mockTimer = null;
  }

  function updateMockTimer(){
    const timer = document.getElementById('mockTimer');
    if(!timer || !mockState) return;
    const minutes = Math.floor(mockState.remainingSeconds / 60);
    const seconds = String(Math.max(0, mockState.remainingSeconds % 60)).padStart(2, '0');
    timer.textContent = `残り ${minutes}:${seconds}`;
  }

  function renderMockQuestion(){
    if(!mockState || mockState.finished) return;
    if(mockState.index >= mockState.questions.length){
      finishMock(false);
      return;
    }
    const question = mockState.questions[mockState.index];
    const labels = {
      meaning: '次の台湾華語の意味はどれですか。',
      pinyin: '正しいピンインはどれですか。',
      word: '次の日本語に合う台湾華語はどれですか。'
    };
    const prompt = question.type === 'word' ? question.word.m : question.word.w;
    app.innerHTML = `
      <section class="card mock-card">
        <div class="section-head">
          <div>
            <span class="eyebrow">MOCK TEST</span>
            <h2>問題 ${mockState.index + 1} / ${mockState.questions.length}</h2>
          </div>
          ${mockState.settings.minutes ? '<span class="status timer" id="mockTimer" aria-live="off"></span>' : '<span class="status">時間制限なし</span>'}
        </div>
        <div class="progress" aria-label="模試の進み具合"><span style="width:${mockState.index / mockState.questions.length * 100}%"></span></div>
        <p><strong>${labels[question.type]}</strong></p>
        <p class="mock-prompt" ${question.type === 'word' ? '' : 'lang="zh-Hant"'}>${escapeHtml(prompt)}</p>
        <div class="mock-options">
          ${question.options.map((option, index) => `
            <button type="button" class="choice mock-choice" data-answer="${index}">
              ${String.fromCharCode(65 + index)}. <span ${question.type === 'word' ? 'lang="zh-Hant"' : ''}>${escapeHtml(option)}</span>
            </button>`).join('')}
        </div>
        <button type="button" class="quiet-button" id="finishMockEarly">途中で終了して採点</button>
        <p class="source-note">正解は模試が終わるまで表示されません。</p>
      </section>`;
    app.querySelectorAll('[data-answer]').forEach(button => {
      button.addEventListener('click', () => {
        const selected = question.options[Number(button.dataset.answer)];
        mockState.answers.push({question, selected, correct: selected === question.correct});
        mockState.index++;
        renderMockQuestion();
      });
    });
    document.getElementById('finishMockEarly').addEventListener('click', () => finishMock(false));
    updateMockTimer();
  }

  function finishMock(timedOut){
    if(!mockState || mockState.finished) return;
    stopMockTimer();
    mockState.finished = true;
    while(mockState.answers.length < mockState.questions.length){
      const question = mockState.questions[mockState.answers.length];
      mockState.answers.push({question, selected: null, correct: false});
    }
    const correctCount = mockState.answers.filter(answer => answer.correct).length;
    const wrongAnswers = mockState.answers.filter(answer => !answer.correct);
    const percent = Math.round(correctCount / mockState.questions.length * 100);
    app.innerHTML = `
      <section class="card result-summary">
        <span class="eyebrow">RESULT</span>
        <h2>${timedOut ? '時間になりました' : '模試結果'}</h2>
        <p class="score-number">${correctCount} / ${mockState.questions.length}問</p>
        <p><strong>正答率 ${percent}%</strong></p>
        <div class="practice-actions">
          <button type="button" class="primary" id="retryMock">同じ条件で再挑戦</button>
          ${wrongAnswers.length ? '<button type="button" class="secondary-button" id="addAllMockWeak">間違いをすべて苦手に追加</button>' : ''}
        </div>
      </section>
      ${wrongAnswers.length ? `
        <section class="card">
          <span class="eyebrow">REVIEW</span>
          <h2>間違えた問題</h2>
          <div class="mock-review-list">
            ${wrongAnswers.map((answer, index) => `
              <article class="mock-review-item">
                <div>
                  <strong>${index + 1}. <span lang="zh-Hant">${escapeHtml(answer.question.word.w)}</span></strong>
                  <p class="pinyin">${escapeHtml(answer.question.word.p)}</p>
                  <p>${escapeHtml(answer.question.word.m)}</p>
                  <p class="muted">あなたの回答：${answer.selected === null ? '未回答' : escapeHtml(answer.selected)}</p>
                </div>
                <button type="button" class="weak-toggle" data-add-mock-weak="${escapeHtml(answer.question.word.w)}">☆ 苦手に追加</button>
              </article>`).join('')}
          </div>
        </section>` : `
        <section class="card done-card"><h2>全問正解です</h2><p>すばらしい仕上がりです。</p></section>`}`;

    document.getElementById('retryMock').addEventListener('click', () => startMock(mockState.settings));
    document.getElementById('addAllMockWeak')?.addEventListener('click', event => {
      wrongAnswers.forEach(answer => studyStorage.markWrong(answer.question.word.w));
      event.currentTarget.textContent = '✓ 苦手に追加しました';
      event.currentTarget.disabled = true;
      app.querySelectorAll('[data-add-mock-weak]').forEach(button => {
        button.textContent = '★ 追加済み';
        button.disabled = true;
      });
      updateWeakCount();
      announce('間違えた単語を苦手に追加しました。');
    });
    app.querySelectorAll('[data-add-mock-weak]').forEach(button => {
      button.addEventListener('click', () => {
        studyStorage.markWrong(button.dataset.addMockWeak);
        button.textContent = '★ 追加済み';
        button.disabled = true;
        updateWeakCount();
      });
    });
  }

  document.querySelectorAll('[data-mode]').forEach(button => {
    button.addEventListener('click', () => setMode(button.dataset.mode));
  });
  window.addEventListener('tocfl-study-updated', updateWeakCount);

  updateWeakCount();
  const requestedMode = new URLSearchParams(location.search).get('mode');
  setMode(validModes.has(requestedMode) ? requestedMode : 'weak');
})();
