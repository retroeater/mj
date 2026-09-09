# GitHub Issues スナップショット

このファイルは会話でissueの内容を共有するためのスナップショットです。
本文・コメントを含みます（他のClaudeチャットに経緯まで正しく
理解してもらうため）。最新化が必要になったら `/issues` コマンドを
実行するか、以下のコマンドで再生成してください。

```
gh issue list --repo retroeater/mj --state all --limit 200 \
  --json number,title,state,stateReason,labels,body,comments,createdAt,closedAt
```

生成日時: 2026-09-09

件数: 89件（open/closed含む）。番号降順。

---

## #89 html_handlingの既定により全ページで余計なリダイレクトが発生している

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-09 / クローズ: 2026-09-09
- ラベル: 分野: SEO, 対象: 全ページ

### 本文

Pro移行後のHTTP Traffic分析で、同一ページが拡張子ありとなしの
2系統で記録されていることが判明した。

24時間の実測(?name=付きで絞り込んだ数字):
| パス | リクエスト |
| --- | --- |
| /houou_results | 81 |
| /houou_results.html | 73 |
| /houou_leagues.html | 67 |
| /houou_leagues | 63 |

原因は wrangler.jsonc で html_handling を明示していないこと。
既定の "auto-trailing-slash" では /file.html が /file へ
リダイレクトされる。

影響:
- navbar.js の全リンクが .html を指しており、毎回307を経由している
- sitemap.xml の28件すべてが .html
- og:url が27ページすべて .html
- _redirects の転送先も /resource_logs.html?name=谷岡育夫 で、
  301の直後に307が入る
- リダイレクトされるcanonical/og:urlは検索エンジンにソフトエラーと
  みなされる。#5 のtitle整備の効果測定にも影響する

対応案:
A. wrangler.jsonc に "html_handling": "none" を追加する
   1行で済み、リポジトリ側は無変更。ただし拡張子なしURLが404になる
B. 拡張子なしに統一する
   navbar.js / sitemap.xml / og:url / _redirects /
   scripts/apply_page_meta.py / scripts/generate_jpml_pros.py を書き換え

判断の前に Google Search Console を確認すること:
- インデックスされているのが .html と拡張子なしのどちらか
- 両方の形が重複して登録されていないか

### コメント (1件)

**retroeater** (2026-09-09):

A案(wrangler.jsonc に html_handling: "none")で対応した。

## 判断根拠

Google Search Console の実データで、インデックスされているのは
.html形式のみだった。拡張子なしURLは1件もインデックスされておらず、
重複登録も発生していなかった。そのため .html を正としてそのまま
200で返す設定に変更した(拡張子なしに統一するB案は不採用)。

## 「/」の扱い

html_handling: "none" はディレクトリインデックスの解決も無効化するため、
対策前は「/」が404になった(ローカル検証で確認)。
_redirects の先頭に以下の1行を追加して解決した。

```
/  /index.html  200
```

ステータス200は内部的な書き換えとして扱われるため、ブラウザのURLは
/ のまま index.html の内容が返る。canonical・og:url・sitemap.xmlは
いずれも変更不要。

## 確認結果

ローカル(wrangler dev, html_handling適用前後)・本番(https://ryoei.pro)
のいずれも、想定した結果と一致した。

| URL | 結果 |
| --- | --- |
| / | 200 |
| /index.html | 200 |
| /jpml_pros.html | 200、Locationヘッダなし |
| /houou_ranking.html?sheet=鳳凰 | 200、Locationヘッダなし |
| /jpml_pros(拡張子なし) | 404 |
| /style.css, /assets/vendor/.../bootstrap.min.css | 200 |
| /tanilog.html | 301 → /resource_logs.html?name=谷岡育夫(301のみ、307の連鎖なし) |
| /sonzai_shinai_page.html | 404 |

コミット: 385fa0a

## 残作業（未対応・別途判断）

拡張子なしURL（/houou_results 等）は本変更により404になる。
これらは2026年9月9日の移行以降に発生した一時的なURLで、
Googleのインデックスには含まれていない。

対応の要否は、Cloudflare の HTTP Traffic 分析で
Edge status code = 404 を数日観測してから判断する。
実数が無視できない場合のみ、_redirects に個別の301を追加する。

なお _redirects でワイルドカード（例: /:page /:page.html 301）を
使うのは避けること。CSSやJSなど拡張子付きの静的ファイルまで
巻き込む恐れがある。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01F9dijmUHdMUVBVPevDpXRw

---

## #88 index.cssのServices・Breadcrumbsセクションを削除する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-09 / クローズ: 2026-09-09
- ラベル: 分野: 整理・保守, 対象: index

### 本文

#80 でindex.cssの未使用セクション(Skills/Portfolio Details/
Testimonials/Contact)を削除した際、範囲外だったが同様に未使用の
セクションが2つ見つかった。

| セクション | 行数 | 状況 |
| --- | --- | --- |
| Services | 約54行 | `.services` `.icon-box` などがindex.htmlに存在しない |
| Breadcrumbs | 約47行 | `.breadcrumbs` がindex.htmlに存在しない |

いずれもHTML側のセクション自体が既に削除済み(Services: #80、
他ページ用のbreadcrumbはこのサイトで使っていない)で、対応するCSSだけが
取り残されている。#80と同様、全セレクタの未使用を確認した上で削除する。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01F9dijmUHdMUVBVPevDpXRw

### コメント (1件)

**retroeater** (2026-09-09):

Services・Breadcrumbsセクションを削除した(コミット de9d3eb)。

`.services`/`.icon-box`、`.breadcrumbs` のセレクタがindex.htmlに
存在しないことを確認済み。747行→645行(102行減)。波括弧・コメントの
対応、index.htmlの表示崩れがないことも確認済み。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01F9dijmUHdMUVBVPevDpXRw

---

## #87 ソート中だけ描画を止めて中間状態の再計算を省く

- 状態: CLOSED (NOT_PLANNED) / 作成: 2026-09-09 / クローズ: 2026-09-09
- ラベル: 状況: 保留, 分野: パフォーマンス, 対象: jpml_pros

### 本文

INPの測定（#83）で、ソート時の描画に467msかかっていることが分かった。

差し替えの前に tbody へ display: none を当て、完了後に戻すことで、
中間状態の描画を完全に省ける。

ただし表が一瞬消えるため、体感が悪くなる可能性がある。
#85・#86 で十分な改善が得られなければ検討する。

### コメント (1件)

**retroeater** (2026-09-09):

#85・#86 がいずれも効果がなかったことから、
描画を一時的に止める方法も効かない見込みが高い。
display:none にしても、戻した瞬間に全行の再計算が発生するため。

根本的な対策は表示件数を絞ること（#24 の五十音タブなど）か
仮想スクロールだが、いずれも新サイトで最初から設計する方が適切。

現状 INP 458ms は「改善が必要」の水準だが「不良」（500ms超）ではなく、
ソート操作でのみ発生する。閲覧とフィルターは快適。
docs/new-site-design.md の方針（現行サイトに作り込みすぎない）に従い、
現行サイトでの対応はここまでとする。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01F9dijmUHdMUVBVPevDpXRw

---

## #86 ソート時に tbody ごと差し替えて再計算を1回にする

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-09 / クローズ: 2026-09-09
- ラベル: 分野: パフォーマンス, 対象: jpml_pros

### 本文

INPの測定（#83）で、ソート時の描画に467msかかっていることが分かった。

現在 jpml_pros.js は DocumentFragment に行を集めてから tbody に
appendChild している。これでも行ごとの追加よりは速いが、
既存の tbody に対して1102行を移動させることに変わりはない。

新しい tbody 要素を組み立て、replaceChild で丸ごと入れ替える方式にすれば、
レイアウト再計算が1回で済む可能性がある。

### コメント (1件)

**retroeater** (2026-09-09):

実装したが、INPの改善効果はなかった。

| | 最大 | ソート中央値 | 200ms超 |
| --- | --- | --- | --- |
| 対策前 | 488ms | 90.7ms | 3件 |
| #85適用時 | 529ms | 135.9ms | 2件 |
| #86適用後 | 458ms | 132.0ms | 3件 |

3回とも450〜530msの範囲で、差はばらつきの範囲内。
内訳も変わらず、描画443ms・JSの処理0.0ms。

