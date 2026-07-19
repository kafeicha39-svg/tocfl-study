# TOCFL Band B Study

TOCFL Band B対策用の個人学習サイトです。毎日15〜25分で、台湾華語の語彙・音声・復習・クイズに取り組めます。

## 構成

- `index.html`：ホーム画面・全体進捗
- `lessons/day1.html`：Day 1
- `lessons/day2.html`：Day 1の復習＋Day 2
- `lessons/day3.html`：画像準拠コースのDay 3
- `lessons/course.html`：Day 4〜Day 31の共通レッスン画面
- `assets/css/style.css`：共通デザイン
- `assets/js/app.js`：ホーム画面の進捗管理
- `assets/js/day1.js`：Day 1の教材・進捗管理
- `assets/js/day2.js`：Day 2の教材・進捗管理
- `assets/js/course-data.js`：Day 1〜Day 31の単語・テーマデータ
- `assets/js/course-lesson.js`：Day 3〜Day 31の共通教材・進捗管理
- `assets/js/speech.js`：全Day共通の台湾華語音声選択
- `assets/js/progress-storage.js`：端末内の進捗保存
- `assets/js/progress-sync.js`：Googleログインと端末間同期
- `firestore.rules`：本人の進捗だけを読み書きできるセキュリティルール

## 教材について

提供された参考書画像2枚の単語一覧を学習範囲の参考にし、既存Dayとの重複を除いてDay 3〜Day 31へ整理しています。日本語訳、音声練習、復習、聞き取り、問題は学習用に独自作成しています。

音声再生では端末の `zh-TW`（中国語・台湾）音声だけを使用します。音声が端末にない場合は、日本語音声へ切り替えず設定方法を案内します。

## 学習進捗の保存と同期

進捗は常にブラウザー内にも保存されるため、ログインせずに利用できます。「Googleで同期」から同じGoogleアカウントへログインすると、Firebase AuthenticationとCloud Firestoreを利用してスマホ・パソコン間で完了済み項目を統合します。

- 教材本体の保管・公開はGitHub Pagesのままです。
- Firebaseへ保存するのは完了済み項目と更新時刻だけです。
- 端末内とクラウドの完了済み項目は足し合わせ、どちらかの進捗を削除しません。
- Firestoreは、ログイン本人のデータだけを読み書きできるルールにしています。
- FirebaseのWeb設定に含まれるAPIキーはプロジェクト識別用の公開設定です。データ保護にはAPIキーではなくAuthenticationと`firestore.rules`を使用します。

## GitHub Pages

Repository settings → Pages → Deploy from a branch → `main` / `(root)` を選択して公開します。
