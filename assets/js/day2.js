const words = [
  {
    w: '團體', p: 'tuántǐ', m: '団体・集団', type: '名詞',
    sense: '共通の目的や活動を持つ「人の集まり」。組織そのものより、人々のまとまりに焦点があります。',
    coll: ['團體活動', '團體合作', '團體成員', '社會團體'],
    e: '參加團體活動，可以讓我們學會跟不同的人合作。',
    ep: 'Cānjiā tuántǐ huódòng, kěyǐ ràng wǒmen xuéhuì gēn bùtóng de rén hézuò.',
    j: '団体活動に参加すると、さまざまな人と協力することを学べます。'
  },
  {
    w: '組織', p: 'zǔzhī', m: '組織・組織する', type: '名詞・動詞',
    sense: '名詞では仕組みを持つ集団、動詞では人や物事をまとめて形にすることを表します。',
    coll: ['非營利組織', '組織成員', '組織活動', '組織能力'],
    e: '這個組織長期為偏鄉的孩子提供學習資源。',
    ep: 'Zhège zǔzhī chángqí wèi piānxiāng de háizi tígōng xuéxí zīyuán.',
    j: 'この組織は長年、地方の子どもたちに学習資源を提供しています。'
  },
  {
    w: '服從', p: 'fúcóng', m: '従う・服従する', type: '動詞',
    sense: '命令・規則・上位者の判断に従う、やや硬く強い表現です。「聽」のような日常的な「言うことを聞く」より形式的です。',
    coll: ['服從命令', '服從安排', '服從規定', '絕對服從'],
    e: '員工不應該盲目服從不合理的命令。',
    ep: 'Yuángōng bù yīnggāi mángmù fúcóng bù hélǐ de mìnglìng.',
    j: '従業員は不合理な命令に盲目的に従うべきではありません。'
  },
  {
    w: '領導', p: 'lǐngdǎo', m: '指導する・率いる・指導者', type: '動詞・名詞',
    sense: '人々をまとめ、方向を示して進めること。人を指す名詞として使われる場合もあります。',
    coll: ['領導團隊', '領導能力', '領導者', '在他的領導下'],
    e: '她很會領導團隊，也願意聽取成員的意見。',
    ep: 'Tā hěn huì lǐngdǎo tuánduì, yě yuànyì tīngqǔ chéngyuán de yìjiàn.',
    j: '彼女はチームを率いるのが上手で、メンバーの意見にも耳を傾けます。'
  },
  {
    w: '權力', p: 'quánlì', m: '権力・権限', type: '名詞',
    sense: '人や組織を動かしたり決定したりできる力。「権利」を表す同音の「權利」と区別しましょう。',
    coll: ['行使權力', '掌握權力', '權力關係', '濫用權力'],
    e: '管理者如果濫用權力，很容易失去大家的信任。',
    ep: 'Guǎnlǐzhě rúguǒ lànyòng quánlì, hěn róngyì shīqù dàjiā de xìnrèn.',
    j: '管理者が権力を乱用すると、皆の信頼を失いやすくなります。'
  }
];

const reviewData = [
  {
    q: '「向き合う・直面する」はどれですか。',
    opts: [['支持','zhīchí'], ['面對','miànduì'], ['相處','xiāngchǔ']], a: 1,
    zh: '面對', p: 'miànduì', j: '向き合う・直面する'
  },
  {
    q: '「人とうまく付き合う」はどれですか。',
    opts: [['相處','xiāngchǔ'], ['統計','tǒngjì'], ['根據','gēnjù']], a: 0,
    zh: '相處', p: 'xiāngchǔ', j: '人と付き合う・一緒に過ごす'
  },
  {
    q: '「統計によると」を表す組み合わせはどれですか。',
    opts: [['支持統計','zhīchí tǒngjì'], ['相處統計','xiāngchǔ tǒngjì'], ['根據統計','gēnjù tǒngjì']], a: 2,
    zh: '根據統計', p: 'gēnjù tǒngjì', j: '統計によると'
  }
];