DocumentFragment でも replaceChild でも結果が同じだったことから、
ボトルネックはDOM操作の方法ではなく「1102行を並べ替えた結果、
ブラウザが全行のレイアウトと描画をやり直すこと」そのものだと分かった。

変更自体は replaceChild の方がコードとして素直なので残す。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01F9dijmUHdMUVBVPevDpXRw

---

## #85 contain-intrinsic-size を固定値にしてソート時の描画を軽くする

- 状態: CLOSED (NOT_PLANNED) / 作成: 2026-09-09 / クローズ: 2026-09-09
- ラベル: 分野: パフォーマンス, 対象: jpml_pros

### 本文

INPの測定（#83）で、ソート時の描画に467msかかっていることが分かった。

style.css の #pros_table tbody tr は contain-intrinsic-size: auto 56px を
指定している。auto は「一度描画した実測値を記憶する」動作で、
1102行が一斉に移動するソート時には記憶の照合が負荷になっている可能性がある。

これを固定値 56px に変えて効果を測る。1行の変更で試せる。
行の高さは56px固定なので、実測値を記憶する必要はない。

### コメント (1件)

**retroeater** (2026-09-09):

効果がなかったため元に戻した。

| 指標 | 変更前 | 変更後 |
| --- | --- | --- |
| 最大（INP相当） | 488ms | 529ms |
| ソートの中央値 | 90.7ms | 135.9ms |

数値は悪化しているが、1回の測定なので誤差の範囲と見るべき。
はっきり言えるのは contain-intrinsic-size の auto が原因ではなかったということ。

内訳は変わらず、描画が503ms・JSの処理は0.1ms。
auto には実測値を記憶してスクロールバーを安定させる役割があるため、
理由なく外したままにする意味がないと判断して元に戻した(コミット 8c62b44)。

次は #86（tbodyごと差し替える）を試す。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01F9dijmUHdMUVBVPevDpXRw

---

## #84 GitHub Pagesを無効化する

- 状態: OPEN / 作成: 2026-09-09
- ラベル: 状況: 保留, 分野: インフラ

### 本文

Cloudflareへの移行後、切り戻し用にGitHub Pagesを残している。
問題がなければ無効化する。

判断の目安: 2026年9月23日ごろ（移行から2週間）

## 現状
- 本番配信は Cloudflare Workers（cloudflareブランチ）
- GitHub Pages は gh-pages ブランチを配信し続けている
  → https://retroeater.github.io/mj/ で閲覧可能
- gh-pages の23ページは Google Charts 方式で、スプレッドシートを
  実行時に読むため、放置してもデータは最新のまま

## 無効化の手順
Settings → Pages → Build and deployment → Source を None にする

## 判断のポイント
- gh-pages ブランチ自体は残す（コードの履歴として価値がある）
- 無効化すると切り戻しの手段が減る。ただしDNSをGitHub Pages向けの
  Aレコード(185.199.108〜111.153)に戻せば復旧できるため、
  完全に手段を失うわけではない
- 新サイト構築時は、現行サイトの参照元として gh-pages が役立つ可能性がある

## 確認してから無効化すること
- Search Console でクロールエラーが増えていないか
- Cloudflare Web Analytics で404が急増していないか

---

## #83 INP(Interaction to Next Paint)を測定して改善余地を確認する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-09 / クローズ: 2026-09-09
- ラベル: 分野: パフォーマンス, 対象: jpml_pros

### 本文

PageSpeed Insights か Chrome DevTools で jpml_pros.html のINPを測る。
1102行の表があるため、フィルター入力やソート時の応答が
基準(200ms)を超えていないか確認したい。

対策は既にいくつか入っている:
- content-visibility: auto で画面外の行を描画しない
- フィルターに120msのデバウンス
- 状態が変わる行だけ書き換え
- ソートは DocumentFragment で一括差し替え

推測で手を入れても効果が分からないため、まず測定する。
問題がなければクローズする。あれば内容に応じて対策を検討する。

### コメント (2件)

**retroeater** (2026-09-09):

Chrome DevTools の Performance トレースで jpml_pros.html を測定した。

| 指標 | 値 |
| --- | --- |
| 最大（INP相当） | 488ms |
| 75パーセンタイル | 90.7ms |
| 中央値 | 35.4ms |

INP 488ms は「改善が必要」の水準（良好は200ms以下）。
200msを超えたのは17回の操作のうち3回で、いずれも click（＝ソート）だった。
文字入力（input）は最大54msで良好。

内訳を見ると原因がはっきりしている。

| 段階 | 488msの内訳 |
| --- | --- |
| 入力待ち | 0.8ms |
| JSの処理 | 0.1ms |
| 描画 | 467ms |

**JavaScriptの処理は0.1msで問題ない。** #48（フィルターとソートの軽量化）が
効いている。遅いのは描画で、1102行すべてがDOM上を移動するため
content-visibility の判定とレイアウト計算が全行でやり直しになっていると考えられる。

対策は個別にissueとして起票した。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01F9dijmUHdMUVBVPevDpXRw

**retroeater** (2026-09-09):

対策のissue番号: #85（contain-intrinsic-sizeの固定値化）、
#86（tbody丸ごと差し替え）、#87（ソート中の描画停止・保留）

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01F9dijmUHdMUVBVPevDpXRw

---

## #82 SNSシェア・URLコピーボタンを設置する

- 状態: OPEN / 作成: 2026-09-09
- ラベル: 状況: 保留, 分野: UI/UX

### 本文

Search Consoleのデータでは、検索結果に表示された22URLのうち14件が
?name= 付きのURLだった。訪問者は特定の選手を見に来ている。
この場面で「このURLをコピー」ボタンがあれば、選手本人やファンが
SNSで共有しやすくなる。

