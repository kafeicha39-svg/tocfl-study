
const progressStorage = window.tocflProgressStorage || localStorage;

const words = [
  {
    w:"面對", p:"miànduì", m:"向き合う・直面する",
    coll:["面對問題","面對困難","面對挑戰","面對壓力"],
    e:"大學畢業後，我們必須面對就業的問題。",
    ep:"Dàxué bìyè hòu, wǒmen bìxū miànduì jiùyè de wèntí.",
    j:"大学卒業後、私たちは就職の問題に向き合わなければなりません。"
  },
  {
    w:"相處", p:"xiāngchǔ", m:"人と付き合う・一緒に過ごす",
    coll:["跟同事相處","和平相處","相處得很好"],
    e:"我跟新同事相處得很好。",
    ep:"Wǒ gēn xīn tóngshì xiāngchǔ de hěn hǎo.",
    j:"私は新しい同僚とうまく付き合っています。"
  },
  {
    w:"支持", p:"zhīchí", m:"支持する・応援する",
    coll:["支持決定","支持活動","得到支持"],
    e:"家人都支持我去臺灣留學。",
    ep:"Jiārén dōu zhīchí wǒ qù Táiwān liúxué.",
    j:"家族はみな、私が台湾へ留学することを応援しています。"
  },
  {
    w:"根據", p:"gēnjù", m:"〜に基づいて・根拠",
    coll:["根據資料","根據統計","根據經驗"],
    e:"根據統計，越來越多人選擇在家工作。",
    ep:"Gēnjù tǒngjì, yuèláiyuè duō rén xuǎnzé zài jiā gōngzuò.",
    j:"統計によると、在宅勤務を選ぶ人がますます増えています。"
  },
  {
    w:"統計", p:"tǒngjì", m:"統計・統計する",
    coll:["統計資料","人口統計","根據統計"],
    e:"這份統計資料顯示，年輕人的生活方式正在改變。",
    ep:"Zhè fèn tǒngjì zīliào xiǎnshì, niánqīngrén de shēnghuó fāngshì zhèngzài gǎibiàn.",
    j:"この統計資料は、若者の生活様式が変化していることを示しています。"
  }
];

const quizData = [
  {q:"「向き合う・直面する」はどれ？", opts:["支持","面對","統計"], a:1},
  {q:"「根據統計」の意味は？", opts:["統計によると","統計を支持する","統計と付き合う"], a:0},
  {q:"「跟同事相處得很好」の意味は？", opts:["同僚を統計した","同僚とうまく付き合っている","同僚に反対した"], a:1}
];

function speakText(text){
  return window.tocflSpeech.speak(text, 0.85);
}

function mark(key){
  if(!progressStorage.getItem(key)) progressStorage.setItem(key,'1');
  updateProgress();
}

function updateProgress(){
  let count = 0;
  for(let i=0;i<5;i++) if(progressStorage.getItem('tocfl_day1_word_'+i)) count++;
  if(progressStorage.getItem('tocfl_day1_reading')) count++;
  if(progressStorage.getItem('tocfl_day1_quiz')) count++;
  document.getElementById('lessonProgress').style.width = `${count/7*100}%`;
  document.getElementById('lessonProgressText').textContent = `進捗：${count} / 7`;
}

function renderWords(){
  document.getElementById('wordCards').innerHTML = words.map((x,i)=>`
    <section class="card" id="wordCard${i}">
      <span class="eyebrow">WORD ${i+1}/5</span>
      <div class="word">${x.w}</div>
      <div class="pinyin">${x.p}</div>
      <p><strong>意味：</strong>${x.m}</p>
      <button class="speak" onclick="speakText('${x.w}'); mark('tocfl_day1_word_${i}'); document.getElementById('wordCard${i}').classList.add('done-card')">🔊 単語を聞く</button>
      <div class="collocations">${x.coll.map(c=>`<span class="chip">${c}</span>`).join('')}</div>
      <div class="example">
        <p><strong>${x.e}</strong></p>
        <p class="pinyin">${x.ep}</p>
        <p class="jp">${x.j}</p>
        <button class="speak" onclick="speakText('${x.e}'); mark('tocfl_day1_word_${i}'); document.getElementById('wordCard${i}').classList.add('done-card')">🔊 例文を聞く</button>
      </div>
    </section>
  `).join('');
}

function answerReading(btn,index){
  const buttons = btn.parentElement.querySelectorAll('.choice');
  buttons.forEach(b=>b.disabled=true);
  const ok = index===1;
  btn.classList.add(ok?'correct':'wrong');
  if(!ok) buttons[1].classList.add('correct');
  const box = document.getElementById('readingAnswer');
  box.classList.add('show');
  box.textContent = ok
    ? '✅ 正解です。「不太習慣公司的文化，也不知道該怎麼跟同事相處」が根拠です。'
    : '❌ 正解はBです。「不太習慣公司的文化，也不知道該怎麼跟同事相處」が根拠です。';
  mark('tocfl_day1_reading');
}

let quizAnswered = 0;
function renderQuiz(){
  document.getElementById('quiz').innerHTML = quizData.map((x,i)=>`
    <div class="quiz-block">
      <p><strong>Q${i+1}. ${x.q}</strong></p>
      ${x.opts.map((o,j)=>`<button class="choice" onclick="answerQuiz(this,${i},${j})">${String.fromCharCode(65+j)}. ${o}</button>`).join('')}
      <div class="answer" id="quizAnswer${i}"></div>
    </div>
  `).join('');
}

function answerQuiz(btn,i,j){
  const group = btn.parentElement;
  if(group.dataset.done) return;
  group.dataset.done='1';
  const buttons = group.querySelectorAll('.choice');
  buttons.forEach(b=>b.disabled=true);
  const ok = j===quizData[i].a;
  btn.classList.add(ok?'correct':'wrong');
  if(!ok) buttons[quizData[i].a].classList.add('correct');
  const answer = document.getElementById('quizAnswer'+i);
  answer.classList.add('show');
  answer.textContent = ok ? '✅ 正解' : '❌ 正解を確認しましょう';
  quizAnswered++;
  if(quizAnswered===3) mark('tocfl_day1_quiz');
}

function completeLesson(){
  progressStorage.setItem('tocfl_day1_complete','1');
  document.getElementById('completeMessage').textContent = '✅ Day 1を完了しました。ホーム画面にも保存されます。';
}

renderWords();
renderQuiz();
updateProgress();

window.addEventListener('tocfl-progress-updated', () => location.reload());
