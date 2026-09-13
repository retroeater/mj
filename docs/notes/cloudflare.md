# Cloudflare 関連の実装記録

このファイルは完了済み作業の記録。現状とルールは docs/handover.md。

---

### 配信まわりの整理（2026年9月10日に完了）

9月9日〜10日で以下を実施し、配信まわりが一区切りついた。

| # | 内容 | 効果 |
|---|---|---|
| #94 | アイコンフォント2種を廃止しSVG化 | 使用は19種類のみだったのにフォント2セットを全ページで配信していた |
| #93 | Google Fonts の廃止 | index.html のみが Open Sans / Poppins / Raleway を読んでいた。外部2ドメインが消えた |
| #99 | Bootstrapのソースマップ参照を削除 | `.map` への404が24時間で28件発生していた |
| #92 | 静的アセットのキャッシュヘッダ | 画像に1年、vendorに30日 |
| #98 | php-email-form の削除 | PHPが動かない環境でPHP用フォーム検証を配信していた |
| #100 | フッターの著作権表示を修正 | テンプレートのプレースホルダが残っていた |

#### 配信の実測（2026-09-11 に確認）

| 確認項目 | 結果 | 意味 |
|---|---|---|
| `curl -sI https://www.ryoei.pro/jpml_pros.html` | **200** | www と apex の両方が同じ内容を配信していた。**Redirect Ruleで解消済み（下記）** |
| `curl -sI https://ryoei.pro/jpml_pros.html` の `cf-cache-status` | **HIT** | HTML はすでにエッジキャッシュから配信されている |

**HTML はすでにキャッシュされているため、Cache Rules で HTML のエッジキャッシュを
足す余地はない。** 「Initial server response time 400ms」の原因はキャッシュ不足では
なく、Workers 静的アセット配信そのものの応答時間である、という当初の記録が
実測で裏付けられた。同じ検討を繰り返さないこと。

副次的に、Speed Brain の動作条件のひとつ「キャッシュ適格であること」は
満たされていることも確認できた。

#### www→apexのRedirect Rule（#115、2026-09-11対応完了）

| 項目 | 値 |
|---|---|
| 一致条件 | Wildcard pattern |
| Request URL | `https://www.ryoei.pro/*` |
| Target URL | `https://ryoei.pro/${1}` |
| Status code | 308 |
| Preserve query string | 有効 |
| Place at | First |

`_redirects` ではなく Redirect Rule を使ったのは、`_redirects` がパスでしか
分岐できずホスト名で条件を書けないため。

**Preserve query string は必須。** `?name=` 付きURLが検索流入の主力（検索結果に
出た22URLのうち14件、SEO節）で、無効にすると www 経由の流入が全件表示ページに
着地してしまう。エンコード済みURLで308とクエリ文字列保持済みの`location`を確認済み。

#### Cloudflareの機能が「効くかどうか」の判定について

Workers 静的アセット配信にはオリジンサーバーが存在しないため、
オリジンを前提とする機能は効かない（#71 / Polish / Mirage / Argo）。
2026-09-11 に Speed Brain も同じ理由で効かないことが確認された。

**判定は「設定が有効か」ではなく「実際の動作」で見ること。**
Speed Brain の場合、有効化すると `Speculation-Rules` ヘッダは正常に付与される。
しかし実際の prefetch リクエストは全件拒否される。

    curl -sI -H "sec-purpose: prefetch" https://ryoei.pro/jpml_titles.html | head -1

    HTTP/2 503
    cf-speculation-refused: prefetch refused: disabled for worker requests

ヘッダの有無だけを見ると「機能している」と誤判定する。
今後 Cloudflare の新機能を検討するときは、同じ落とし穴に注意すること。

**ダッシュボードの表示は外部記事より優先する（#130、2026-09-13）。**
Cloudflareの仕様変更について外部記事を根拠にhandoverの記述を
書き換えたが、実際のダッシュボードと食い違っていた。設定画面で
確認できることは、平野さんにスクリーンショットを依頼してから
判断すること。

#### 日本語を含むURLをcurlで検証すると400が返る（curl固有の挙動、実害なし）

curl は URL の非ASCIIバイトをそのまま送るため、HTTP リクエストラインの
パース段階でエッジが 400 を返す。ブラウザは href を解釈してリクエストを送る
時点で自動的にパーセントエンコードするため、実際のクリック遷移では起きない。
apex へ直接投げても同じ 400 になることを確認済みで、www リダイレクト（#115）とは
無関係。