実装は navigator.clipboard.writeText() で数行。外部ライブラリも
SNSの公式ボタン(=外部スクリプト)も不要なので、CSP導入(#9)とも干渉しない。

ただし新サイトでは選手個別ページを作る予定で、置き場所としては
そちらが自然。現行サイトに入れると作り直しになるため保留とし、
新サイトの要件として docs/new-site-design.md に記録する。

---

## #81 index.htmlのコメントアウト済みセクションを整理する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-09 / クローズ: 2026-09-09
- ラベル: 分野: 整理・保守, 対象: index

### 本文

index.html の577〜658行目「Testimonials Section」がHTMLコメントで
まるごと無効化されたまま残っている。テンプレート付属のサンプル内容
(架空の人物の推薦文)で、使う予定がない。

#77 でSwiperの読み込みと初期化は削除済み。このセクションを消しても
動作には影響しない。

同様にコメントアウトされている箇所が他にもある。
- Contact Section(住所「A108 Adam Street」・info@example.com・
  ニューヨークの地図など、テンプレートのプレースホルダのまま)

いずれも「復活させて使うか、消すか」の判断が必要。
使わないなら消してファイルを読みやすくしたい。

### コメント (1件)

**retroeater** (2026-09-09):

#80 と内容が同一のため、重複としてクローズします。
対応は #80 で完了済みです。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Lm3Qo5FuabCqBZ5vwn77Zo

---

## #80 index.htmlのコメントアウト済みセクションを整理する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-09 / クローズ: 2026-09-09
- ラベル: 分野: 整理・保守, 対象: index

### 本文

index.html の577〜658行目「Testimonials Section」がHTMLコメントで
まるごと無効化されたまま残っている。テンプレート付属のサンプル内容
(架空の人物の推薦文)で、使う予定がない。

#77 でSwiperの読み込みと初期化は削除済み。このセクションを消しても
動作には影響しない。

同様にコメントアウトされている箇所が他にもある。
- Contact Section(住所「A108 Adam Street」・info@example.com・
  ニューヨークの地図など、テンプレートのプレースホルダのまま)

いずれも「復活させて使うか、消すか」の判断が必要。
使わないなら消してファイルを読みやすくしたい。

### コメント (3件)

**retroeater** (2026-09-09):

コメントアウトされたセクション・ダミーコンテンツを削除した。

- Services Section・Testimonials Section・Contact Sectionを丸ごと削除
- Skills Section(進捗バーのダミー数値)を丸ごと削除
- About・Facts・Portfolio・Resumeの各セクション内のプレースホルダ段落・
  ダミー項目(Lorem ipsum等)を削除
- ナビの#services・#contactへのリンクも、対応するセクションがなくなった
  ため削除

#77 でSwiperの読み込み/初期化は削除済みだったため、動作への影響なく
削除できた。

なお、削除したResumeのダミー経歴の中にhirano@ryoei.net宛の連絡先が
紛れ込んでいたが、無効化済みダミーコンテンツの一部として一緒に削除した。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Lm3Qo5FuabCqBZ5vwn77Zo

**retroeater** (2026-09-09):

調査の結果、index.css にも使われていないセクションが見つかった。
HTMLのコメントアウト整理と合わせて対処したい。

| セクション | 行数 | 状況 |
| --- | --- | --- |
| Portfolio Details | 65 | portfolio-details.html が存在しない |
| Testimonials | 92 | 該当セクションがコメントアウト済み |
| Skills（見出しが「Akills」と誤記） | 37 | 該当クラスが実HTMLにない |
| Contact | 184 | 12クラス中1つしか使われていない |

合計370行以上。ただしクラス名の突き合わせによる機械的な判定なので、
実際に削除する際は1セクションずつ表示を確認しながら進めること。

Swiper関連の6ブロックは別途削除済み。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01G4xEKGRnEDdr48pfKvQqqG

**retroeater** (2026-09-09):

CSSの未使用セクションを削除した(コミット 294b296)。

- Skills(見出しが「Akills」と誤記) 37行
- Portfolio Details 48行
- Testimonials 75行
- Contact 184行

計344行削除(1091行→747行、32%減)。全セレクタが実HTMLで未使用である
ことを確認済み。波括弧・コメントの対応、残存セクション(Header/Nav/
Hero/About/Facts/Resume/Portfolio/Footer)のセレクタが実HTMLで使われて
いることも検証済み。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01F9dijmUHdMUVBVPevDpXRw

---

## #79 URLパラメータの選手名をタブのタイトルに反映する

- 状態: OPEN / 作成: 2026-09-09
- ラベル: 状況: 保留, 分野: SEO, 対象: 全ページ

### 本文

Search Consoleのデータでは、検索結果に表示された22URLのうち14件が
?name= 付きのURLだった。訪問者は特定の選手を探して来ている。

しかし現状はどのURLでも <title> が同じため、
検索結果でもタブでも「成績詳細」としか表示されない。

JavaScriptで document.title を書き換えれば、
ブラウザのタブとブックマークには反映される。ただし
検索結果への反映は不確実で、OGPには反映されない
（クローラーがJSを実行しないため）。

根本的な解決は選手個別ページを作ることで、これは新サイトの仕事
（docs/new-site-design.md 参照）。
効果が限定的なため保留とする。

---

## #78 OGP画像を作成して og:image を設定する

- 状態: OPEN / 作成: 2026-09-09
- ラベル: 分野: SEO, 対象: 全ページ

### 本文

#12 でOGPタグを入れたが、画像がない状態。SNSでシェアされたときに
地味なカードになる。1200×630px の画像を1枚作り、全ページ共通で使う。

以前OGP用に使っていた jpml_pros.jpg は未参照だったため削除済み
（#31 の不要ファイル整理で対応）。作り直しが必要。

タグ自体は #12 で入っているので、各ページに og:image を1行足すだけで済む。
新サイトを作る際もそのまま流用できる。

---

## #77 index.htmlのtestimonialsセクション(コメントアウト)を整理する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-08 / クローズ: 2026-09-09
- ラベル: 分野: 整理・保守, 対象: index

### 本文

index.html の「Testimonials Section」(577〜658行目)は丸ごとHTMLコメントで無効化されている。一方 index.js 側の `new Swiper('.testimonials-slider', ...)` 呼び出しと、swiper-bundle.min.css/jsの読み込みはそのまま残っており、存在しない要素に対する初期化コードが毎回無駄に実行されている。

検証経緯: #73 (vendorスクリプトへのdefer付与)の動作確認中、JSを無効にしても `.testimonials-slider` 要素がDOMに現れないことに気づき調査したところ、コメントアウトが原因と判明した。defer化とは無関係の既存の状態。

検討: セクションを復活させて使うか、使わないなら index.js の該当コードとvendor読み込み(swiper-bundle.min.css/js自体はportfolio-details-sliderにも使われているため、そちらは残す)を削除するか。

### コメント (1件)

**retroeater** (2026-09-09):

portfolio-details-sliderがこのサイトに存在しないことを確認した上で、
index.jsのSwiper初期化コード(testimonials-slider / portfolio-details-slider
両方)とswiper-bundle.min.css/jsの読み込みを削除した。テスト用ダミー
コンテンツのため、testimonialsセクション自体は復活させない方針とした。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Lm3Qo5FuabCqBZ5vwn77Zo

---

## #76 Cloudflare WAFを有効にする

- 状態: OPEN / 作成: 2026-09-08
- ラベル: 分野: セキュリティ

### 本文

無料プランでもマネージドルールの一部が使え、既知の攻撃パターンを遮断できる。ただし現時点では優先度が低い。静的配信でフォームもデータベースもなく、守るべき攻撃面がほとんどないため。
着手すべきタイミングは、ドメイン切替の後(ゾーン設定はドメインをCloudflareに移してからでないと行えない)か、SDPデータベースで選手が自分の情報を編集する仕組みを作るとき(フォームと認証が入るため必須)。

### コメント (1件)

**retroeater** (2026-09-09):

Pro へアップグレードしたため、保留の理由が解消した。着手可能。

## 着手時の注意

Super Bot Fight Mode を有効にする際、/cdn-cgi/rum を
ブロックしないこと。Cloudflare Web Analytics のビーコンが
データを送信する先であり、塞ぐと訪問者側で404や503が発生する。

## あわせて確認すること

Pro では以下も使えるようになっているため、着手前に整理しておく。

- カスタムルールが5→20に増えている
- Polish(画像最適化)がエッジで効くため、#14(優先度の低い画像を
  最適化する)の前提が変わる可能性がある。#14 に着手する前に
  Polish で足りるか確認したほうがよい

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01F9dijmUHdMUVBVPevDpXRw

---

## #75 選手データベースの表にaria属性を追加する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-08 / クローズ: 2026-09-09
- ラベル: 分野: SEO, 対象: jpml_pros

### 本文

1102行の表をスクリーンリーダーで扱う際の情報が不足している。サイト全体でaria-*は18箇所しかなく、ほとんどがBootstrap由来。
検討項目: ソート可能な列のthにaria-sort(none/ascending/descending)を付けJSで更新する / thの中身をbuttonにする(キーボードでもソート可能になる副次効果あり) / フィルターの結果件数をaria-liveで通知する / 検索ボックスの開閉をaria-expandedで伝える。
h1・caption・label・scopeは対応済みで、この issue はその続き。

### コメント (1件)

**retroeater** (2026-09-09):

選手データベースの表(jpml_pros.html)に以下を追加した。
- ソート可能な列見出しをbuttonにし、キーボードでも操作可能に
- aria-sort(none/ascending/descending)をソート実行時に更新
- 絞り込み結果件数をaria-live(polite)で通知
- 検索ボックス開閉のaria-expandedはnavbar.js側で既に対応済みだった

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Lm3Qo5FuabCqBZ5vwn77Zo

---

## #74 prefers-reduced-motionに対応する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-08 / クローズ: 2026-09-09
- ラベル: 分野: UI/UX, 対象: index

### 本文

index.htmlはAOS(スクロールアニメーション)とtyped.js(タイプライター効果)を使っている。OSで「視差効果を減らす」を設定している利用者のためにアニメーションを止めたい。CSSのメディアクエリでanimation-durationとtransition-durationを極小にする方法が一般的。
ただしAOSは要素を透明な状態から表示させる作りのため、単純に止めると要素が見えなくなる恐れがある。AOS側のdisableオプションとの併用を検討する。

### コメント (1件)

**retroeater** (2026-09-09):

OSで「視差効果を減らす」設定時、AOSはdisableオプションで無効化した
(CSSだけでtransitionを止めると、透明な状態から表示させるAOSの仕組み上
要素が見えなくなってしまうため)。Typed.jsは打ち込み演出をせず最初の
文字列を静的に表示するようにした。index.cssにもフォールバックとして
animation/transition/scroll-behaviorをほぼ0にする指定を追加している。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Lm3Qo5FuabCqBZ5vwn77Zo

---

