import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';

const root = path.resolve(import.meta.dirname, '..');

function assert(condition, message){
  if(!condition) throw new Error(message);
}

function read(relativePath){
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const courseContext = {window: {}};
vm.createContext(courseContext);
vm.runInContext(read('assets/js/course-data.js'), courseContext);
const lessons = courseContext.window.TOCFL_COURSE.lessons;
const words = lessons.flatMap(lesson => lesson.words);
assert(lessons.length === 31, 'Dayの数が31ではありません。');
assert(lessons.every((lesson, index) => lesson.day === index + 1), 'Day 1〜31が連続していません。');
assert(words.every(word => word.w && word.p && word.m), '単語データに不足があります。');

const readingContext = {window: {}};
vm.createContext(readingContext);
vm.runInContext(read('assets/js/reading-data.js'), readingContext);
const readings = readingContext.window.TOCFL_READINGS;
assert(readings.length === 29, 'Day 3〜31の読解データが29日分ではありません。');
assert(readings.every((reading, index) => reading.day === index + 3), '読解のDay 3〜31が連続していません。');
readings.forEach(reading => {
  const lesson = lessons.find(item => item.day === reading.day);
  assert(reading.title && reading.text && reading.pinyin && reading.translation, `Day ${reading.day}の読解本文または補助が不足しています。`);
  assert(reading.questions.length >= 2 && reading.questions.length <= 3, `Day ${reading.day}の設問数が2〜3問ではありません。`);
  assert(reading.day < 13 || reading.questions.length === 3, `Day ${reading.day}の後半読解が3問構成ではありません。`);
  assert(reading.focusWords.length >= 3, `Day ${reading.day}の重要単語が不足しています。`);
  reading.focusWords.forEach(word => {
    assert(lesson.words.some(item => item.w === word), `Day ${reading.day}の重要単語「${word}」が単語データと結び付いていません。`);
  });
  reading.questions.forEach((question, index) => {
    assert(question.prompt && question.explanation && question.evidence, `Day ${reading.day} Q${index + 1}の解説または根拠が不足しています。`);
    assert(question.options.length >= 3, `Day ${reading.day} Q${index + 1}の選択肢が不足しています。`);
    assert(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.options.length, `Day ${reading.day} Q${index + 1}の正解番号が不正です。`);
    assert(lesson.words.some(item => item.w === question.word), `Day ${reading.day} Q${index + 1}の苦手単語が既存単語と結び付いていません。`);
  });
  const traditionalText = [
    reading.title,
    reading.text,
    ...reading.focusWords,
    ...reading.questions.flatMap(question => [question.prompt, question.evidence, ...question.options])
  ].join('');
  assert(!/[这发后里为个么还国门开当术画进会长实学间现让听说与万岁历医达过对无将书广气边东车号网台]/.test(traditionalText), `Day ${reading.day}の中国語欄に簡体字が含まれています。`);
});
assert(readings.at(-1).text.length > readings[0].text.length, '後半の読解文が前半より長くなっていません。');

new vm.Script(read('assets/js/reading-data.js'), {filename: 'reading-data.js'});
new vm.Script(read('assets/js/course-lesson.js'), {filename: 'course-lesson.js'});

const exampleContext = {window: {}};
vm.createContext(exampleContext);
vm.runInContext(read('assets/js/example-data.js'), exampleContext);
const exampleDays = exampleContext.window.TOCFL_EXAMPLES;
assert(Array.isArray(exampleDays), '例文データが配列ではありません。');
assert(exampleDays.length === 31, '例文データがDay 1〜31の31日分ではありません。');
assert(exampleDays.every((item, index) => item.day === index + 1), '例文データのDay 1〜31が連続していません。');

const toneMarkPattern = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/i;
const simplifiedPattern = /[这发后为个么还国门开当术画进会长实学间现让听说与万岁历医达过对无将书广气边东车号网台]/;

exampleDays.forEach(exampleDay => {
  const lesson = lessons.find(item => item.day === exampleDay.day);
  assert(lesson, `Day ${exampleDay.day}に対応するコースデータがありません。`);
  assert(exampleDay.theme === lesson.theme, `Day ${exampleDay.day}のテーマがコースデータと一致しません。`);
  assert(exampleDay.words.length === lesson.words.length, `Day ${exampleDay.day}の単語数がコースデータと一致しません。`);

  exampleDay.words.forEach((exampleWord, index) => {
    const courseWord = lesson.words[index];
    assert(exampleWord.word === courseWord.w, `Day ${exampleDay.day}の単語「${exampleWord.word}」がコースデータの語順と一致しません。`);
    assert(exampleWord.pinyin === courseWord.p, `Day ${exampleDay.day}「${exampleWord.word}」のピンインがコースデータと一致しません。`);
    const isPreservedDay3Meaning = exampleDay.day === 3
      && exampleWord.word === '互助'
      && exampleWord.meaning === '助け合い・相互扶助'
      && courseWord.m === '助け合う・相互扶助';
    assert(exampleWord.meaning === courseWord.m || isPreservedDay3Meaning, `Day ${exampleDay.day}「${exampleWord.word}」の意味がコースデータと一致しません。`);
    assert(exampleWord.word && exampleWord.pinyin && exampleWord.meaning && exampleWord.note, `Day ${exampleDay.day}「${exampleWord.word}」の単語・ピンイン・意味・使い方メモが不足しています。`);
    assert(toneMarkPattern.test(exampleWord.pinyin), `Day ${exampleDay.day}「${exampleWord.word}」のピンインに声調記号がありません。`);
    assert(exampleWord.examples.length === 2, `Day ${exampleDay.day}「${exampleWord.word}」の例文が2件ではありません。`);
    exampleWord.examples.forEach((example, exampleIndex) => {
      assert(example.chinese && example.pinyin && example.japanese, `Day ${exampleDay.day}「${exampleWord.word}」例文${exampleIndex + 1}の中文・ピンイン・日本語訳が不足しています。`);
      assert(example.chinese.includes(exampleWord.word), `Day ${exampleDay.day}「${exampleWord.word}」例文${exampleIndex + 1}に対象単語がありません。`);
      assert(toneMarkPattern.test(example.pinyin), `Day ${exampleDay.day}「${exampleWord.word}」例文${exampleIndex + 1}のピンインに声調記号がありません。`);
      assert(!simplifiedPattern.test(example.chinese), `Day ${exampleDay.day}「${exampleWord.word}」例文${exampleIndex + 1}に簡体字が含まれています。`);
    });
  });

  assert(exampleDay.summaryExamples.length === 2, `Day ${exampleDay.day}のまとめ例文が2件ではありません。`);
  exampleDay.summaryExamples.forEach((example, index) => {
    assert(example.chinese && example.pinyin && example.japanese, `Day ${exampleDay.day}まとめ例文${index + 1}の中文・ピンイン・日本語訳が不足しています。`);
    assert(toneMarkPattern.test(example.pinyin), `Day ${exampleDay.day}まとめ例文${index + 1}のピンインに声調記号がありません。`);
    assert(!simplifiedPattern.test(example.chinese), `Day ${exampleDay.day}まとめ例文${index + 1}に簡体字が含まれています。`);
    const usedWords = exampleDay.words.filter(item => example.chinese.includes(item.word));
    assert(usedWords.length >= 2, `Day ${exampleDay.day}まとめ例文${index + 1}で複数の対象単語が使われていません。`);
  });
});

const day3Examples = exampleDays.find(item => item.day === 3);
assert(day3Examples?.theme === '協力と判断', 'Day 3の例文テーマが不正です。');
assert(day3Examples.words.length === 5, 'Day 3の例文単語が5語ではありません。');
assert(['順利','恰當','依據','協調','互助'].every(word => day3Examples.words.some(item => item.word === word)), 'Day 3の対象単語が不足しています。');
const day3Fingerprint = crypto.createHash('sha256').update(JSON.stringify(day3Examples)).digest('hex');
assert(day3Fingerprint === '30f4e2216fbe3e7a7017de255b40eca63169c97841e44870831feecb41da0b26', '公開済みのDay 3例文データが変更されています。');
new vm.Script(read('assets/js/example-data.js'), {filename: 'example-data.js'});

const examplePage = read('examples/index.html');
assert(examplePage.includes('...data.map(day =>'), 'Dayフィルターが全例文データから自動生成されていません。');
assert(examplePage.includes('item.word') && examplePage.includes('item.meaning') && examplePage.includes('example.chinese'), '単語・意味・例文の検索対象が不足しています。');
assert(examplePage.includes('setTranslationVisibility') && examplePage.includes('tocfl_examples_translation'), '日本語訳の表示切替がありません。');
assert(examplePage.includes("['normal', 'large', 'xlarge']") && examplePage.includes('tocfl_examples_size'), '文字サイズの3段階切替がありません。');
assert(examplePage.includes('`../lessons/course.html?day=${day}`'), 'Day 4〜31から共用レッスン画面へ戻るリンクがありません。');
assert(read('lessons/day1.html').includes('../examples/?day=1'), 'Day 1から例文集へのリンクがありません。');
assert(read('lessons/day2.html').includes('../examples/?day=2'), 'Day 2から例文集へのリンクがありません。');
assert(read('lessons/day3.html').includes('../examples/?day=3'), 'Day 3から例文集へのリンクがありません。');
assert(read('lessons/course.html').includes('id="lessonExampleLink"'), 'Day 4〜31から例文集へのリンクがありません。');
assert(read('assets/js/course-lesson.js').includes("`../examples/?day=${lesson.day}`"), 'Day 4〜31の例文リンクが選択中のDayと連動していません。');

const htmlFiles = [
  'index.html',
  'practice.html',
  'examples/index.html',
  ...fs.readdirSync(path.join(root, 'lessons'))
    .filter(file => file.endsWith('.html'))
    .map(file => `lessons/${file}`)
];
for(const htmlFile of htmlFiles){
  const html = read(htmlFile);
  for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){
    const reference = match[1].split(/[?#]/)[0];
    if(!reference || reference.includes('${') || /^(https?:|mailto:)/.test(reference)) continue;
    const target = path.resolve(root, path.dirname(htmlFile), reference);
    assert(fs.existsSync(target), `${htmlFile} の参照先 ${reference} がありません。`);
  }
}

const speech = read('assets/js/speech.js');
assert(speech.includes("voice.lang.toLowerCase() === 'zh-tw'"), '音声候補がzh-TWだけに限定されていません。');
assert(speech.includes("utterance.lang = 'zh-TW'"), '読み上げ言語がzh-TWではありません。');
assert(!/utterance\.lang\s*=\s*['"](?!zh-TW)/.test(speech), 'zh-TW以外の読み上げ設定があります。');

const appScript = read('assets/js/app.js');
assert(appScript.includes('tocfl_day${day}_complete'), 'Day 1・2の完了キーが変わっています。');
assert(appScript.includes('tocfl_course_v2_day${day}_complete'), 'Day 3〜31の完了キーが変わっています。');

const courseLesson = read('assets/js/course-lesson.js');
assert(courseLesson.includes('tocfl_reading_v1_day${lesson.day}_q_${index}'), '読解設問の追加進捗キーがありません。');
assert(courseLesson.includes('tocfl_reading_v1_day${lesson.day}_complete'), '読解完了の追加進捗キーがありません。');
assert(courseLesson.includes("speakText(reading.text, 0.82)"), '読解文の音声再生がありません。');
assert(courseLesson.includes('補助を見る（ピンイン・日本語訳）'), '読解補助の折りたたみ表示がありません。');
assert(courseLesson.includes('appendReadingWeakButton(answer, question.word)'), '読解誤答時の苦手追加機能がありません。');
assert(!courseLesson.includes("setItem(completeKey, '0')"), '既存のDay完了記録を戻す処理があります。');

const progressMemory = new Map();
const progressEvents = [];
const progressContext = {
  localStorage: {
    getItem: key => progressMemory.has(key) ? progressMemory.get(key) : null,
    setItem: (key, value) => progressMemory.set(key, String(value))
  },
  CustomEvent: class {
    constructor(type, init){ this.type = type; this.detail = init?.detail; }
  },
  window: {
    dispatchEvent: event => progressEvents.push(event)
  }
};
progressContext.window.window = progressContext.window;
vm.createContext(progressContext);
vm.runInContext(read('assets/js/progress-storage.js'), progressContext);
progressContext.window.tocflProgressStorage.setItem('tocfl_reading_v1_day3_q_0', '1');
assert(progressMemory.get('tocfl_reading_v1_day3_q_0') === '1', '読解進捗が端末内に保存されません。');
assert(progressEvents.some(event => event.type === 'tocfl-progress-local-change'), '読解進捗からFirebase同期イベントが発生しません。');

const memory = new Map();
const events = [];
const storageContext = {
  localStorage: {
    getItem: key => memory.has(key) ? memory.get(key) : null,
    setItem: (key, value) => memory.set(key, String(value))
  },
  CustomEvent: class {
    constructor(type, init){ this.type = type; this.detail = init?.detail; }
  },
  window: {
    dispatchEvent: event => events.push(event)
  },
  Date
};
storageContext.window.window = storageContext.window;
vm.createContext(storageContext);
vm.runInContext(read('assets/js/study-storage.js'), storageContext);
const study = storageContext.window.tocflStudyStorage;
study.addManual('面對');
assert(study.isWeak('面對'), '手動追加した苦手が保存されません。');
study.markWrong('面對');
assert(study.getEntry('面對').wrongCount === 1, '間違い回数が保存されません。');
study.resolve('面對');
assert(!study.isWeak('面對'), '苦手を解除できません。');
assert(study.getEntry('面對').active === false, '解除情報が同期用に残りません。');
assert(events.some(event => event.type === 'tocfl-study-local-change'), '端末内変更の同期イベントがありません。');

const rules = read('firestore.rules');
assert(rules.includes("request.auth.uid == userId"), '本人確認ルールがありません。');
assert(rules.includes("match /users/{userId}/progress/{progressDoc}"), '既存進捗ルールがありません。');
assert(rules.includes("match /users/{userId}/study/{studyDoc}"), '苦手情報ルールがありません。');
assert((rules.match(/allow delete: if false;/g) || []).length === 2, '削除禁止ルールが不足しています。');

console.log(`OK: ${lessons.length}日、${words.length}単語、${readings.length}読解、${htmlFiles.length}画面を検証しました。`);