生成ページの内部リンクは `?name=夏目一花` のように日本語をそのまま HTML 属性値に
埋め込んでいるが、これは仕様上問題ない。

検証するときは URL エンコード済みの形を使うこと:

    curl -sI "https://www.ryoei.pro/jpml_pros.html?name=%E5%B9%B3%E9%87%8E%E8%89%AF%E6%A0%84" | head -5

### Cloudflare

- **charsetが付くかどうかは拡張子ではなく配信経路で決まる。** Workersの
  静的アセットとしてそのまま返るファイル（例: `/llms.txt`）はCloudflare側で
  charsetが付かず`text/plain`のみになり、日本語環境のブラウザがShift_JISと
  誤認して文字化けする。`_headers`に`Content-Type: text/plain; charset=utf-8`
  のようなルールを足せば上書きできることを`/llms.txt`で実証した（#161、
  平野さんが本番確認済み）。`_headers`でのContent-Type上書きがWorkers静的
  アセットに効くこと自体はこれで実証済み。日本語を含むテキストファイルを
  新たに公開するときはこの方法を使う
- **AI Crawl Control が管理 robots.txt を自動で前置する。** そのため自作の
  `robots.txt` は `Sitemap:` の宣言のみにしている。前置されたrobots.txtは
  Cloudflare側でcharset込みの`Content-Type: text/plain; charset=utf-8`が
  組み立てられるため、`llms.txt`と違い`_headers`での明示は不要（#175で
  本番確認済み。文字化けの疑いはなかった）
- AI学習用クローラー（GPTBot/ClaudeBot等）はブロック、検索エンジンとAIの検索・回答は許可
  （詳細・経緯は下記「AIクローラーの扱い」参照。本対応は#130で管理）
- Tiered Cache は**効果がない**（Workersの静的アセットにはオリジンサーバーがないため）
- **Web Analytics のビーコンは `/cdn-cgi/rum` への POST。**
  HTTPメソッドやパスで遮断するルールを書くときは `/cdn-cgi/` を
  除外すること（#110）
- **Managed Ruleset の Block / Log は Security rules の一覧画面では
  判別できない。** 一覧の Action 列に出る `Execute` はルールセットを
  実行するというデプロイ段階のアクションで、ルールセット内部の
  Block / Log とは別物。確認するにはルールセット名をクリックして
  Deploy managed ruleset の画面まで入り、Ruleset action を見る（#76）

#### Speed 設定の現状（2026-09-11 時点）

Speed → Recommendations（Site Recommendations）の一覧と、それぞれの判断。

| 項目 | 状態 | 判断理由 |
|---|---|---|
| Web Analytics (RUM) | 有効 | #32 で GA4 から移行済み |
| Speed Brain | **無効** | 有効化して実測した結果、prefetch が拒否された（#119）。Off に戻した |
| Polish / WebP | 無効 | #71 のとおり。Workers 静的アセットにオリジンがなく効果がない。加えて `<img>` をエッジで書き換えるため #9 と競合する |
| Image Transformations | 未購入 | Cloudflare Images の別課金。自前画像は11枚178KB、選手画像1,985枚は外部7ドメインにあり対象外 |
| Rocket Loader | 無効 | 全ページで `defer` を付けているため効果がない。CSP（#9）とも競合する |
| HTTP/2 | 有効 | 既定 |
| HTTP/3 | **有効化(2026-09-11)** | モバイル回線で効く。リスクなし |
| HTTP/2 to Origin | 有効 | オリジンが存在しないため実質無効。害もないので触らない |
| Enhanced HTTP/2 Prioritization | 有効 | 同上 |
| 0-RTT Connection Resumption | **有効化(2026-09-11)** | GET/HEAD にしか適用されない。状態を変えるエンドポイントが1つもない静的サイトのため、リプレイの実害がない |
| Always use HTTPS | **有効化(2026-09-11)** | 下記参照 |
| TLS 1.3 | 有効 | 既定 |
| Early Hints | **有効化(2026-09-11)** | ただしトグルだけでは何も起きない。下記参照 |

**「Enable all settings」ボタンは押さないこと。** Polish が一括で有効になり、
#71 と #9 の判断が覆る。個別に切り替える。

**Always use HTTPS が無効だったのは穴だった。** `_headers` に HSTS
（`max-age=31536000; includeSubDomains`）は入っていたが、HSTS が効くのは
一度 HTTPS で訪問済みのブラウザだけ。初回訪問者が `http://` で叩いた場合、
リダイレクトされずに HTTP のまま配信される状態だった。2026-09-11 に解消。

