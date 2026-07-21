(function(){
  const progressStorage = window.tocflProgressStorage || localStorage;
  const lessons = window.TOCFL_COURSE?.lessons || [];
  const readings = window.TOCFL_READINGS || [];
  const requestedDay = Number(document.body.dataset.day || new URLSearchParams(location.search).get('day'));
  const lesson = lessons.find(item => item.day === requestedDay);
  const reading = readings.find(item => item.day === requestedDay);
  const previousLesson = lessons.find(item => item.day === requestedDay - 1);
  const nextLesson = lessons.find(item => item.day === requestedDay + 1);

  const lessonHref = day => {
    if(day === 1) return 'day1.html';
    if(day === 2) return 'day2.html';
    if(day === 3) return 'day3.html';
    return `course.html?day=${day}`;
  };

  if(!lesson || !reading || requestedDay < 3){
    document.title = '教材が見つかりません | TOCFL Band B Study';
    document.getElementById('lessonApp').innerHTML = `
      <section class="card">
        <h2>教材が見つかりません</h2>
        <p>ホーム画面から学習するDayを選び直してください。</p>
        <a class="primary-button" href="../index.html">ホームへ戻る</a>
      </section>`;
    return;
  }

  document.title = `Day ${lesson.day} | TOCFL Band B Study`;
  document.getElementById('lessonLabel').textContent = `Day ${lesson.day}`;
  document.getElementById('unitBadge').textContent = `Unit ${lesson.unit}・Day ${lesson.day}`;
  document.getElementById('heroTitle').textContent = `今日の${lesson.words.length + 22}分TOCFL`;
  document.getElementById('heroTheme').textContent = `テーマ：${lesson.theme}`;
  document.getElementById('lessonExampleLink').href = `../examples/?day=${lesson.day}`;

  const previousLink = document.getElementById('previousLink');
  if(previousLesson){
    previousLink.href = lessonHref(previousLesson.day);
    previousLink.textContent = `Day ${previousLesson.day}`;
  }else{
    previousLink.hidden = true;
  }

  const key = (type, index = '') => `tocfl_course_v2_day${lesson.day}_${type}${index}`;
  const completeKey = `tocfl_course_v2_day${lesson.day}_complete`;
  const readingQuestionKey = index => `tocfl_reading_v1_day${lesson.day}_q_${index}`;
  const readingCompleteKey = `tocfl_reading_v1_day${lesson.day}_complete`;
  const totalSteps = lesson.words.length + 3;

  document.getElementById('lessonApp').innerHTML = `
    <section class="card">
      <h2>今日の流れ</h2>
      <div class="grid lesson-flow">
        <div><strong>① 前日の復習</strong><br>3分</div>
        <div><strong>② 新しい単語${lesson.words.length}語</strong><br>${lesson.words.length + 4}分</div>
        <div><strong>③ 聞き取り</strong><br>3分</div>
        <div><strong>④ 読解練習</strong><br>8分</div>
        <div><strong>⑤ 仕上げクイズ</strong><br>4分</div>
      </div>
      <div class="progress" aria-label="Day ${lesson.day}の単語・復習進捗"><span id="lessonProgress"></span></div>
      <p class="muted" id="lessonProgressText">進捗：0 / ${totalSteps}</p>
      <p class="source-note">参考範囲：${lesson.source} の単語一覧。意味・問題構成は学習用に独自作成しています。</p>
    </section>

    <section class="card">
      <span class="eyebrow">3-MINUTE REVIEW</span>
      <h2>Day ${previousLesson?.day || lesson.day}の復習</h2>
      <p>前日の単語から3問です。ピンインを見ず、意味から答えてみましょう。</p>
      <div id="reviewQuiz"></div>
    </section>

    <div id="wordCards"></div>

    <section class="card">
      <span class="eyebrow">LISTENING</span>
      <h2>単語の聞き取り</h2>
      <p>${lesson.words.length}語を続けて聞き、2番目に読まれた単語を選びましょう。</p>
      <button type="button" class="speak listening-button" onclick="playWordSequence()">🔊 ${lesson.words.length}語を聞く</button>
      <div id="listeningQuiz"></div>
    </section>

    <section class="card reading-card" aria-labelledby="readingTitle">
      <span class="eyebrow">READING</span>
      <div class="section-head reading-heading">
        <div>
          <h2 id="readingTitle" lang="zh-Hant">${escapeHtml(reading.title)}</h2>
          <p>まず本文だけで読み、必要なときに補助を開きましょう。</p>
        </div>
        <span class="status" id="readingProgress" aria-live="polite">読解 0 / ${reading.questions.length}問</span>
      </div>
      <div class="reading-passage">
        <p id="readingText" lang="zh-TW">${escapeHtml(reading.text)}</p>
        <button type="button" class="speak" onclick="playReading()" aria-label="台湾華語で読解文を再生する">🔊 読解文を聞く</button>
      </div>
      <details class="reading-support">
        <summary>補助を見る（ピンイン・日本語訳）</summary>
        <div class="reading-support-content">
          <p class="pinyin" lang="zh-Latn"><strong>ピンイン</strong><br>${escapeHtml(reading.pinyin)}</p>
          <p class="jp"><strong>日本語訳</strong><br>${escapeHtml(reading.translation)}</p>
        </div>
      </details>
      <div class="reading-vocabulary" aria-label="本文で使う新出単語">
        <strong>単語カードで確認：</strong>
        ${reading.focusWords.map(word => {
          const index = lesson.words.findIndex(item => item.w === word);
          return index >= 0
            ? `<a class="chip vocabulary-link" href="#wordCard${index}" lang="zh-Hant">${escapeHtml(word)}</a>`
            : `<span class="chip" lang="zh-Hant">${escapeHtml(word)}</span>`;
        }).join('')}
      </div>
      <div id="readingQuiz"></div>
    </section>

    <section class="card">
      <span class="eyebrow">QUIZ</span>
      <h2>意味から選ぶ${lesson.words.length}問</h2>
      <p>日本語に合う台湾華語を選びましょう。</p>
      <div id="quiz"></div>
    </section>

    <section class="card">
      <span class="eyebrow">FINISH</span>
      <h2>今日の仕上げ</h2>
      <p>今日の単語を、音声に続いて2回読みましょう。</p>
      <div class="example">
        <p lang="zh-Hant"><strong>${lesson.words.map(item => item.w).join('、')}</strong></p>
        <p class="pinyin">${lesson.words.map(item => item.p).join(' / ')}</p>
        <button type="button" class="speak" onclick="playWordSequence()">🔊 まとめて聞く</button>
      </div>
      <button type="button" class="primary" onclick="completeLesson()">今日の学習を完了する</button>
      <p id="completeMessage" class="muted" aria-live="polite"></p>
      ${nextLesson ? `<a class="next-lesson" href="${lessonHref(nextLesson.day)}">次のDay ${nextLesson.day}へ →</a>` : '<p class="course-complete">全31日の画像準拠コースを最後まで学習しました。</p>'}
    </section>`;

  function speakText(text, rate = 0.84){
    return window.tocflSpeech.speak(text, rate);
  }

  function escapeHtml(value){
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function mark(type, index = ''){
    progressStorage.setItem(key(type, index), '1');
    updateProgress();
  }

  function updateProgress(){
    let count = 0;
    lesson.words.forEach((_, index) => {
      if(progressStorage.getItem(key('word_', index))) count++;
    });
    ['review', 'listening', 'quiz'].forEach(type => {
      if(progressStorage.getItem(key(type))) count++;
    });
    document.getElementById('lessonProgress').style.width = `${count / totalSteps * 100}%`;
    document.getElementById('lessonProgressText').textContent = `進捗：${count} / ${totalSteps}`;
  }

  function makeOptions(words, correctIndex){
    const picked = [];
    for(let offset = 0; picked.length < Math.min(3, words.length); offset++){
      const item = words[(correctIndex + offset) % words.length];
      if(!picked.includes(item)) picked.push(item);
    }
    const shift = correctIndex % picked.length;
    return picked.slice(shift).concat(picked.slice(0, shift));
  }

  function renderWords(){
    const container = document.getElementById('wordCards');
    container.innerHTML = lesson.words.map((word, index) => `
      <section class="card" id="wordCard${index}">
        <span class="eyebrow">WORD ${index + 1}/${lesson.words.length}</span>
        <div class="word" lang="zh-Hant">${word.w}</div>
        <div class="pinyin">${word.p}</div>
        <p><strong>日本語：</strong>${word.m}</p>
        <button type="button" class="speak" onclick="hearWord(${index})">🔊 単語を聞く</button>
        <div class="sense"><strong>学習のコツ：</strong>音声を聞いたあと、文字を見ずに2回発音しましょう。</div>
      </section>`).join('');

    lesson.words.forEach((_, index) => {
      if(progressStorage.getItem(key('word_', index))){
        document.getElementById(`wordCard${index}`).classList.add('done-card');
      }
    });
  }

  const reviewWords = previousLesson?.words || lesson.words;
  const reviewQuestions = reviewWords.slice(0, 3).map((word, index) => ({
    word,
    options: makeOptions(reviewWords, index)
  }));
  let reviewAnswered = 0;

  function renderReview(){
    document.getElementById('reviewQuiz').innerHTML = reviewQuestions.map((question, index) => `
      <div class="quiz-block" id="reviewBlock${index}">
        <p><strong>復習${index + 1}. 「${question.word.m}」はどれですか。</strong></p>
        ${question.options.map((option, optionIndex) => `
          <button type="button" class="choice" onclick="answerReview(this, ${index}, ${optionIndex})">
            <span lang="zh-Hant">${option.w}</span>
          </button>`).join('')}
        <div class="answer" id="reviewAnswer${index}"></div>
      </div>`).join('');
  }

  const listeningTarget = lesson.words[Math.min(1, lesson.words.length - 1)];
  const listeningOptions = makeOptions(lesson.words, Math.min(1, lesson.words.length - 1));

  function renderListening(){
    document.getElementById('listeningQuiz').innerHTML = `
      <p><strong>2番目の単語はどれですか。</strong></p>
      ${listeningOptions.map((option, index) => `
        <button type="button" class="choice" onclick="answerListening(this, ${index})">
          <span lang="zh-Hant">${option.w}</span>
        </button>`).join('')}
      <div class="answer" id="listeningAnswer"></div>`;
  }

  function readingAnsweredCount(){
    return reading.questions.filter((_, index) => progressStorage.getItem(readingQuestionKey(index)) === '1').length;
  }

  function updateReadingProgress(){
    const count = readingAnsweredCount();
    const progress = document.getElementById('readingProgress');
    if(progress){
      progress.textContent = count === reading.questions.length
        ? `読解 ${count} / ${reading.questions.length}問 完了`
        : `読解 ${count} / ${reading.questions.length}問`;
      progress.classList.toggle('done', count === reading.questions.length);
    }
  }

  function renderReading(){
    document.getElementById('readingQuiz').innerHTML = reading.questions.map((question, questionIndex) => `
      <div class="quiz-block reading-question" id="readingBlock${questionIndex}" role="group" aria-labelledby="readingQuestion${questionIndex}">
        <h3 id="readingQuestion${questionIndex}" lang="zh-Hant">Q${questionIndex + 1}. ${escapeHtml(question.prompt)}</h3>
        <div class="reading-options">
          ${question.options.map((option, optionIndex) => `
            <button type="button" class="choice" onclick="answerReading(this, ${questionIndex}, ${optionIndex})" aria-label="選択肢 ${String.fromCharCode(65 + optionIndex)}、${escapeHtml(option)}">
              <span aria-hidden="true">${String.fromCharCode(65 + optionIndex)}.</span> <span lang="zh-Hant">${escapeHtml(option)}</span>
            </button>`).join('')}
        </div>
        <div class="answer reading-answer" id="readingAnswer${questionIndex}" role="status" aria-live="polite"></div>
      </div>`).join('');
  }

  function updateReadingWeakButton(button, word){
    const active = window.tocflStudyStorage?.isWeak(word) === true;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
    button.textContent = active ? `★「${word}」を苦手から解除` : `☆「${word}」を苦手に追加`;
  }

  function appendReadingWeakButton(answer, word){
    if(!word || !window.tocflStudyStorage) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'weak-toggle reading-weak-toggle';
    button.dataset.word = word;
    button.addEventListener('click', () => {
      if(window.tocflStudyStorage.isWeak(word)) window.tocflStudyStorage.resolve(word);
      else window.tocflStudyStorage.addManual(word);
      updateReadingWeakButton(button, word);
    });
    updateReadingWeakButton(button, word);
    answer.appendChild(button);
  }

  const quizQuestions = lesson.words.map((word, index) => ({
    word,
    options: makeOptions(lesson.words, index)
  }));
  let quizAnswered = 0;

  function renderQuiz(){
    document.getElementById('quiz').innerHTML = quizQuestions.map((question, index) => `
      <div class="quiz-block" id="quizBlock${index}">
        <p><strong>Q${index + 1}. 「${question.word.m}」はどれですか。</strong></p>
        ${question.options.map((option, optionIndex) => `
          <button type="button" class="choice" onclick="answerQuiz(this, ${index}, ${optionIndex})">
            <span lang="zh-Hant">${option.w}</span>
          </button>`).join('')}
        <div class="answer" id="quizAnswer${index}"></div>
      </div>`).join('');
  }

  window.hearWord = function(index){
    speakText(lesson.words[index].w);
    mark('word_', index);
    document.getElementById(`wordCard${index}`).classList.add('done-card');
  };

  window.playWordSequence = function(){
    speakText(lesson.words.map(item => item.w).join('。'), 0.76);
  };

  window.playReading = function(){
    speakText(reading.text, 0.82);
  };

  window.answerReview = function(button, questionIndex, optionIndex){
    const block = document.getElementById(`reviewBlock${questionIndex}`);
    if(block.dataset.done) return;
    block.dataset.done = '1';
    const buttons = block.querySelectorAll('.choice');
    buttons.forEach(item => item.disabled = true);
    const question = reviewQuestions[questionIndex];
    const correctIndex = question.options.indexOf(question.word);
    const correct = optionIndex === correctIndex;
    if(!correct) window.tocflStudyStorage?.markWrong(question.word.w);
    button.classList.add(correct ? 'correct' : 'wrong');
    if(!correct) buttons[correctIndex].classList.add('correct');
    const answer = document.getElementById(`reviewAnswer${questionIndex}`);
    answer.classList.add('show');
    answer.innerHTML = `${correct ? '○ 正解' : '正解を確認しましょう'}：<strong lang="zh-Hant">${question.word.w}</strong> <span class="pinyin">${question.word.p}</span><br>${question.word.m}`;
    reviewAnswered++;
    if(reviewAnswered === reviewQuestions.length) mark('review');
  };

  window.answerListening = function(button, optionIndex){
    const container = document.getElementById('listeningQuiz');
    if(container.dataset.done) return;
    container.dataset.done = '1';
    const buttons = container.querySelectorAll('.choice');
    buttons.forEach(item => item.disabled = true);
    const correctIndex = listeningOptions.indexOf(listeningTarget);
    const correct = optionIndex === correctIndex;
    if(!correct) window.tocflStudyStorage?.markWrong(listeningTarget.w);
    button.classList.add(correct ? 'correct' : 'wrong');
    if(!correct) buttons[correctIndex].classList.add('correct');
    const answer = document.getElementById('listeningAnswer');
    answer.classList.add('show');
    answer.innerHTML = `${correct ? '○ 正解です。' : '正解を確認しましょう。'}<br>2番目は <strong lang="zh-Hant">${listeningTarget.w}</strong> <span class="pinyin">${listeningTarget.p}</span>（${listeningTarget.m}）です。`;
    mark('listening');
  };

  window.answerReading = function(button, questionIndex, optionIndex){
    const block = document.getElementById(`readingBlock${questionIndex}`);
    if(block.dataset.done) return;
    block.dataset.done = '1';
    const buttons = block.querySelectorAll('.choice');
    buttons.forEach(item => item.disabled = true);
    const question = reading.questions[questionIndex];
    const correct = optionIndex === question.answer;
    button.classList.add(correct ? 'correct' : 'wrong');
    if(!correct) buttons[question.answer].classList.add('correct');

    const answer = document.getElementById(`readingAnswer${questionIndex}`);
    answer.classList.add('show');
    answer.innerHTML = `
      <p class="reading-result"><strong>${correct ? '○ 正解です。' : `正解は${String.fromCharCode(65 + question.answer)}です。`}</strong></p>
      <p>${escapeHtml(question.explanation)}</p>
      <blockquote class="reading-evidence" lang="zh-Hant"><strong>本文の根拠：</strong><br>${escapeHtml(question.evidence)}</blockquote>`;
    if(!correct) appendReadingWeakButton(answer, question.word);

    progressStorage.setItem(readingQuestionKey(questionIndex), '1');
    if(readingAnsweredCount() === reading.questions.length){
      progressStorage.setItem(readingCompleteKey, '1');
    }
    updateReadingProgress();
  };

  window.answerQuiz = function(button, questionIndex, optionIndex){
    const block = document.getElementById(`quizBlock${questionIndex}`);
    if(block.dataset.done) return;
    block.dataset.done = '1';
    const buttons = block.querySelectorAll('.choice');
    buttons.forEach(item => item.disabled = true);
    const question = quizQuestions[questionIndex];
    const correctIndex = question.options.indexOf(question.word);
    const correct = optionIndex === correctIndex;
    if(!correct) window.tocflStudyStorage?.markWrong(question.word.w);
    button.classList.add(correct ? 'correct' : 'wrong');
    if(!correct) buttons[correctIndex].classList.add('correct');
    const answer = document.getElementById(`quizAnswer${questionIndex}`);
    answer.classList.add('show');
    answer.innerHTML = `${correct ? '○ 正解' : '正解を確認しましょう'}：<strong lang="zh-Hant">${question.word.w}</strong> <span class="pinyin">${question.word.p}</span>`;
    quizAnswered++;
    if(quizAnswered === quizQuestions.length) mark('quiz');
  };

  window.completeLesson = function(){
    progressStorage.setItem(completeKey, '1');
    document.getElementById('completeMessage').textContent = `○ Day ${lesson.day}を完了しました。ホーム画面にも保存されます。`;
  };

  renderReview();
  renderWords();
  renderListening();
  renderReading();
  renderQuiz();
  updateProgress();
  updateReadingProgress();
  if(progressStorage.getItem(completeKey)){
    document.getElementById('completeMessage').textContent = `○ Day ${lesson.day}は完了済みです。`;
  }

  window.addEventListener('tocfl-progress-updated', () => location.reload());
})();