## #73 index.htmlのスクリプトにdeferを付ける

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-08 / クローズ: 2026-09-08
- ラベル: 分野: パフォーマンス, 対象: index

### 本文

index.html だけ11個のvendorスクリプト(aos・swiper・glightbox・isotope・typed.js・purecounter・waypoints・bootstrap等)にdeferが付いておらず、HTMLの解析を止めて実行されている。他26ページは全てdefer済み。
注意点: テンプレート由来で初期化順序に依存している可能性があり、deferを付けるとスライダーやアニメーションが動かなくなる恐れがある。
1つずつ付けて表示を確認しながら進める。

---

## #72 龍龍画像URLを150x150に統一する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: パフォーマンス, 対象: jpml_pros

### 本文

サイト側が原寸(320x240など)を48x48で表示している選手が多く、転送量の無駄になっていた。845人分の150x150 URLを収集するスクリプトを作り、スプレッドシートを一括更新した。副作用として、画像の同期確認における誤検知(サイズ違いによるもの)が大幅に減る。

---
<sub>移行前のタスク番号: 72</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #71 Tiered Cacheを有効にする

- 状態: CLOSED (NOT_PLANNED) / 作成: 2026-09-07 / クローズ: 2026-09-09
- ラベル: 分野: インフラ

### 本文

対応不要。ゾーン(Cloudflareに追加したドメイン)ごとの設定のためドメイン切替が前提であり、かつWorkersの静的アセットにはオリジンサーバーが存在しないため効果がない。無料プランでもCDN配信は既に効いている。

---
<sub>移行前のタスク番号: 70</sub>

### コメント (2件)

**retroeater** (2026-09-07):

移行前に対応済み

**retroeater** (2026-09-09):

reasonをnot plannedに修正(対応不要と判断したもので、completedとは意図が異なるため)

---

## #70 画像再配信の利用規約を確認する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: インフラ, 対象: jpml_pros

### 本文

X・note・YouTubeの規約を調査した。Xは明示的な許可も禁止も見当たらずグレー、noteは第三者による複製を認める条項がない、YouTubeはAPI経由なら保存期間の制限がある。加えて著作権は各選手にあり、プラットフォームの規約とは別の問題。全体の43%(845枚)は連盟のron2.jpの資産であり、そこだけなら許諾のハードルが低い。

---
<sub>移行前のタスク番号: 60</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #69 Google Fontsのウェイトを削減する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: パフォーマンス, 対象: index

### 本文

3ファミリー×8ウェイト＝24種類を読み込んでいた。CSSの全font-weight宣言と、コメントアウトされていないセクションを突き合わせて必要なウェイトを特定し、7種類に削減(71%減)。斜体は使用箇所がコメントアウト済みのため全廃した。css2 APIへの更新、display=swap、preconnectも追加した。

---
<sub>移行前のタスク番号: 59</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #68 index.htmlのプレースホルダを確認する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: 整理・保守, 対象: index

### 本文

住所「A108 Adam Street」・info@example.com・ニューヨークの地図がテンプレートのまま残っていたが、Contactセクション全体がコメントアウトされており表示されていなかった。対応不要。当初「公開状態」と報告したのは誤りだった。

---
<sub>移行前のタスク番号: 58</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #67 sitemap.xmlに除外理由を明記する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: SEO

### 本文

404.html・tanilog.html・saikyo_mens.html・リダイレクト2件をなぜ載せていないかをコメントで残した。次に見たときに迷わないため。

---
<sub>移行前のタスク番号: 54</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #66 フォント指定を全ページの表に広げる

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: UI/UX, 対象: 全ページ

### 本文

jpml_pros限定だった指定をstyle.cssの先頭に移し、body・table・Google Chartsのテーブルクラスに適用した。index.htmlはstyle.cssを読み込まないため影響を受けない。

---
<sub>移行前のタスク番号: 53</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #65 robots.txtを追加する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: SEO

### 本文

sitemap.xmlを作ったものの、その場所を検索エンジンに知らせる手段がなかった。

---
<sub>移行前のタスク番号: 52</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #64 sitemap.xmlからリダイレクトURLを削除する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: SEO

### 本文

resource_calendar.htmlとresource_books.htmlは_redirectsで301転送しており実ファイルが存在しない。301するURLをsitemapに載せるとSearch Consoleで警告の原因になる。リダイレクト整備の際の消し漏れだった。

---
<sub>移行前のタスク番号: 50</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #63 CNAMEを削除する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: 整理・保守

### 本文

ryoei.proと書かれたGitHub Pages専用のファイル。cloudflareブランチでは無意味なうえ公開されていた。gh-pagesブランチには残る。

---
<sub>移行前のタスク番号: 49</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #62 開発用ファイルの公開を止める

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: セキュリティ

### 本文

wrangler.jsoncのassets.directoryが"./"のため、scripts/・.github/・wrangler.jsonc等がURLで直接ダウンロードできる状態だった。.assetsignoreに追加して除外した。認証情報は含まれていなかったが内部構成が見えていた。

---
<sub>移行前のタスク番号: 48</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #61 アイコンフォントをwoff2のみに絞る

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: パフォーマンス

### 本文

@font-faceのsrcはブラウザが対応する最初の形式だけを取得するため、eot・ttf・svg・woffは要求すらされない。5ファイル(約2.3MB)を削除。CSSの編集は不要なのでライブラリを更新しても影響を受けない。

---
<sub>移行前のタスク番号: 47</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #60 index.htmlをbootstrap-icons.min.cssに差し替える

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: パフォーマンス, 対象: index

### 本文

非圧縮版を読み込んでいたためmin版に変更(91KB→80KB)。フォントの参照パスは「./fonts/」と「fonts/」の違いだけで、どちらも同じ場所を指すため問題なかった。

---
<sub>移行前のタスク番号: 46</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #59 assets/vendorの未使用ファイルを整理する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: 整理・保守

### 本文

.mapファイル28個・RTL版8個・非圧縮版など63ファイル(約9.3MB)を削除した。index.htmlが読み込む15ファイルと、CSS内のurl()から参照されるフォント類だけを残した。

---
<sub>移行前のタスク番号: 45</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #58 Bootstrapの読み込み元を統一する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: 整理・保守, 対象: 全ページ

### 本文

26ページがCDNの5.3.0、index.htmlだけローカルの5.3.1という分裂状態だった。npmから5.3.8を取得してローカルに置き、全27ページをそちらへ統一。外部CDNへの依存が消え、CSP設定の許可リストが短くなる。同一オリジンになるためintegrity属性も不要になった。

---
<sub>移行前のタスク番号: 44</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #57 空のラッパーdivを削除する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: 整理・保守, 対象: jpml_pros

### 本文

#dashboard_divと#myTableはGoogle Chartsが要求していたコンテナで、CSSにもJSにも参照がなかった。

---
<sub>移行前のタスク番号: 43</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #56 未使用のCSSクラスを削除する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: 整理・保守

### 本文

.cal_wrapper・.googlecal・.judan-chart・.mj-border-zeroの4件と、中身が空になるメディアクエリ1件を削除した。削除済みページの名残だった。

---
<sub>移行前のタスク番号: 42</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #55 tableにcaptionとscopeを追加する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: SEO, 対象: jpml_pros

### 本文

表の説明をcaptionで追加し、thにscope="col"を付けて列見出しであることを明示した。

---
<sub>移行前のタスク番号: 36</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #54 検索欄にlabelを追加する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: SEO, 対象: jpml_pros

### 本文

4つの入力欄それぞれに、placeholderより具体的な説明を付けた。視覚的には隠している。

---
<sub>移行前のタスク番号: 35</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #53 h1を追加する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: SEO, 対象: jpml_pros

### 本文

見た目を変えないようvisually-hiddenで配置。検索エンジンと読み上げには伝わる。

---
<sub>移行前のタスク番号: 34</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #52 meta descriptionを追加する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: SEO, 対象: jpml_pros

### 本文

所属・出身地、鳳凰戦・女流桜花の所属リーグ等で検索できる旨を約120字で記載した。

---
<sub>移行前のタスク番号: 33</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #51 titleを見直す

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: SEO, 対象: jpml_pros

### 本文

当初「日本プロ麻雀連盟 プロ雀士データベース | ryoei.pro」に変更したが、他ページとまとめて検討したいため「プロ」のまま維持することにした。