**Early Hints はトグルを入れただけでは動かない。** Cloudflare の実装は
レスポンスの `Link: ...; rel=preload` / `rel=preconnect` ヘッダをキャッシュして
103 で先出しする仕組みで、HTML 内の `<link>` タグは見ない（Pages には
`<link>` からの自動生成があるが、Workers 静的アセットで同じ挙動をするかは未確認）。
`_headers` に `Link:` 行を足す必要がある。設計は別issueで扱う（#129）。
Speed → Content Optimization の **Smart Hints**（クローズドベータ）が
Early Hints の対象を自動選択する機能で、#129 の代替になりうる。
#129 着手前に申し込む方針。

#### DNS・メール・通知の設定（2026-09-11）

DNS レコードは元々3件だった（Search Console の所有権確認 TXT、
apex と www の Worker レコード）。**MX は未設定。**

| 項目 | 状態 |
|---|---|
| DNSSEC | 有効化済み（#117）。Registrar も DNS も Cloudflare のため DS 登録まで自動 |
| SPF | `v=spf1 -all`（#116） |
| DMARC | `v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s;`（#116） |
| DKIM | `*._domainkey` に空ポリシー（#116） |
| 通知 | Universal SSL Alert のみ（#118）。宛先は別事業者のドメイン |

**Cloudflare の通知には Registrar 用の Alert Type が存在しない。**
Billing の2種類も「支出がしきい値を超えたら通知」で、
支払い失敗による失効は検知できない。ドメイン失効対策は
Domain Registration 画面で Auto renew と期限を直接確認する方法に切り替えた
（2026-09-11 時点: Active / 期限 2028-03-20 / Auto renew On）。

**#17（Email Routing）に着手するときは SPF の書き換えが必須。**
`v=spf1 -all` のままだと `@ryoei.pro` からの送信が拒否される。

**www.ryoei.pro の Worker レコードは削除しないこと。**
削除すると www が名前解決できなくなり、#115 で設定した
www → apex の Redirect Rule に到達する前に失敗する。
Redirect Rules は Workers より前に評価されるため、
レコードを残したままで正しく308が返る。

#### AIクローラーの扱い（2026-09-13時点）

Cloudflare の「Block AI bots」一括トグルは **2026-09-15 に廃止**され、
挙動ベースの制御（Search / Agent / Training）へ移行する。

9月15日以降、複数の目的を持つクローラーは宣言されたすべての挙動で評価され、
最も厳しいルールが適用される。Googlebot / Applebot / Bingbot は検索と
AI機能を単一のユーザーエージェントでクロールするため、
「AI学習をブロック」という設定に巻き込まれる。

2026-09-11、期限前の対応として
`Mixed purpose crawlers will continue to be allowed.` を選択した。

**学習用クローラーをブロックしてもAI検索・回答での露出は減らない。**
学習クロールは引用も参照トラフィックも生まないため。
混在クローラーを許可しても、学習利用を拒否する目的は損なわれない。

本対応は#130で管理する。旧トグルは2026-09-15に廃止され、新コントロール
（Configure AI bot policies）に置き換わる（ダッシュボードで確認済み）。
新コントロールは2026-07-01から設定可能なため、9/15を待つ必要はない。
**9/13に新コントロール側でSearch/Agent=Allow・Training=Blockを設定済み。**
設定前後でrobots.txtの管理セクション34行は完全一致し、旧トグルが同じ
出力を出しているため判定は9/15以降。クローズ条件は#130に記載済み。

**robots.txt の実測は平野さんの手元で行う（#130、2026-09-13）。**
`ryoei.pro` はチャットセッションからも Claude Code のセッション環境からも
到達できないため、配信内容の確認は Windows / PowerShell で行う。
その際 `>` リダイレクトは使わないこと。PowerShell 5.1 の既定が UTF-16LE の
ため、日本語部分が文字化けする（#130の1回目の取得で実際に発生し、
本番の不具合と誤認しかけた）。`curl.exe` の `-o` を使えばバイト列が
そのまま書かれる。

    curl.exe -s -o robots-YYYYMMDD.txt https://ryoei.pro/robots.txt
    Get-Content robots-YYYYMMDD.txt -Encoding UTF8

### Cloudflare Pro でできること・できないこと

**HTTP Traffic 分析（Analytics → Traffic）**

