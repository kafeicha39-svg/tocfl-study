# TOCFL Band B Study

TOCFL Band B対策用の個人学習サイトです。毎日15〜35分で、台湾華語の語彙・音声・読解・復習・クイズに取り組めます。

## 構成

- `index.html`：ホーム画面・全体進捗
- `practice.html`：苦手復習・ピンイン・書き取り・模試
- `lessons/day1.html`：Day 1
- `lessons/day2.html`：Day 1の復習＋Day 2
- `lessons/day3.html`：画像準拠コースのDay 3
- `lessons/course.html`：Day 4〜Day 31の共通レッスン画面
- `assets/css/style.css`：共通デザイン
- `assets/js/app.js`：ホーム画面の進捗管理
- `assets/js/day1.js`：Day 1の教材・進捗管理
- `assets/js/day2.js`：Day 2の教材・進捗管理
- `assets/js/course-data.js`：Day 1〜Day 31の単語・テーマデータ
- `assets/js/reading-data.js`：Day 3〜Day 31の読解本文・補助・設問データ
- `assets/js/course-lesson.js`：Day 3〜Day 31の共通教材・進捗管理
- `assets/js/speech.js`：全Day共通の台湾華語音声選択
- `assets/js/progress-storage.js`：端末内の進捗保存
- `assets/js/progress-sync.js`：Googleログインと端末間同期
- `assets/js/study-storage.js`：苦手項目の端末内保存
- `assets/js/practice.js`：4種類の集中練習
- `assets/js/weak-ui.js`：各Dayの「苦手に追加」ボタン
- `firestore.rules`：本人の進捗・苦手情報だけを読み書きできるセキュリティルール
- `firebase.json` / `.firebaserc`：Firestoreルールを同じFirebaseへ反映する設定

## 教材について

提供された参考書画像の単語一覧と出題形式を学習範囲の参考にし、既存Dayとの重複を除いてDay 3〜Day 31へ整理しています。日本語訳、音声練習、復習、聞き取り、読解本文、問題は学習用に独自作成しています。

音声再生では端末の `zh-TW`（中国語・台湾）音声だけを使用します。音声が端末にない場合は、日本語音声へ切り替えず設定方法を案内します。

## 読解練習の使い方

Day 3〜Day 31には、各Dayの新出単語を使ったオリジナル読解があります。前半は短い文章2問、後半は少し長い文章3問です。

- 最初は本文だけを読み、必要なときだけ「補助を見る」でピンインと日本語訳を開きます。
- 「読解文を聞く」では、端末の台湾華語（`zh-TW`）音声で本文を再生します。
- 選択肢を押すまで正解は表示されません。回答後に正解、日本語解説、本文の根拠が表示されます。
- 間違えたときは、設問に関係する重要単語をその場で苦手項目へ追加できます。
- 読解の回答済み数は既存のDay完了とは別に保存されるため、以前の完了記録には影響しません。

## 集中練習の使い方

ホームの「集中練習」から、次の4種類を選べます。

- **苦手復習**：間違えた単語や自分で追加した単語だけを表示します。「克服した」で解除できます。
- **ピンイン**：繁体字を見て、声調記号付きのピンインを入力します。間違えた単語は少し後でもう一度出ます。
- **書き取り**：台湾華語の音声を聞いて繁体字を入力します。スマホの繁体字手書きキーボードも使えます。
- **模試**：問題数と制限時間を選び、採点まで正解を隠して解きます。終了後、間違いを苦手へ追加できます。

各Dayの単語カードにある「☆ 苦手に追加」からも登録できます。ログインしていないときも、この端末のブラウザー内へ保存されます。

## 学習進捗の保存と同期

進捗と苦手情報は常にブラウザー内にも保存されるため、ログインせずに利用できます。「Googleで同期」から同じGoogleアカウントへログインすると、Firebase AuthenticationとCloud Firestoreを利用してスマホ・パソコン間で記録を統合します。

- 教材本体の保管・公開はGitHub Pagesのままです。
- Firebaseへ保存するのは完了済み項目、読解の回答済み項目、苦手状態、間違い回数と更新時刻だけです。教材本文はGitHub Pagesから読み込みます。
- 端末内とクラウドの完了済み項目は足し合わせ、どちらかの進捗を削除しません。
- 苦手情報は既存進捗と別の文書へ保存します。解除情報にも更新時刻を持たせるため、別の端末で古い苦手状態が復活しません。
- Firestoreは、ログイン本人のデータだけを読み書きできるルールにしています。
- FirebaseのWeb設定に含まれるAPIキーはプロジェクト識別用の公開設定です。データ保護にはAPIキーではなくAuthenticationと`firestore.rules`を使用します。

## GitHub Pages

Repository settings → Pages → Deploy from a branch → `main` / `(root)` を選択して公開します。

`main`へプッシュするとGitHub Pagesが更新されます。Firestoreルールを変更した場合は、Firebase CLIで `firebase deploy --only firestore:rules` を実行して本人専用ルールも反映します。FirebaseはAuthenticationとFirestoreだけを使うため、Spark無料プランの構成を維持できます。

## 安全上の注意

元の参考書画像、サービスアカウント鍵、`.env`、個人情報はGitへ追加しません。FirebaseのWeb設定は公開サイトで動くための識別情報であり、データへのアクセス制限はGoogleログインと`firestore.rules`で行います。