---
<sub>移行前のタスク番号: 32</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #50 altに選手名を含める

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: SEO, 対象: jpml_pros

### 本文

「龍龍」「X」だけでは1行に並ぶ4枚の画像を区別できなかった。「藍ありさ X」の形式にして、読み上げでも読み込み失敗時も誰の何かが分かるようにした。

---
<sub>移行前のタスク番号: 30</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #49 フォントスタックを指定する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: UI/UX, 対象: 全ページ

### 本文

Windowsの游ゴシックUIは小さい文字だと線が細く読みにくいため、Hiragino Sans→Yu Gothic Medium→Meiryoの順に指定。字詰め(palt)と等幅数字(tabular-nums)も追加した。Webフォントは読み込まない。Google Chartsが生成するテーブルにも効くようクラス名を明示している。

---
<sub>移行前のタスク番号: 29</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #48 フィルターとソートを軽量化する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: パフォーマンス, 対象: jpml_pros

### 本文

検索用文字列を初回に1度だけ組み立てて使い回し、120msのデバウンスを追加。状態が変わる行だけ書き換え、ソートはDocumentFragmentで一括差し替えるようにした。

---
<sub>移行前のタスク番号: 27</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #47 imgにwidth/height属性を付ける

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: パフォーマンス, 対象: jpml_pros

### 本文

読み込み前に高さ0で計算されてレイアウトがずれる問題(CLS)を防ぐため、全imgにwidth="48" height="48"を明示した。

---
<sub>移行前のタスク番号: 26</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #46 インラインのonerror属性を廃止する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: パフォーマンス, 対象: jpml_pros

### 本文

imgごとに同じonerror属性が約1900回繰り返され、HTMLの9%(110KB)を占めていた。data-fallback属性とJSのイベント委譲に置き換えた。errorイベントはバブリングしないためキャプチャフェーズで受けている。将来のCSP導入の前提にもなる。

---
<sub>移行前のタスク番号: 25</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #45 画像のリンク切れを毎週検知する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: 自動化, 対象: jpml_pros

### 本文

1985枚の画像URLにHEADリクエストを送り、取得できなかったものをissueに書き出す。毎週月曜3時JSTに自動実行。同じissueを使い回すので乱立せず、復旧すれば自動的に閉じる。同時接続8本・同一ホストへ0.2秒間隔で相手サーバーに配慮している。

---
<sub>移行前のタスク番号: 24</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #44 content-visibilityで画面外の行の描画を省く

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: パフォーマンス, 対象: jpml_pros

### 本文

tbody trにcontent-visibility:autoとcontain-intrinsic-size:auto 56pxを指定。1102行あっても実際に描画するのは表示中の十数行だけになる。DOMには残るためCtrl+Fや読み上げは従来どおり機能する。stickyとの両立も確認済み。

---
<sub>移行前のタスク番号: 21</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #43 テーブルヘッダーの色を決める

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: UI/UX, 対象: jpml_pros

### 本文

グラデーションをやめてFAFAFAの単色に確定した。

---
<sub>移行前のタスク番号: 19</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #42 404ページを整備する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: インフラ

### 本文

wrangler.jsoncのnot_found_handlingは設定済みだったため404.htmlを追加。Cloudflare Web Analyticsのビーコンを入れてあるので、消えた旧URLへのアクセスが実データとして記録される。旧URLのリダイレクト要否を推測ではなく実績で判断できる。

---
<sub>移行前のタスク番号: 16</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #41 Google Search Consoleに登録する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: SEO

### 本文

TXTレコードで所有権を確認し登録した。

---
<sub>移行前のタスク番号: 13</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #40 モバイル表示を確認する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: UI/UX, 対象: 全ページ

### 本文

全ページにviewportメタタグがあり、横はみ出しを起こす固定幅もないことを確認。ハンバーガーメニュー開閉時にナビバーの高さが変わってもcontent-offsetが追従するよう、ResizeObserverによる監視を追加した。

---
<sub>移行前のタスク番号: 10</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #39 リダイレクトを整備する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: インフラ

### 本文

meta refreshで転送していたtanilog.html・resource_calendar.html・resource_books.htmlを、Cloudflareの_redirectsによるサーバーサイド301へ移行。転送が速くなる代わりにWeb Analyticsでの計測はできなくなるが、許容した。

---
<sub>移行前のタスク番号: 9</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #38 非本番ブランチのプレビュービルドを有効にする

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: インフラ

### 本文

cloudflareブランチ以外にpushした際もプレビューURLが発行されるようにした。普段はcloudflareブランチに直接作業する運用は変えず、必要になったときに使える状態にしておく位置づけ。

---
<sub>移行前のタスク番号: 8</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #37 画像を最適化する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: パフォーマンス, 対象: index

### 本文

hero-bg.jpg(978KB→37KB)とMind_Games_KEY_VIS(1.35MB→101KB)をWebP化。あわせて未参照だったvideo_live.jpg・jpml_pros.jpg(計1MB超)を削除した。

---
<sub>移行前のタスク番号: 7</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #36 セキュリティヘッダーを設定する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: セキュリティ, 対象: 全ページ

### 本文

_headersファイルでX-Frame-Options・X-Content-Type-Options・Referrer-Policy・Permissions-Policy・HSTSを設定した。CSPは外部スクリプトの洗い出しが必要なため別課題とした。設定の確認はfetch APIでは一部ヘッダーが隠されるため、HARファイルで検証した。

---
<sub>移行前のタスク番号: 6</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #35 jpml_pros.htmlのGoogle Charts依存を解消する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: パフォーマンス, 対象: jpml_pros

### 本文

ブラウザから毎回スプレッドシートへクエリを投げていた処理を、ビルド時にPythonで実行して静的HTMLに焼き込む方式へ変更。共通ライブラリ(scripts/lib/sheets.py)とGitHub Actionsのワークフローを整備し、他ページにも展開できる形にした。フィルターとソートは軽量な自作JSに置き換えた。

---
<sub>移行前のタスク番号: 5</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #34 sitemap.xmlを再生成する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: SEO

### 本文

内容が2020〜2024年のまま実際のページ構成と乖離していた。現存する全ページを反映して作り直した。存在しないページ(jekyll_league_by_class.html等)を除外し、載っていなかったresource_calendar.html等を追加した。

---
<sub>移行前のタスク番号: 4</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #33 Jekyllを廃止して静的ファイルを直接配信する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: パフォーマンス

### 本文

フロントマターもLiquidタグも_layoutsも存在せず、Jekyllは実質HTMLをコピーしているだけだった。ビルドを廃止しwrangler.jsoncの配信元をリポジトリルートに変更。あわせて.gitフォルダが公開されないよう.assetsignoreを追加した。

---
<sub>移行前のタスク番号: 3</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #32 GA4からCloudflare Web Analyticsへ移行する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: インフラ, 対象: 全ページ

### 本文

31ファイルからGA4のタグ2行を削除し、Cloudflare Web Analyticsのビーコンに置き換えた。Cookieレスでプライバシー面でも有利。反映にタイムラグがあるため初回は数分待つ必要がある。

---
<sub>移行前のタスク番号: 2</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #31 不要なファイルを削除する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: 分野: 整理・保守

### 本文

Netflixフォルダ(37.7MBの動画を含む学習用の名残)、IME辞書の旧版24ファイル、未参照だったページ(houou_ampai_43h1.html・jpml_pro.html・jpml_logs.html)、未使用のOGP画像2枚を削除した。saikyo_mens.htmlは年1回の単発企画用として、tanilog.htmlはリダイレクト用として残した。

---
<sub>移行前のタスク番号: 1</sub>

### コメント (1件)

**retroeater** (2026-09-07):

移行前に対応済み

---

## #30 メール送信の手段を検討する

- 状態: OPEN / 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: インフラ

### 本文

認証のマジックリンクや選手への通知が必要になった場合。Resendは無料枠が月3000通で扱いやすい。Cloudflare Email Routingは受信専用なので送信には使えない。

---
<sub>移行前のタスク番号: 67</sub>

---

## #29 認証方式を検討する

- 状態: OPEN / 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: インフラ

### 本文

選手1000人にログインしてもらう仕組みは、技術より運用負担(パスワード忘れ・メール変更の問い合わせ)が大きい。固有トークン付きURLを配る方式ならログイン不要で運用負担がほぼゼロ。本格的な認証が必要ならClerk(無料枠1万MAU)かSupabase Auth。