- パス別の内訳が出る（Freeでは出ない）
- **Query string をフィルタ条件に使える。** ただし値ごとの
  内訳は出ないため、「どの選手名が多いか」は
  Search Console 側で見る
- 他の軸: Cache status / Source browser / Source device type /
  Data center / Source ASN / Edge status code など
- Download data は表示中の上位5系列を15分刻みで出すのみ。
  生ログではない
- Bot score はこの画面にはない。Bot Report は
  Security → Bots の別画面

**オリジンを前提とする機能は効かない**

Workers静的アセットにはオリジンサーバーが存在しないため、
以下はいずれも効果がないか対象がない。#71（Tiered Cache）を
見送ったのと同じ理由。

| 機能 | 判断 |
|---|---|
| Polish | 不採用。自前画像は11枚178KBで、主要3枚はすでにWebP。選手画像の外部ドメイン依存は同上 |
| Mirage | 不採用。同上に加え、`<img>`をエッジで書き換えるため #9 と競合 |
| Argo Smart Routing | 不採用。Proに含まれず別課金（月$5＋$0.10/GB） |
| Load Balancing | 不採用。別課金かつ分散対象がない |

### トラフィックの実測値（2026年9月9日）

**ドメイン切替が同日12時頃のため、以下は約10時間分。
1日分の数字ではない。**

| 出所 | 数値 |
|---|---|
| エッジ / 総リクエスト | 3,030（キャッシュ済み2,430・未キャッシュ602） |
| エッジ / ユニーク訪問者 | 197 |
| Web Analytics / ページビュー | 114 |
| Web Analytics / 訪問 | 75 |

ユニーク197に対し訪問75。**#90で確認済み（2026-09-09時点）**: ボットが
約7割（Likely Automated 41% + Automated 26%）。Verified Botはわずか3%で、
実体は素性の分からないデータセンター由来の自動化トラフィックだった。

サーバーサイド計測を自前で作る場合（#19で検討・見送り）も、
この規模なら Analytics Engine の Free 枠（1日10万書き込み）に
十分収まる。

### 検討して見送った技術(2026-09-09〜10)

| 項目 | 判断 | 理由 |
|---|---|---|
| PWA化 | 却下 | オフライン利用の場面がない |
| iOSアプリ / Androidアプリ化 | 却下 | Webサイトを包んだだけのアプリは審査で弾かれる。年$99の登録と審査対応が恒久的に発生する |
| minify / mangling | 却下 | 自前JS・CSSは小さく、Brotliが効けば削減幅はさらに縮む。ビルド工程を持たない構成を崩す対価に見合わない |
| Tree shaking | 却下 | バンドラを前提とする最適化のため、現行構成では適用できない |
| stale-if-error | 却下 | オリジンサーバーが存在せず、守る対象がない |
| CodeRabbit | 却下 | PR運用が前提だが、現在は cloudflare ブランチへ直接pushしている |
| GitHub Copilot | 却下 | Claude Code と役割が重複する |
| X API | 却下 | 無料枠が実質廃止され有料プランは月$100から。APIを必要とする機能がない |
| Super Bot Fight Mode | 却下 | Proで遮断できるのは Definitely automated のみ。実測で最大の塊は Likely automated（41%）で手が出ない（#91） |
| Polish / Mirage / Argo Smart Routing | 却下 | Workers静的アセットにはオリジンが存在しないため効果がない（#71と同じ理由） |

### 検討して見送った技術(2026-09-11)