const quizData = [
  {
    q: '「命令や指示に従う」を表す単語はどれですか。',
    opts: [['團體','tuántǐ'], ['服從','fúcóng'], ['權力','quánlì']], a: 1
  },
  {
    q: '「人をまとめて方向を示す」を表す単語はどれですか。',
    opts: [['領導','lǐngdǎo'], ['組織','zǔzhī'], ['服從','fúcóng']], a: 0
  },
  {
    q: '「管理者は権力を乱用してはいけない」の空欄に入る単語はどれですか。管理者不能濫用＿＿。',
    opts: [['權利','quánlì'], ['團體','tuántǐ'], ['權力','quánlì']], a: 2
  }
];

function speakText(text){
  return window.tocflSpeech.speak(text, 0.85);
}

function mark(key){
  if(!localStorage.getItem(key)) localStorage.setItem(key, '1');
  updateProgress();
}

function updateProgress(){
  let count = 0;
  for(let i = 0; i < 5; i++){
    if(localStorage.getItem(`tocfl_day2_word_${i}`)) count++;
  }
  if(localStorage.getItem('tocfl_day2_review')) count++;
  if(localStorage.getItem('tocfl_day2_reading')) count++;
  if(localStorage.getItem('tocfl_day2_quiz')) count++;
  const progress = document.getElementById('lessonProgress');
  const progressText = document.getElementById('lessonProgressText');
  if(progress) progress.style.width = `${count / 8 * 100}%`;
  if(progressText) progressText.textContent = `進捗：${count} / 8`;
}

function renderWords(){
  const container = document.getElementById('wordCards');
  container.innerHTML = words.map((word, index) => `
    <section class="card" id="wordCard${index}">
      <span class="eyebrow">WORD ${index + 1}/5</span>
      <div class="word" lang="zh-Hant">${word.w}</div>
      <div class="pinyin">${word.p}</div>
      <p><strong>日本語：</strong>${word.m} <span class="word-type">${word.type}</span></p>
      <button type="button" class="speak" onclick="hearWord(${index})">🔊 単語を聞く</button>
      <div class="sense"><strong>語感：</strong>${word.sense}</div>
      <div class="collocations">${word.coll.map(item => `<span class="chip" lang="zh-Hant">${item}</span>`).join('')}</div>
      <div class="example">
        <p lang="zh-Hant"><strong>${word.e}</strong></p>
        <p class="pinyin">${word.ep}</p>
        <p class="jp">${word.j}</p>
        <button type="button" class="speak" onclick="hearExample(${index})">🔊 例文を聞く</button>
      </div>
    </section>
  `).join('');

  words.forEach((_, index) => {
    if(localStorage.getItem(`tocfl_day2_word_${index}`)){
      document.getElementById(`wordCard${index}`).classList.add('done-card');
    }
  });
}

function hearWord(index){
  speakText(words[index].w);
  mark(`tocfl_day2_word_${index}`);
  document.getElementById(`wordCard${index}`).classList.add('done-card');
}

function hearExample(index){
  speakText(words[index].e);
  mark(`tocfl_day2_word_${index}`);
  document.getElementById(`wordCard${index}`).classList.add('done-card');
}

let reviewAnswered = 0;
function renderReview(){
  document.getElementById('reviewQuiz').innerHTML = reviewData.map((item, index) => `
    <div class="quiz-block" id="reviewBlock${index}">
      <p><strong>復習${index + 1}. ${item.q}</strong></p>
      ${item.opts.map((option, optionIndex) => `
        <button type="button" class="choice" onclick="answerReview(this, ${index}, ${optionIndex})">
          <span lang="zh-Hant">${option[0]}</span> <span class="choice-pinyin">${option[1]}</span>
        </button>
      `).join('')}
      <div class="answer" id="reviewAnswer${index}"></div>
    </div>
  `).join('');
}