---
<sub>移行前のタスク番号: 66</sub>

---

## #28 Cloudflare D1の採用を検討する

- 状態: OPEN / 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: インフラ

### 本文

SDPデータベース(選手が自分の情報を編集する仕組み)向け。Supabaseは無料枠が1週間で自動停止するため却下した。D1は5GB・1日500万行読み取りが無料で自動停止もない。2026年9月から無料プランは1日の行数上限に達するとエラーを返す。

---
<sub>移行前のタスク番号: 65</sub>

---

## #27 Noto Sans JPの採用を検討する

- 状態: OPEN / 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: UI/UX, 対象: 全ページ

### 本文

全OSで字面が統一される利点はあるが、1102行の表は再レイアウトのコストが大きく、外部依存も増える。まずフォントスタック指定＋等幅数字(実施済み)で様子を見る。

---
<sub>移行前のタスク番号: 31</sub>

---

## #26 リンクの見た目をモダンにする

- 状態: OPEN (REOPENED) / 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: UI/UX, 対象: jpml_pros

### 本文

現在はBootstrapの青(#0d6efd)＋文字直下の下線。紺系に寄せ、下線を薄く3px離す案。既訪問リンクが紫になる問題はBootstrapが解決済みだったため、当初想定より効果は小さい。

---
<sub>移行前のタスク番号: 28</sub>

### コメント (3件)

**retroeater** (2026-09-09):

ドメイン切替が完了。お名前.comのネームサーバーをCloudflareに変更し、
WorkerにカスタムドメインとしてryoeI.proとwww.ryoei.proを設定した。
43件の改善がこれで公開された。
GitHub Pagesは切り戻し用に当面残す。

**retroeater** (2026-09-09):

訂正: 上記コメント中の「ryoeI.pro」は誤字です。正しくは「ryoei.pro」です。

**retroeater** (2026-09-09):

訂正: このissueはドメイン切替(#16)とは無関係のため再オープンします。
上記のコメントは誤って投稿したものです。

---

## #25 プロフィール画像をR2へ移行する

- 状態: OPEN / 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: インフラ, 対象: jpml_pros

### 本文

1985枚が7つの外部ドメインに依存している。ただしX・noteの画像を自サイトで再配信することは各社の規約上グレーで、著作権も選手個人にある。ron2.jp分(845枚・連盟の資産)だけなら許諾のハードルは低い。将来SDPデータベースで選手自身に画像をアップロードしてもらうのが最も筋が良い。

---
<sub>移行前のタスク番号: 23</sub>

---

## #24 五十音の行タブで絞り込めるようにする

- 状態: OPEN / 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: UI/UX, 対象: jpml_pros

### 本文

1102行を延々スクロールさせるUIの改善案。「あ か さ た な は ま や ら わ」の行タブ型。全行に data-name(かな読み込み)を持たせてあるので、既存のフィルター処理にそのまま乗せられる。

---
<sub>移行前のタスク番号: 22</sub>

### コメント (2件)

**retroeater** (2026-09-09):

INPの調査（#83・#85・#86）で、1102行を一度に描画していることが
ソート時の遅さ（458ms）の原因だと判明した。

五十音タブで表示件数を絞れば、この問題も同時に解決する。
新サイトを設計する際は、パフォーマンス面でも意味のある機能として
検討したい。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01F9dijmUHdMUVBVPevDpXRw

**retroeater** (2026-09-09):

補足: 仮想スクロールは採用しない方針とした。

DOMに存在しない行はCtrl+Fのページ内検索で見つけられなくなるため。
印刷やコピーにも影響し、UIとしても好ましくないという判断。
五十音タブでの絞り込み（本issue）で表示件数を絞る方針で対応する。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01F9dijmUHdMUVBVPevDpXRw

---

## #23 スクロール中に検索ボックスを開くと背後にデータ行が見える

- 状態: OPEN / 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: UI/UX, 対象: jpml_pros

### 本文

検索ボックスが左側180pxしか覆っていないため、右側の帯にデータ行が透けて見える。width:100% と box-sizing:border-box の2行で解決できるが、いったん許容している。

---
<sub>移行前のタスク番号: 20</sub>

---

## #22 龍龍・X・note・YouTube列をかな順でソートできるようにする

- 状態: OPEN / 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: UI/UX, 対象: jpml_pros

### 本文

一度実装したが動作しなかったため削除した。空欄の選手は昇順・降順どちらでも最下部に固定したい。

---
<sub>移行前のタスク番号: 18</sub>

---

## #21 Astroへの移行を検討する

- 状態: OPEN / 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: 整理・保守, 対象: 全ページ

### 本文

27ページすべてにheadの中身とnavbar読み込みがコピーされており、SEO展開やOGP追加のたびに全ページを触る必要がある。Astroなら1つのレイアウトで済む。代償としてビルド工程が復活し、Pythonの生成スクリプトの扱いを決める必要がある。試作(旧74番)の結果を見て判断。

---
<sub>移行前のタスク番号: 73</sub>

---

## #20 jpml_titles.html をAstroで試作する

- 状態: OPEN / 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: 整理・保守, 対象: jpml_titles

### 本文

Astro移行の手応えを確かめるための試作。1ページだけ組み直して、レイアウトの共通化やビルド工程の負担を実際に評価する。この結果を見てAstro移行(旧73番)の可否を判断する。

題材は houou_results.html ではなく jpml_titles.html にする。houou_results はグラフを描いており論点が増えるため、表とフィルターだけの jpml_titles.html の方が試作に適している。

---
<sub>移行前のタスク番号: 74</sub>

### コメント (1件)

**retroeater** (2026-09-09):

「状況: 保留」ラベルを追加。

現行サイトの残作業はPythonで進める判断をしたため、Astro試作は
新サイト構築を再開するときの作業になる（#21と同じ扱い）。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01G4xEKGRnEDdr48pfKvQqqG

---

## #19 アクセス解析をサーバーサイド方式に変える

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-09
- ラベル: 分野: インフラ, 対象: 全ページ

### 本文

現在はJSビーコン(static.cloudflareinsights.com)。Cloudflare Analytics Engine を使えば外部ドメインへの依存が消え、リダイレクトページのアクセスも計測できる。Workers Paid(月$5)が必要。ドメイン切替(旧11番)の後。

---
<sub>移行前のタスク番号: 40</sub>

### コメント (1件)

**retroeater** (2026-09-09):

Cloudflare Pro へアップグレードしたことで、Analytics Engine を
自前で実装せずに目的を達成できたためクローズする。

## 前提が2つ崩れた

1. Workers Paid(月$5)が必要 → 不要だった
   Analytics Engine の料金表には Workers Free の行があり
   (1日10万データポイント書き込み/1万読み取りクエリ)、
   現時点では Analytics Engine 自体が課金開始前だった。
   実測トラフィックは24時間で3,030リクエストなので、
   仮に自前実装しても Free 枠で収まっていた。

2. クエリ文字列は自前実装でしか取れない → 取れた
   Pro の HTTP Traffic 分析は Query string をフィルタ条件に
   使える。?name= 付きのリクエストは24時間で314件あり、
   鳳凰戦・女流桜花の成績ページに集中していることが分かった。

## Pro で取れるようになったもの

- パス別の内訳(Free では出なかった)
- クエリ文字列によるフィルタ
- Cache status / Source browser / Source device type /
  Data center / Source ASN などの軸
- リダイレクトページ(tanilog等)を含む全リクエスト
  ※ JSビーコンでは301のため計測できなかった

## Pro でも取れないもの

- 選手名ごとの集計。Query string はフィルタには使えるが
  値ごとの内訳は出ない。Download data も表示中の上位5系列を
  15分刻みで出すだけ。
  → ここは Google Search Console で代替する(実際に
    元氏なづは・白銀紗希・野村駿など個別の選手名が確認できている)
- Bot score。ディメンション一覧に存在しない(Business以上)

## 自前実装を見送った理由

Analytics Engine を使うには Worker スクリプトの追加と
run_worker_first の設定が必要で、その副作用として
_headers の5行と _redirects の3行が worker-first の経路で
効かなくなるため Worker 側への移設が必要だった。
現行サイトはいずれ新サイトに置き換わる方針(docs/new-site-design.md)
であり、本番経路に Worker を挟む恒久的な複雑さに見合わないと判断した。

## 副次的な発見

この調査の過程で html_handling の既定による余計なリダイレクトが
判明し、#89 として起票した。

## 残る論点

JSビーコン(static.cloudflareinsights.com)自体は動いたままである。
これを外すかどうかは #9 (CSP) の設計に属する判断のため、
本issueには含めない。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01F9dijmUHdMUVBVPevDpXRw

---

## #18 Cloudflare Registrarへドメインを移管する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-09
- ラベル: 分野: インフラ

### 本文

卸値＋ICANN手数料のみで、更新時の値上げがない。WHOIS情報の代理公開も無料。DNSと合わせて管理を1箇所にまとめられる。ドメイン切替(旧11番)の後。

---
<sub>移行前のタスク番号: 69</sub>

### コメント (2件)

**retroeater** (2026-09-09):

Cloudflare Registrarへのドメイン移管が完了。
お名前.comからCloudflareへ、$23.32（1年分の更新料）で移管した。
移管により有効期限が1年延長される。

Cloudflareは卸値のみで販売するため、更新時の値上がりがない。
WHOIS情報の代理公開も無料。
DNSは移管前からCloudflareで稼働していたため、サイトへの影響はなかった。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Lm3Qo5FuabCqBZ5vwn77Zo

**retroeater** (2026-09-09):

Cloudflare Registrarへのドメイン移管が完了。
お名前.comからCloudflareへ、$23.32（1年分の更新料）で移管した。
有効期限は2028年3月20日まで延長され、Auto-renewも有効。

Cloudflareは卸値のみで販売するため、更新時の値上がりがない。
WHOIS情報も既定で秘匿される。
DNSは移管前からCloudflareで稼働していたため、サイトへの影響はなかった。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Lm3Qo5FuabCqBZ5vwn77Zo

---

## #17 Email Routingで独自ドメインのメールアドレスを作る

- 状態: OPEN / 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: インフラ

### 本文

contact@ryoei.pro のようなアドレスを作り、既存のメールに転送する。無料で、メールボックスもサーバー設定も不要。送信はできない(受信・転送のみ)。企業からの問い合わせ窓口として。ドメイン切替(旧11番)の直後に実施。

---
<sub>移行前のタスク番号: 68</sub>

---

## #16 ドメインをCloudflareへ切り替える

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-09
- ラベル: 分野: インフラ

### 本文

ryoei.pro のDNSをCloudflareに移す。動作確認は済んでおり、あとは実行するだけ。他の改善を終えてから最後に実施する方針。

---
<sub>移行前のタスク番号: 11</sub>

### コメント (2件)

**retroeater** (2026-09-09):

ドメイン切替が完了。お名前.comのネームサーバーをCloudflareに変更し、
WorkerにカスタムドメインとしてryoeI.proとwww.ryoei.proを設定した。
43件の改善がこれで公開された。
GitHub Pagesは切り戻し用に当面残す。

**retroeater** (2026-09-09):

訂正: 上記コメント中の「ryoeI.pro」は誤字です。正しくは「ryoei.pro」です。

---

## #15 index.htmlが別系統の構造になっている件

- 状態: OPEN / 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: 整理・保守, 対象: index

### 本文

index.html はWebサイトテンプレート由来で index.css と11個のvendorライブラリを使い、他26ページは style.css のみという二重構造。統一の必要はないが、assets/vendor の1.2MBはトップページ1枚のためだけに存在する。将来トップページを作り直す機会があれば最大の削減余地。

---
<sub>移行前のタスク番号: 56</sub>

---

## #14 優先度の低い画像を最適化する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-09
- ラベル: 分野: パフォーマンス, 対象: index

### 本文

img/x.png(102KB)、img/profile-img.jpg(48KB)など。主要2枚(hero-bg・Mind_Games)のWebP化は完了済み。

---
<sub>移行前のタスク番号: 17</sub>

### コメント (2件)

**retroeater** (2026-09-09):

以下を対応した(コミット 18802c1)。

- img/x.png: 2400x2453(102KB)から96x96相当(8KB)へ縮小
  選手データベースで48x48表示する代替アイコンのため、
  50倍の解像度は不要だった(高解像度ディスプレイ用に2倍を確保)
- img/profile-img.jpg(48KB) → img/profile-img.webp(12KB)
  index.htmlの参照2箇所(ヘッダーのプロフィール画像、About欄)を更新

合計 約130KB削減。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01G4xEKGRnEDdr48pfKvQqqG

**retroeater** (2026-09-09):

img/x.png を差し替え(コミット 8f38065)。

前回差し替えたものが8bit gray+alpha・94x96だったため、
指定どおりRGBA・96x96(約8.3KB)のものに直した。
profile-img.webpへの置き換えは前回のコミットで完了済みのため変更なし。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01G4xEKGRnEDdr48pfKvQqqG

---

## #13 構造化データ(JSON-LD)を追加する

- 状態: OPEN / 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: SEO, 対象: jpml_pros

### 本文

ItemList と Person で選手情報を機械可読にする。静的HTML化で検索エンジンが中身を読めるようになったため、効果が見込める。検索結果やAIアシスタントでの認識に効く。

---
<sub>移行前のタスク番号: 38</sub>

### コメント (1件)

**retroeater** (2026-09-09):

「状況: 保留」ラベルを追加。構造化データは新サイトで対応する判断をしたため。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01F9dijmUHdMUVBVPevDpXRw

---

## #12 OGPタグを追加する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-09
- ラベル: 分野: SEO, 対象: 全ページ

### 本文

SNS共有時のカード表示用。以前OGP画像として使っていた jpml_pros.jpg は未参照だったため削除済みなので、画像の作り直しが必要。

---
<sub>移行前のタスク番号: 37</sub>

### コメント (2件)

**retroeater** (2026-09-09):

Search Consoleのデータで、表示48回に対しクリック2回(CTR約4%)と判明。
掲載順位は1〜12位と悪くないため、原因はtitleの可能性が高い。
「プロ」「成績詳細」「リンク」といった素っ気ない文字列が並び、
「成績詳細」は4ページで重複している。
titleとmeta descriptionを整えるだけで、表示回数はそのままに
クリックが増える見込み。優先度を上げる。

**retroeater** (2026-09-09):

26ページに og:type / og:site_name / og:title / og:description / og:url と
twitter:card を追加した。
og:image は画像の作成が必要なため別issueとして分離済み。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Lm3Qo5FuabCqBZ5vwn77Zo

---

## #11 旧URLのインデックス状況を確認しリダイレクトを判断する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-09
- ラベル: 分野: SEO

### 本文

jpml_articles.html・tokusho_ranking.html・houou_league_by_class.html 等、削除済みで検索エンジンに残っている可能性のあるURLを確認する。404ページに入れたWeb Analyticsの実測データも判断材料になる。旧14番が前提。

---
<sub>移行前のタスク番号: 15</sub>

### コメント (1件)

**retroeater** (2026-09-09):

削除済みURL(jpml_articles・tokusho・league_by_class等)への
アクセスが1件も検出されなかったため、追加のリダイレクトは不要と判断。
404ページのWeb Analyticsで今後も監視は続く。

---

## #10 Search Consoleのインデックス状況を確認する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-09
- ラベル: 分野: SEO

### 本文

登録済み。「インデックス作成 > ページ」でデータが処理されるのを待っている。確認できたら旧15番(旧URLのインデックス確認)へ進む。

---
<sub>移行前のタスク番号: 14</sub>

### コメント (1件)

**retroeater** (2026-09-09):

Search Consoleでデータを確認済み。所有権も維持されている。
22URL・表示48回・クリック2回。削除済みURLへのアクセスは0件だった。

---

## #9 CSP(Content-Security-Policy)を設定する

- 状態: OPEN / 作成: 2026-09-07
- ラベル: 分野: セキュリティ, 対象: 全ページ

### 本文

Bootstrapのローカル化(旧44番)で外部依存が減り、インラインonerrorも廃止済みなので設定しやすい状態。Sentry導入(旧64番)で外部ドメインが増えるため、その後に着手する。

---
<sub>移行前のタスク番号: 12</sub>

---

## #8 龍龍の所属・出身地等との照合

- 状態: OPEN / 作成: 2026-09-07
- ラベル: 分野: 自動化, 対象: jpml_pros

### 本文

ron2.jp の選手ページから取得できる所属・出身地・段位・かな読みと、スプレッドシートの内容を突き合わせる。表記ゆれ(「九州本部」対「九州」など)の吸収が必要。画像の同期確認(旧61番)の後に着手する。

---
<sub>移行前のタスク番号: 63</sub>

---

## #7 他21ページのGoogle Charts依存を解消する

- 状態: OPEN / 作成: 2026-09-07
- ラベル: 分野: パフォーマンス, 対象: 全ページ

### 本文

27ページ中20ページが、いまもブラウザから直接Googleスプレッドシートにクエリを投げている。www.gstatic.com と docs.google.com への依存が消え、初期表示も速くなる。旧55番が前提。Astro移行(旧73番)の判断もこのタイミング。

---
<sub>移行前のタスク番号: 39</sub>

---

## #6 ワークフローのpushトリガーを汎用化する

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-09
- ラベル: 分野: 自動化

### 本文

.github/workflows/regenerate-page.yml は push トリガー時の対象ページを jpml_pros で決め打ちしている。2ページ目を自動化した瞬間に破綻するため、変更されたファイルから対象を判定する形に直す。Google Charts依存の解消(旧39番)の前提。

---
<sub>移行前のタスク番号: 55</sub>

### コメント (1件)

**retroeater** (2026-09-09):

生成スクリプトの有無から対象ページを自動判別する方式に変更した。
新しいページを自動化する際、YAMLの書き換えが不要になる。
共通ライブラリ(scripts/lib/)が変わったときは全ページを作り直す。
生成物(*.html)の変更では発火しないため、無限ループも防げる。

手動実行(target_page=all)で動作確認済み。
(実装時、regenerate.pyでサブプロセスの標準出力がGITHUB_OUTPUTに
混入して失敗する不具合が見つかったため、合わせて修正した)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01G4xEKGRnEDdr48pfKvQqqG

---

## #5 他ページへのSEO展開

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-09
- ラベル: 分野: SEO, 対象: 全ページ

### 本文

jpml_pros.html にのみ入れた h1・meta description を他24〜25ページにも展開する。あわせて重複しているtitleを解消する(「成績詳細」が4ページ、「リンク」が2ページ)。

---
<sub>移行前のタスク番号: 51</sub>

### コメント (1件)

**retroeater** (2026-09-09):

26ページのtitleとmeta descriptionを整備した。
- titleの書式を「ページ名 | カテゴリ | ryoei.pro」に統一。
  カテゴリはメニュー名に合わせつつ、「連盟」だけは検索で拾われるよう
  「日本プロ麻雀連盟」に展開した
- 重複を解消。従来は「成績詳細」が4ページ、「ランキング」が3ページ、
  「リンク」が2ページで重複していた
- index.htmlは「R」の1文字だったものを「ryoei.pro」に
- descriptionは各ページの実際の内容と、検索できる項目
  （選手名・店名・最寄駅名など）を具体的に記載

適用は scripts/apply_page_meta.py で行った。再実行しても
タグが重複しない作りなので、今後の変更もこのスクリプトを直せばよい。

なお h1・caption・label などは、新サイトで作り直す前提のため
今回は見送った（docs/new-site-design.md の9章の方針）。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Lm3Qo5FuabCqBZ5vwn77Zo

---

## #4 Sentryを導入してJSエラーを検知する

- 状態: OPEN / 作成: 2026-09-07
- ラベル: 分野: 自動化, 対象: jpml_pros

### 本文

jpml_pros.js の自作フィルター・ソート・固定列の処理が特定の環境で壊れても気づく手段がない。無料枠(月5000エラー)で十分。外部ドメインが1つ増えるため、CSP設定(旧12番)より先に入れる。

---
<sub>移行前のタスク番号: 64</sub>

---

## #3 YouTubeチャンネルアイコンの一致確認

- 状態: OPEN / 作成: 2026-09-07
- ラベル: 状況: 待ち, 分野: 自動化, 対象: jpml_pros

### 本文

YouTube Data API v3 の channels.list で82チャンネルのアイコンURLを取得し、サイトの表示と突き合わせる。API呼び出しは2回・消費クォータ2ユニットで済む。Google CloudでのAPIキー発行と、GitHub Secretsへの登録が前提。

---
<sub>移行前のタスク番号: 62</sub>

---

## #2 龍龍画像の同期確認を運用に乗せる

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-08
- ラベル: 分野: 自動化, 対象: jpml_pros

### 本文

龍龍(ron2.jp)の選手ページに表示されている画像と、サイトで表示中の画像が一致しているかを毎週確認する。スクリプトとワークフローは実装済み。150x150への統一(旧72番)を反映したうえで再実行し、誤検知が減ったことを確認する。

---
<sub>移行前のタスク番号: 61</sub>

### コメント (1件)

**retroeater** (2026-09-08):

843件すべて龍龍の最新画像と一致。150x150への統一により誤検知が解消され、週次の自動監視が正常に動作する状態になった。

---

## #1 画像リンク切れの検知結果

- 状態: CLOSED (COMPLETED) / 作成: 2026-09-07 / クローズ: 2026-09-07
- ラベル: (なし)

### 本文

1985件を確認し、**20件**が取得できませんでした。

### ホスト別
| ホスト | 件数 |
| --- | --- |
| pbs.twimg.com | 17 |
| abs.twimg.com | 3 |

### ステータス別
| ステータス | 件数 |
| --- | --- |
| 404 | 20 |

### 詳細
- `404` 栄田勇作 X — https://pbs.twimg.com/profile_images/1890415764919947264/zFcUCRw5_80x80.jpg
- `404` 江崎しんのすけ X — https://pbs.twimg.com/profile_images/1836292020199153664/yycE2_Oh_80x80.jpg
- `404` 岡リョウタ X — https://pbs.twimg.com/profile_images/2068116908961132544/cA7bdrT__80x80.jpg
- `404` 神代陽向 X — https://abs.twimg.com/sticky/default_profile_images/default_profile_80x80.png
- `404` 川奥修二 X — https://pbs.twimg.com/profile_images/2075596142210166784/yS9Ez0ZU_80x80.jpg
- `404` 久保隆徳 X — https://pbs.twimg.com/profile_images/1215831088603385857/agorPvf8_80x80.jpg
- `404` 新城勇哉 X — https://pbs.twimg.com/profile_images/2085244223264305152/EG-HM3ek_80x80.jpg
- `404` 田中羚 X — https://pbs.twimg.com/profile_images/2011328594921091073/SaZyUy_P_80x80.jpg
- `404` 田辺ゆい X — https://pbs.twimg.com/profile_images/2070752681304768512/bPADaCry_80x80.jpg
- `404` 東城りお X — https://pbs.twimg.com/profile_images/1754483138179547136/gEx-KG4a_80x80.jpg
- `404` 永田泰志 X — https://pbs.twimg.com/profile_images/2090800744211591168/PUs-KJGr_80x80.jpg
- `404` 比嘉秀樹 X — https://abs.twimg.com/sticky/default_profile_images/default_profile_80x80.png
- `404` 比屋定秀太 X — https://abs.twimg.com/sticky/default_profile_images/default_profile_80x80.png
- `404` 平野よしつね X — https://pbs.twimg.com/profile_images/2038425646851084288/ttydf_GA_80x80.jpg
- `404` HIRO柴田 X — https://pbs.twimg.com/profile_images/1963845940693127168/L0w_2l_Q_80x80.jpg
- `404` 星野佑太 X — https://pbs.twimg.com/profile_images/2094000710975385600/xAw1XcJ3_80x80.jpg
- `404` 森東賢一 X — https://pbs.twimg.com/profile_images/1137877240488706048/3cZ3jct3_80x80.jpg
- `404` 山田祐輝 X — https://pbs.twimg.com/profile_images/2037373485761368064/uSXWnsFR_80x80.jpg
- `404` 吉野敦志 X — https://pbs.twimg.com/profile_images/1535376354103160832/x8DDWuj4_80x80.jpg
- `404` 渡邊亮 X — https://pbs.twimg.com/profile_images/1882814781239009280/ImPQPXQ1_80x80.jpg

---
_スプレッドシートの画像URLを更新すると解消します。次回の検知で解決していれば、このissueは自動的に閉じられます。_

### コメント (1件)

**github-actions** (2026-09-07):

1985件を確認し、リンク切れは検出されませんでした。

---
