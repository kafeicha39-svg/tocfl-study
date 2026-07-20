import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

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

const htmlFiles = [
  'index.html',
  'practice.html',
  ...fs.readdirSync(path.join(root, 'lessons'))
    .filter(file => file.endsWith('.html'))
    .map(file => `lessons/${file}`)
];
for(const htmlFile of htmlFiles){
  const html = read(htmlFile);
  for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){
    const reference = match[1].split(/[?#]/)[0];
    if(!reference || /^(https?:|mailto:)/.test(reference)) continue;
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