function answerReview(button, index, optionIndex){
  const block = document.getElementById(`reviewBlock${index}`);
  if(block.dataset.done) return;
  block.dataset.done = '1';
  const buttons = block.querySelectorAll('.choice');
  buttons.forEach(item => item.disabled = true);
  const item = reviewData[index];
  const correct = optionIndex === item.a;
  button.classList.add(correct ? 'correct' : 'wrong');
  if(!correct) buttons[item.a].classList.add('correct');
  const answer = document.getElementById(`reviewAnswer${index}`);
  answer.classList.add('show');
  answer.innerHTML = `${correct ? '○ 正解' : '正解を確認しましょう'}：<strong lang="zh-Hant">${item.zh}</strong> <span class="pinyin">${item.p}</span><br>${item.j}<br><button type="button" class="speak" onclick="speakText('${item.zh}')">🔊 正解を聞く</button>`;
  reviewAnswered++;
  if(reviewAnswered === reviewData.length) mark('tocfl_day2_review');
}

function answerReading(button, index){
  const buttons = button.parentElement.querySelectorAll('.choice');
  if(button.parentElement.dataset.readingDone) return;
  button.parentElement.dataset.readingDone = '1';
  buttons.forEach(item => item.disabled = true);
  const correct = index === 2;
  button.classList.add(correct ? 'correct' : 'wrong');
  if(!correct) buttons[2].classList.add('correct');
  const answer = document.getElementById('readingAnswer');
  answer.classList.add('show');
  answer.innerHTML = `${correct ? '○ 正解です。' : '正解はCです。'}<br><span lang="zh-Hant"><strong>他都會先聽取成員的意見，再一起做決定。</strong></span><br><span class="pinyin">Tā dōu huì xiān tīngqǔ chéngyuán de yìjiàn, zài yìqǐ zuò juédìng.</span><br>彼はまずメンバーの意見を聞き、その後で一緒に決定します。<br><button type="button" class="speak" onclick="speakText('他都會先聽取成員的意見，再一起做決定。')">🔊 根拠の文を聞く</button>`;
  mark('tocfl_day2_reading');
}

let quizAnswered = 0;
function renderQuiz(){
  document.getElementById('quiz').innerHTML = quizData.map((item, index) => `
    <div class="quiz-block" id="quizBlock${index}">
      <p><strong>Q${index + 1}. ${item.q}</strong></p>
      ${item.opts.map((option, optionIndex) => `
        <button type="button" class="choice" onclick="answerQuiz(this, ${index}, ${optionIndex})">
          <span lang="zh-Hant">${option[0]}</span> <span class="choice-pinyin">${option[1]}</span>
        </button>
      `).join('')}
      <div class="answer" id="quizAnswer${index}"></div>
    </div>
  `).join('');
}

function answerQuiz(button, index, optionIndex){
  const block = document.getElementById(`quizBlock${index}`);
  if(block.dataset.done) return;
  block.dataset.done = '1';
  const buttons = block.querySelectorAll('.choice');
  buttons.forEach(item => item.disabled = true);
  const item = quizData[index];
  const correct = optionIndex === item.a;
  button.classList.add(correct ? 'correct' : 'wrong');
  if(!correct) buttons[item.a].classList.add('correct');
  const correctOption = item.opts[item.a];
  const answer = document.getElementById(`quizAnswer${index}`);
  answer.classList.add('show');
  answer.innerHTML = `${correct ? '○ 正解' : '正解を確認しましょう'}：<strong lang="zh-Hant">${correctOption[0]}</strong> <span class="pinyin">${correctOption[1]}</span><br><button type="button" class="speak" onclick="speakText('${correctOption[0]}')">🔊 正解を聞く</button>`;
  quizAnswered++;
  if(quizAnswered === quizData.length) mark('tocfl_day2_quiz');
}

function completeLesson(){
  localStorage.setItem('tocfl_day2_complete', '1');
  document.getElementById('completeMessage').textContent = '○ Day 2を完了しました。ホーム画面にも保存されます。';
}

renderReview();
renderWords();
renderQuiz();
updateProgress();