| 項目 | 判断 | 理由 |
|---|---|---|
| JWTのHttpOnly Cookie | 対象外 | 認証機能もログインもユーザーデータもない静的サイト。将来SDPに管理画面を作る場合もCloudflare Accessのほうが適切 |
| IWA（Isolated Web Apps） | 却下 | 署名済みバンドルの配布が前提のエンタープライズ向け技術。PWA化を却下した理由がそのまま当てはまる |
| workbox.precaching | 却下 | PWA却下済み、かつビルド工程を持たない構成 |
| `<link rel="prerender">` | 却下 | Chrome独自で非推奨。Speculation Rules APIに置き換わっている（要否は#105で判断） |
| CSS @function / if() | 却下 | if()はChrome 137以降のみでFirefox・Safari未実装。@functionも同様。Baselineに遠い |
| @supports at-rule() | 却下 | 上2つを安全に使うための道具。使わないなら不要 |
| CSS text-fit | 却下 | 提案段階で実装がない |
| `<meta name="text-scale">` | 却下 | Chrome 146以降のみでFirefox・Safari未対応。使う場合は最大300%超の拡大に耐えるかのテストが必要で、対価に見合わない |
| スクロールバーを考慮したビューポート単位 | 見送り | .mj-table-2col を width: 100% にしたため当面出番がない |
| Reduce unused CSS（Bootstrap CSSの削減） | 見送り | Lighthouseの改善提案1位（mobile合計約1,090ms）だが、ビルド工程を持たない構成を崩す対価に見合わない。minifyを却下したのと同じ理由。Bootstrapをやめるかどうかは新サイト（#101）で判断する |
| Initial server response time の改善 | 対処不可 | 全6ページで指摘（最大 resource_logs 400ms）。Cloudflare Workers の静的アセット配信そのものの応答時間で、ページ側の対処手段がない |
| Zaraz | 却下 | 第三者スクリプトが1本もない。タグマネージャの対象がない |
| Turnstile | 却下 | `<form>` が27ページに0個。保護する送信経路がない |
| Waiting Room | 却下 | 同時接続を制限する必要がある場面がない。別課金 |
| Cache Reserve | 却下 | R2の課金が発生する。アセット総量が小さく見合わない |
| Logpush | 対象外 | Enterprise限定 |
| Hotlink Protection | 却下 | 自前画像は11枚178KB。守る対象が小さい。選手画像の外部ドメイン依存は同上 |
| HSTS preload | 見送り | `_headers` の `max-age=31536000; includeSubDomains` で実用上は十分。preloadリストへの登録は実質不可逆で、将来サブドメインをHTTPで使う自由を失う |
| Speed Brain | 却下 | 有効化して実測したところ、prefetch が `HTTP 503` / `cf-speculation-refused: prefetch refused: disabled for worker requests` で拒否された。Workers 静的アセット配信では機能しない。#71・Polish・Mirage と同じ理由 |
| Cache Rules による HTML のエッジキャッシュ | 却下 | `cf-cache-status: HIT` を実測。HTML はすでにキャッシュから配信されており伸びしろがない（#123） |
| Image Transformations / Cloudflare Images | 却下 | 別課金。自前画像は11枚178KBで主要3枚はすでにWebP。選手画像の外部ドメイン依存は同上 |
| Prefetch URLs（Cloudflare） | 対象外 | Enterprise プラン限定。Speed Brain が拒否される件と合わせて、Cloudflare 側で prefetch を実現する手段は残っていない |
| Cloudflare Fonts | 不採用 | #93 で Google Fonts を廃止しシステムフォントに統一済み。最適化する外部フォントが存在しない |
| Automatic Platform Optimization for WordPress | 対象外 | WordPress サイトではない。ダッシュボードにも「The WordPress plugin was not detected on ryoei.pro」と表示される |
| Shared Dictionary Compression | 見送り | Passthrough はオリジンが辞書圧縮を処理する前提。Workers 静的アセットは対応しないため Off のまま |
| Smart Hints | 保留 | クローズドベータ。Early Hints の対象を Cloudflare が自動選択する機能で、#129 の代替になりうる。#129 着手前に申し込む |
| Mantis（Google のAIセキュリティ用ハーネス） | 却下 | パイプラインの中核が「サンドボックスでクラッシュを再現 → パッチが再現を止めることで検証」のため、実行体を持たない静的サイトでは空回りする。Worker スクリプトなし・フォーム0・認証なし・DBなしで、自前コードは約6,200行（JS 3,237行 + Python 2,966行）。加えて Docker + gVisor と専用の隔離VMが前提で、`gh` 認証済みの Codespace で回すのは「本番に触れる環境で実行するな」という README の要件に反する。Google 自身も「公式サポート製品ではない」「本番利用を意図しない」と明記。再評価は新サイト（#101/#21）でサーバーサイド（#28/#29/#30）が入ってから |

**すでに対応済みだったもの**

- HTML5 doctype: 27ページ全部に入っている
- OWASP推奨対策: 静的サイトで該当するヘッダ系は `_headers` に導入済み（X-Frame-Options / X-Content-Type-Options / Referrer-Policy / Permissions-Policy / HSTS）。残るのはCSPのみで、それが #9
- 入力値の検証とサニタイズ: `<form>` は27ページに0個。入力経路はURLパラメータのみで、移行済みページは生成時に esc() を通し、絞り込みは textContent 比較のためXSSの経路がない。innerHTML は index.js に1箇所（アイコン切替の定数）だけ

