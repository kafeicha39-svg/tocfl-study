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

console.log(`OK: ${lessons.length}日、${words.length}単語、${htmlFiles.length}画面を検証しました。`);
