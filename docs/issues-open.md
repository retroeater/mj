# GitHub Issues スナップショット（Openのみ）

生成日時: 2026-09-13 10:27 JST

未完了のissueだけを抜き出したスナップショットです。本文・コメントを
含みます（他のClaudeチャットに経緯まで正しく理解してもらうため）。

【参照ルール】セッション開始時はこのファイルを読んでください。
完了確認など、Close済みのissueを見る必要があるときは
issues-snapshot.md（全件）を参照します。

最新化が必要になったら `/issues` コマンドを実行してください。
issues-snapshot.md と同時に再生成されます。

件数: 51件（openのみ）。番号降順。

---

## #173 帰り道シートに個別ページ用の列を追加し、ページとVideoObjectに反映する

- 作成: 2026-09-12
- ラベル: 分野: SEO/AIO, 対象: video_wayhome

### 本文

### 経緯

#162（エピソード個別ページ38枚の静的生成）で追加した各ページ
（`wayhome/<動画ID>.html`）は、本文が実質的にタイトル戦名・選手名・
公開日のみで、JSON-LDの`VideoObject.description`とページ本文
（`.mj-lead`含む）が同一文言になっている。thin content気味という
懸念が#162のdocs/handover.md「#162 エピソード個別ページ38枚」節に
記録されている。

「帰り道」シート（スプレッドシート）に列を追加できれば、この懸念を
解消できる可能性がある。

### やること（提案。列の追加自体はスプレッドシート側の作業）

- 説明文（各エピソード固有の紹介文。手動記入を想定）
- 尺（動画の長さ。`VideoObject.duration`はGoogleの推奨プロパティだが
  現状シートに秒数等の情報が無く未設定。#13にも記録あり）
- 反映先: `scripts/generate_wayhome_episodes.py`（ページ本文・
  meta description）、`scripts/lib/wayhome.py`の`build_video_object()`
  （`VideoObject.description`/`duration`）

### 依存・関連

- #162（エピソード個別ページ38枚、この課題の発端）
- #13（構造化データ）

---

## #172 video_wayhome.html の description に件数を入れるか決める

- 作成: 2026-09-12
- ラベル: 分野: SEO/AIO, 対象: video_wayhome

### 本文

### 経緯（2026-09-12、Claudeとの検討）

#158 で生成済み15ページの description に `{count}`（生成時に実データの
行数で置換）を入れ、meta description / og:description / 本文の .mj-lead の
3か所に同じ数字が出るようにした。

video_wayhome.html だけ件数が入っていない。#102第2段（8052879）で
このページが全面リデザインされた際に description が新しい文に
差し替わっており、`{count}` の挿入箇所がないため。

### 現在の文

YouTubeチャンネル「日本プロ麻雀連盟」の企画「帰り道ついていってイイっすか」。タイトル戦を終えた選手への密着インタビュー動画を、最新話から選手名・タイトル戦名で検索できます。

リデザイン後の文として完成しており、このままでも問題はない。

### 検討すること

他の14ページが件数入りで揃うため、方針として揃えるかどうか。
揃えるなら「密着インタビュー動画{count}本を、最新話から…」のように
1語足す形になる（現在38本）。

実装は `scripts/generate_video_wayhome.py` の description に `{count}` を
入れるだけ。`generate()` が `len(raw_rows)` を渡す仕組みは #158 で
共通化済みのため、他の変更は不要。

### 判断の観点

- 件数の表記が全ページで揃っていることに価値があるか
- #102 の新デザインのパイロットとして、このページだけ別の文体を
  許容するか（新サイトの description の書き方を決める材料になる）

---

## #170 本番反映にゲートを設けるか検討する

- 作成: 2026-09-12
- ラベル: 状況: 保留, 分野: インフラ

### 本文

## 背景

#169の後始末（deploy.yml誤作成の是正）で判明した事実: `cloudflare`への
pushはCloudflare Workers Builds（ダッシュボードのGit連携）により即座に
本番へ反映される。ワンクッションを置く仕組みは無い。

## 現状の問題

並行する複数セッションのpushがそのまま本番に出る構造になっている。
#157（他issueのCSSが無関係なコミットに混入した例）や#167（再生成ワークフローが
複数コミットのうち一部を取りこぼしたまま成功していた例）のような取りこぼしは、
気づいた時点で既に本番に出ている。

## 案

Workers Builds の Production branch を `cloudflare` から別ブランチ
（`production` 等）に変え、`cloudflare` → `production` のマージを人の判断で
行うようにする。セッションは従来どおり `cloudflare` に push できる。

## トレードオフ

運用が一手増える（マージ操作が追加で必要になる）。現状維持（即時反映のまま）
も選択肢としてありうる。

## 実施について

**Cloudflareダッシュボード側の設定変更が必要なため、実施は平野さんの作業になる。**

### コメント (1件)

**retroeater** (2026-09-12):

#169の後始末とトークン整理を通じて確認できた実例を、判断材料として記録します（新しい方針の決定は含みません）。

## 実例1: 検査ワークフローとデプロイは独立に走る

`assets-check.yml`（GitHub Actions、`.assetsignore`の漏れを検知）とWorkers Builds（Cloudflare、本番反映）は互いに独立している。

検査が失敗してもデプロイは止まらない。`assets-check.yml`は`exit 1`で失敗するようにしてあるが、それはGitHub上で赤くなるだけで、Cloudflare側は関知せず本番へ反映する。つまり現状の検査は「防止」ではなく「検知」であり、気づいたときには既に本番に出ている。

ゲートを設けるかどうかは、この「検知しかできない」状態を許容するかという問いでもある。

## 実例2: ビルド結果はcheck-runsで読める

Workers Buildsは結果をGitHubにcheck-run（`Workers Builds: mj`）として書き戻すため、セッションからも成否を確認できる。

これはゲートを設計する際の材料になる。仮に`cloudflare`→`production`のマージをゲートにする案を採る場合、マージ前に`assets-check.yml`の結果を確認する、という形が取れる（現状は確認する先が無いまま反映されている）。

---

## #167 複数コミットをまとめてcloudflareへpushすると再生成が漏れる

- 作成: 2026-09-12
- ラベル: 分野: 自動化

### 本文

### 現象

`regenerate-page.yml` は push の**最終コミットの差分しか見ない**ため、
複数コミットをまとめて cloudflare へ push すると、途中のコミットで
`scripts/lib/**` や `scripts/generate_*.py` を変更していても再生成が
走らない。ワークフローは「対象0件」として **success で終わる**ので、
失敗としても気づけない。

### 実例（#78 で発生、2026-09-12）

3コミットを1回の push で cloudflare に入れた。

| コミット | 内容 |
|---|---|
| `fceeb16` | OGP画像と生成スクリプトを追加 |
| `5caba7e` | **`scripts/lib/page.py` の HEAD_TEMPLATE に og:image を追加** |
| `020957f` | スクリプトをリネーム（最終コミット） |

[run #55](https://github.com/retroeater/mj/actions/runs/34685971154) は
success だが11秒で終了し、1ページも再生成していない。ワークフローが見た
変更ファイルは最終コミット `020957f` の3件（`CLAUDE.md` /
`scripts/apply_page_meta.py` / `scripts/build_ogp_image.py`）だけで、
`scripts/lib/page.py` は差分に現れなかった。

このときは16ページのHTMLを手で直接編集済みで、テンプレートとの完全一致も
確認したため実害は出ていない。ただしテンプレートだけを変更して push して
いたら、生成ページに反映されないまま放置されていた。

### 原因

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 2   # 変更ファイルを調べるため直前のコミットも取得する
...
    git diff --name-only HEAD^ HEAD > /tmp/changed.txt || true
```

`HEAD^ HEAD` は最終コミット1つ分の差分。push に含まれるコミット全体の
範囲ではない。

### 対応案

push イベントが持つ範囲（`github.event.before` 〜 `github.sha`）で差分を
取る。あわせて `fetch-depth` を広げる必要がある（`0`、または範囲を賄える
深さ）。

考慮が要る点:

- ブランチ新規作成時や force push 後は `github.event.before` が
  `0000000...` になる。その場合は `all` へフォールバックするなどの
  分岐が必要
- 範囲が広がるぶん対象ページが増え、実行時間が延びるケースがある

簡易案として「`scripts/lib/**` が push 範囲に含まれていたら無条件に `all`」
でも今回のケースは防げる。

### 補足

毎週月曜 05:37 JST の定期実行（`all`）があるため、漏れても最大1週間で
自動的に解消される。緊急度は高くない。

### コメント (2件)

**retroeater** (2026-09-12):

### 着手中

このissueに着手します。

- セッション: https://claude.ai/code/session_013VkNnk8b6ZBzbMBaQiWhxg
- ブランチ: `claude/ogp-image-metatags-x15ui2`

方針は本文の対応案のとおり、`regenerate-page.yml` の差分検知を push の
範囲（`github.event.before` 〜 `github.sha`）に広げる方向で進めます。
`fetch-depth` の拡張と、`github.event.before` が `0000000...` になる
ケース（ブランチ新規作成・force push）のフォールバックも併せて扱います。

---
_Generated by [Claude Code](https://claude.ai/code)_

**retroeater** (2026-09-12):

### 対応済み: push範囲全体の差分で判定するようにした

コミット `d310b03`（cloudflareに反映済み）。

#### 変更点

**1. 差分の取り方**

```diff
-            git diff --name-only HEAD^ HEAD > /tmp/changed.txt || true
+            BEFORE="${{ github.event.before }}"
+            AFTER="${{ github.sha }}"
+            ...
+              git diff --name-only "$BEFORE" "$AFTER" > /tmp/changed.txt
```

**2. `fetch-depth: 2` → `0`**

push範囲を辿るには全履歴が要る。`2` では最終コミット1つ分しか遡れない。

**3. 範囲が確定しないときは `all` へ倒す**

`before` が全0（ブランチ新規作成）、空、または既に存在しないコミット
（force push）を指す場合は範囲を特定できないため、安全側に倒して全ページ
再生成する。

**4. `|| true` を外した**

`git diff` が失敗しても0件として success で進むのは、このissueの症状
そのもの。失敗は落として気づけるようにした。

#### 検証（実際のリポジトリ履歴で判定ロジックを実行）

| ケース | 範囲 | 結果 |
|---|---|---|
| **本件の回帰そのもの** | `8f71cdb..020957f`（3コミット、`lib/page.py` は中間） | **0件 → 全16ページ** |
| ブランチ新規作成 | before が全0 | all へフォールバック |
| force push | before が存在しないSHA | all へフォールバック |
| before が空文字 | — | all へフォールバック |
| 単一コミット・対象外ファイルのみ | `5caba7e..020957f` | 0件のまま（従来どおり） |
| docsのみ | `a978fab..b523e38` | 0件のまま（従来どおり） |

YAMLのパースと、`run:` ブロックのシェル構文（`bash -n`）も確認済み。

#### 残る確認

**このコミット自体ではワークフローは起動しない。** 変更したのが
`.github/workflows/regenerate-page.yml` と `CLAUDE.md` で、どちらも
パスフィルタ（`scripts/generate_*.py` / `scripts/lib/**` / `*.js`）に
該当しないため。

次に該当ファイルを含む push があったときが初の実走になる。ログの冒頭に

```
push範囲: <before>..<after>
変更されたファイル:
```

が出ていれば新しい経路を通っている。それを確認できるまでこのissueは
開けたままにしておく。

---
_Generated by [Claude Code](https://claude.ai/code)_

---

## #166 index.html のSNSアイコンリンク5件にアクセシブルネームが無い（link-name）

- 作成: 2026-09-12
- ラベル: 分野: UI/UX, 対象: index

### 本文

`index.html` のSNSアイコンリンク5件が、中身が装飾的な `<svg>` だけでテキストも
`aria-label` も持たないため、アクセシブルネームが存在しない。
axe-core で **`link-name` の violation（impact: serious）** として検出される。

## 該当箇所

`index.html` の54〜58行目:

```html
<a href="https://twitter.com/retroeater" class="twitter"><i><svg …></svg></i></a>
<a href="https://www.facebook.com/ryoei" class="facebook"><i><svg …></svg></i></a>
<a href="https://www.linkedin.com/in/ryoei/" class="linkedin"><i><svg …></svg></i></a>
<a href="https://github.com/retroeater/" class="github"><i><svg …></svg></i></a>
<a href="https://www.imdb.com/name/nm14435079/" class="imdb"><i><svg …></svg></i></a>
```

スクリーンリーダーではリンク先URLがそのまま読み上げられるか、
「リンク」としか読まれず、どこへ行くリンクなのか分からない。

## 経緯

#163（`navbar.js` の検索アイコンに `aria-label` を足す）の調査中に発見した。

`index.html` は**全27ページで唯一 `navbar.js` を読み込まないページ**で、
このSNSアイコンはテンプレート（iPortfolio）由来の独自マークアップ。
#163 とは原因が別で、`index.html` を直接直す必要があるため別issueとして起票した。

## 対応

各リンクに `aria-label` を足す。文言はサービス名が分かるもの（例: `aria-label="X (Twitter)"`、
`aria-label="Facebook"`、`aria-label="LinkedIn"`、`aria-label="GitHub"`、`aria-label="IMDb"`）。

`index.html` はビルド時生成の対象外（`scripts/generate_index.py` は存在しない）なので、
HTMLを直接編集する。再生成は不要。

## 参考: 現状の index.html の Lighthouse

`docs/lighthouse-baseline.md` の初回計測では index.html の accessibility は
mobile / desktop とも 93。`link-name` を解消すればここが上がる見込み。
（#163 の対応で他26ページは 0.98〜1.00 になっており、index.html だけが取り残されている状態）

---

## #165 新サイトでOGP画像をページ別に出し分けるか検討する

- 作成: 2026-09-12
- ラベル: 状況: 保留, 分野: SEO/AIO

### 本文

### 経緯（2026-09-12、Claudeとの検討）

#78 で作ったOGP画像は「ryoei.pro」の文字のみの全ページ共通1枚。
現行サイトは26ページなので1枚で足りるという判断。

新サイト（#101）では選手個別ページが1,100ページ超になるため、
出し分けの価値が変わる。

### 検討すること

- 選手個別ページごとにOGP画像を生成するか（選手名・所属・成績を入れた
  カードを自動生成する。SNSでシェアされたときに誰のページか分かる）
- 生成方法（ビルド時に静的生成するか、Workers で動的生成するか）
- 選手写真を使うか。公式宣材写真が使えないため、X等のプロフィール画像を
  代替使用している制約がある（docs/new-site-design.md）。他人の
  プロフィール画像をOGPカードに焼き込むことの是非は別途判断が必要
- 文言の再検討。#78 では「日本プロ麻雀連盟 選手データベース」「平野良栄
  （日本プロ麻雀連盟）」を候補にしたが、シンプルさを優先して不採用にした。
  新サイトでは運営者の明示（連盟公式との誤認防止）をどう扱うか

### 依存

#101、#21

---

## #164 #7で用意した現行サイトの共通部品（lib/page.py・lib/chart.py・table.js）を新サイトへ引き継ぐかを判断する

- 作成: 2026-09-12
- ラベル: 状況: 保留, 分野: 整理・保守

### 本文

#7 で用意した現行サイトの共通部品を、新サイト（`docs/new-site-design.md`）へ
引き継ぐかどうかを判断する。

対象:

- `scripts/lib/page.py` — HTMLテンプレート・行組み立て・画像セル・エスケープの共通処理
- `scripts/lib/chart.py` — チャート生成の共通処理
- `table.js` — 絞り込み・ページ送り（型A/A' の11ページが共用）

新サイトは Astro ＋ D1 を想定しており前提が異なる。Astro を採用するなら
テンプレート/コンポーネントが `lib/page.py` の領域を担うため、Python の
文字列組み立ては引き継がない公算が大きい。一方で `table.js` の絞り込み・
ページ送りの挙動や、`lib/page.py` が持っているエスケープ・画像フォールバックの
考え方は、形を変えて持ち越す価値があるかもしれない。

## 判断材料

**#102 第2段のパイロット（`video_wayhome` の全面リデザイン）で、実際に
「持ち越せる部分／捨てる部分」を切り分けた実例がある。**
`docs/new-site-design.md` §12「パイロット: video_wayhome」の
「新サイトへ持ち越せる部分／捨てる部分」節を参照。

そこでの結論を要約すると:

- 持ち越せる: カラートークンの粒度・命名の考え方、共有ボタンの3段
  フォールバック方針、構造化データのビルダー関数の形、横スクロール＋
  `scroll-snap` のカード列パターン、WCAG AA の相対輝度計算による配色検証の手順
- 捨てる: `--mj-v-` 接頭辞そのもの、`body:has()` によるスコープの仕方、
  ヒーロー内テキストを固定色にする実装、**`render_content()` を手で直接呼ぶ構成**
  （＝ `lib/page.py` に相当する部分。Astro のテンプレート/コンポーネントが
  担う領域で、Python の文字列組み立ては引き継がない、という見立て）

つまり「方針・パターンは持ち越し、実装そのものは捨てる」という切り分けが
パイロットで実際に効いた。同じ切り分けを共通部品3点にも当てはめられるか、
というのがこの issue の判断。

## 位置づけ

**Astro 採用の判断（#21）と並んで、新サイト着手時の入口になる。**
Astro を採るかどうかで `lib/page.py` の扱いはほぼ決まるため、#21 の後に
（あるいは同時に）判断するのが自然。

## 経緯

`docs/new-site-design.md` §7「既存資産の扱い > 引き継ぐもの」の検討事項が、
追跡先として **#137** を指していた。しかし #137 は
「§1『現行サイトの扱い』の前提を修正する」という別件で、9/11 にクローズ済み。
追跡先が失われていたため、この issue を新しい追跡先として起票した。
§7 の参照もこの issue 番号に差し替える。

---

## #160 新サイトの情報設計を刷新する（h1・パンくず・内部リンク階層・五十音タブ）

- 作成: 2026-09-12
- ラベル: 状況: 保留, 分野: SEO/AIO, 対象: 全ページ

### 本文

### 提案理由（2026-09-12、Claudeとの検討）

SEO/AIO施策10件の中で**10番目**（新サイトで対応）。

- #5 で h1 / caption / label は新サイト前提で見送っている
- トップ→カテゴリ→選手個別のリンク階層と `BreadcrumbList`（#13）を作る
- 五十音タブ（#24）でDOMを絞ると Core Web Vitals も改善する（現状 jpml_pros はモバイル perf 37 / INP 458ms）
- ランキング評価とAIクローラーの巡回効率の両方に効く土台

### 依存

#101、#24、#13、#21

---

## #159 ?name= 付きURLから選手個別ページへの301マッピングを設計する

- 作成: 2026-09-12
- ラベル: 状況: 保留, 分野: SEO/AIO, 対象: 全ページ

### 本文

### 提案理由（2026-09-12、Claudeとの検討）

新サイトの選手個別ページ（#101）を作る際、既存の `?name=` 付きURL（検索流入の主力。GSCで22URL中14件）から個別ページへ301で誘導しないと、現在の評価を捨てることになる。

### 設計時に決めること

- 選手個別ページのURL（IDか名前か。docs/new-site-design.md の未決事項）
- `jpml_pros.html?name=` / `houou_results.html?name=` / `houou_leagues.html?name=` / `jpml_titles.html?name=` 等、ページごとの転送先（個別ページ内のセクションへ飛ばすか）
- `_redirects` はクエリ文字列で分岐できないため、Redirect Rules または Worker 側で実装する必要がある
- 301後の Search Console での監視

### 依存

#101、#122（`?name=` の内訳スナップショット）

### コメント (1件)

**retroeater** (2026-09-12):

#162（エピソード個別ページ38枚の静的生成）で、video_wayhome.htmlの`?name=`パラメータ受け入れを廃止した。GSCの検索結果に`video_wayhome.html?name=...`の形では出ておらず、平野さんが使う想定もないことを確認した上での判断（video_wayhome.js側の`#info_filter`初期値付けを削除。URLに`?name=`が付いていても単に無視される）。

これにより、本issueが検討していた「一覧ページの`?name=`→個別ページ」パターンのうち、少なくともvideo_wayhomeは対象外になった。詳細はdocs/handover.md「URLパラメータの棚卸し（#7）」節・「#162 エピソード個別ページ38枚」節に記録。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Tp6w3RZZoBPCnAAaKchVtV

---

## #156 次回データ更新後、エッジキャッシュのETagを比較して置き換わりを確認する

- 作成: 2026-09-11
- ラベル: 状況: 待ち, 分野: パフォーマンス, 対象: 全ページ

### 本文

### 何を確認するのか

デプロイ（GitHub Actionsによる `*_leagues_data.json` の再生成・push）が、
Cloudflareのエッジキャッシュのエントリを実際に置き換えるかどうかを確認する。

### 手順とベースライン

手順・実測ベースライン（2026-09-12時点のETag/cf-cache-status）は
#154 のコメントに記録済み。そちらを参照して同じ手順で再実行する。

### 実施タイミング

- 鳳凰戦のデータ更新は1月、女流桜花は9〜11月の予定
- 女流桜花のほうが直近に更新が来る見込みのため、
  `ouka_leagues_data.json` の再生成・デプロイが走ったら、その直後に実施する
- 鳳凰戦側でも同様に確認できるが、どちらか一方で判定がつけば足りる
  （両方待つ必要はない）

判定基準と、その場で対処せず結果を報告するだけでよいという扱いも
#154 のコメントに記録済み。

### コメント (1件)

**retroeater** (2026-09-12):

### 依存が1件増えた（2026-09-12）

#126（Bing / IndexNow）の Crawler Hints を有効にするかの判断が、この
issueの結果待ちになっている。Crawler Hints はエッジキャッシュ上の
コンテンツ変化を検知して IndexNow へ通知する仕組みのため、デプロイで
キャッシュエントリが置き換わることが確認できていないと、通知の有無を
判定できないため。

女流桜花のデータ更新後に ETag を比較する際、結果を #126 にも共有すること。

---

## #152 牌効率ページの見出しのフォントサイズが大きすぎる

- 作成: 2026-09-11
- ラベル: 分野: UI/UX, 対象: resource_efficiency

### 本文

### 状況

`resource_efficiency.html` の見出し

> どの牌を残すとメンツができやすいか | Efficiency to create a new group from an existing group and/or an isolated tile

は `<h1>` にクラス指定がなく、Bootstrap既定の見出しサイズ（かなり大きい）
のまま表示されている。下の「計算方法」等の本文（`.mj-margin-text`、
Bootstrap既定の16px）と比べて不釣り合いに大きい。

### やること

見出しのフォントサイズを本文と同じサイズに揃える。

### 対象ファイル

- `resource_efficiency.html`
- `style.css`（見出し用のスタイルを追加する場合）

### コメント (1件)

**retroeater** (2026-09-11):

## ⚠️ このissueのコミットに #127（型C）のCSSが混入しています

**revert する場合は `houou_leagues.html` / `ouka_leagues.html` が壊れます。**

### 何が起きているか

コミット [`4738d8d`](``https://github.com/retroeater/mj/commit/4738d8dc28eeb7d9251cf2dba2ef394b93868c1e)（「牌効率ページの見出しフォントサイズを本文と揃える(#152)」）の`` `style.css` は **+49行**ですが、その内訳は次のとおりです。

| 範囲 | 内容 | 本来の帰属 |
|---|---|---|
| 6行 | `.mj-page-heading` | **#152**（このissue） |
| 約43行 | `.mj-league-chart-desktop` / `.mj-league-chart-mobile` + `@media (max-width: 480px)` の切替、`.mj-chart-legend` / `-item` / `-swatch` | **#127**（型C） |

#127 に取り組んだセッションの作業が、このissueのコミットに紛れ込んだものです。

### なぜ消せないか

#127 の実装コミット [`03cb23b`](https://github.com/retroeater/mj/commit/03cb23b0224db3ad87e2b47960704851fd097f8b) は **`style.css` を1行も変更していません**。5クラスすべてが実際に使われており（`houou_leagues.html` / `ouka_leagues.html` / `scripts/generate_houou_leagues.py` / `scripts/generate_ouka_leagues.py` / `scripts/lib/chart.py`）、型Cの2ページはこのコミットのCSSに依存して動いています。

つまり **#152 のコミットが #127 の前提になっている**という、履歴上は逆立ちした依存関係になっています。

### 調査の範囲

`4738d8d` の他4ファイルは混入なしを確認済みです。

- `resource_efficiency.html` / `scripts/generate_resource_efficiency.py` … `.mj-page-heading` の付与のみ（純粋に #152）
- `docs/issues-open.md` / `docs/issues-snapshot.md` … フックによる自動再生成。増分は #153 と #152 の本文のみで、`127` / `leagues` / `型C` の文字列は差分に1件もなし

`git log --all -S` で `mj-league-chart` / `mj-chart-legend` を追跡した結果、`style.css` へこれらを持ち込んだコミットは `4738d8d` だけで、他コミットへの飛び火はありません。

### 対応方針

すでに両方 push 済みのため、CSSを #127 側へ付け替えるには履歴の書き換えが必要で、労力に見合いません。**このコメントを残すことで対応済み**とし、`style.css` はそのままにします。

---
_Generated by [Claude Code](https://claude.ai/code)_

---

## #143 issues-snapshot.md にopenのみの要約版を追加する（提案）

- 作成: 2026-09-11
- ラベル: 状況: 保留, 分野: 整理・保守

### 本文

### 状況

現在222KB・131件を毎回全量読む運用で、会話コストが大きい。

### 案

`build_issues_snapshot.py`に`--open-only`を足して
`docs/issues-open.md`を併せて出力し、handover「0. 新しい会話の
始め方」の案内を「まずopen版、必要なら全量」に変える。

採否は平野さんの判断。

起票のみ。

2026-09-11のレビューで判明。

---

## #142 title整備（#5）の効果をSearch Consoleで測る

- 作成: 2026-09-11
- ラベル: 状況: 待ち, 分野: SEO/AIO

### 本文

### 状況

#5で26ページの`<title>`を整備したが、効果測定は「これから」のまま
（handover SEO節: 表示48回・クリック2回・CTR約4%）。

### 対応

変更前後で同じ期間長（例: 28日）の表示回数/クリック数/CTR/平均掲載
順位を比較し、結果をhandoverのSEO節に追記する。GSCの計測期間が
短いので、結論を急がず「初回計測」として記録する。

**平野さんが実施**（Search Consoleの操作）。

2026-09-11のレビューで判明。

### コメント (2件)

**retroeater** (2026-09-11):

### 初回計測（2026-09-12）

#### 前提の訂正: 28日比較は成立しない

- Search Console のデータ開始日は **2026-09-06**（#41の登録は9/7だが1日分遡っている）
- title 整備（#5）の適用は **2026-09-09**

変更前として使える期間が3日しかなく、28日 vs 28日の比較は永久に成立しない。
本issueは「前後比較」ではなく「時系列の推移を追う」ものとして扱い直す。

#### 初回計測値

| 期間 | 表示回数 | クリック数 | CTR | 平均掲載順位 |
| --- | --- | --- | --- | --- |
| 09-06〜09-08（確定） | 128 | 3 | 2.3% | 9.1 |
| 09-09〜09-11（**未確定**） | 71 | 4 | 5.6% | 11.4 |

日別表示回数: 48 / 41 / 39 / 36 / 26 / 9

#### この数字から結論は出せない

1. **変更後の3日間は未確定。** GSCのグラフが点線表示で、特に9/11の9回は
   埋まりきっていない。128→71 の減少の大部分はこれが原因
2. handover の「表示48回・クリック2回」（9/9記録）に対し、現在は9/6の
   1日だけで48表示。GSCのデータが後から埋まることは実証済み
3. 母数が極小。クリック数は3件と4件で、CTRの2.3%→5.6%は
   1クリックの差でしかない
4. 9/9 には #89 の404が371件発生しており、同時期の他要因と分離できない

#### 観測メモ

- `houou_ranking.html?sheet=鳳凰` が唯一クリックを獲得しているページ。
  2クリック/26表示/順位8.08 → 4クリック/20表示/順位7.4 と改善。
  ただし差は2クリック
- 平均掲載順位の悪化（9.1→11.4）は見かけ上のもの。`houou_leagues.html`
  が 13.08→20.5 に落ちた影響で、主力ページは改善している。
  平均順位は表示URLの構成に左右されるため、単独では指標にならない
- クエリ構成の変化: 変更前にあったブランド系（`ryoei`, `ryoei hirano`,
  `ryoei mikage`）が消え、`麻雀 鳳凰位 歴代` が出現。titleへの
  「日本プロ麻雀連盟」展開と符合するが、各1〜7表示のため偶然の範囲
- `ちりめん亭 蒲田東店`（順位42）で `tanilog.html` が表示されている。
  リダイレクト済みページが検索結果に残っている件は別途確認が必要

#### 今後の扱い

- 次回計測日: **2026-10-07**（title適用から28日）。09-09〜10-06 の28日を
  取得し、本コメントの初回計測値と並べる
- 母数が3桁に届くまでは、数値の上下に意味づけをしない

#### エクスポート

→ 保存済み。保存先と命名ルールは後続のコメント（2026-09-12 追記）を参照。

**retroeater** (2026-09-11):

### 追記（2026-09-12）

エクスポートを保存した。

- `docs/gsc/2026-09-12/20260906-20260908/`（#5 適用前、確定）
- `docs/gsc/2026-09-12/20260909-20260911/`（#5 適用後、**未確定**）

#### 命名ルール

`docs/gsc/<取得日>/<開始日><終了日>/` の2階層とした。詳細は
`docs/gsc/README.md`。

取得日を階層に持つのは、GSCのデータが後から埋まるため。同じ期間でも
取得日が違えば数値が変わり、期間だけをキーにすると同一期間の再取得を
残せない。10-07 の再計測では `docs/gsc/2026-10-07/20260909-20261006/`
に置く。

期間はGSCの期間指定ではなく実データの範囲を書く。`20260906-20260908` は
エクスポート時の指定が `2026/09/01-2026/09/08` だが、データ開始日が
2026-09-06 のため実データ範囲に合わせている。

#### 保存したファイルについて

GSCのエクスポートを無加工で置いている（UTF-8 / LF / BOMなし、末尾改行のみ補完）。
ファイル名もGSCの出力のままで、再エクスポート分をそのまま置いて差分が
取れるようにしている。

`平均読み込み時間のチャート.csv` は名称と実態が合っておらず、中身は
日別のクリック数/表示回数/CTR/掲載順位。GSCの日本語UIの出力名のため
変更していない。

`ページ.csv` のURLはパーセントエンコードのまま。デコード版が必要に
なったら原本との差分が取れるよう別ファイルにする。

---

## #141 ランキング3ページ（houou_ranking / ouka_ranking / wrc_ranking）の移行方針を決める（#7 から分割）

- 作成: 2026-09-11
- ラベル: 分野: SEO/AIO, 分野: パフォーマンス, 対象: 全ページ

### 本文

### 状況

型B/C/Dは#111/#127/#128に分割済みだが、型Aの残り3ページ（ランキング系）
だけ#7のコメント内にしか進め方がない。

### ランキング系3ページの性質（handoverより転記）

`league_ranking.js`（772行）は集計エンジンで、9部門・部門ごとの
クエリ・リーグごとの閾値をブラウザで計算している。

- 共用している`league_ranking.js`は表示ロジックではなく**集計エンジン**。
  スプレッドシートから生データを取り、「通算得点」「期最高得点」
  「期連続浮き回数」「節単位浮き率」など9部門の指標をブラウザ側で
  計算している
- 部門ごとにクエリが異なり、リーグごとに閾値も違う（期連続浮きの
  最小回数は鳳凰6、桜花・JWRC・特昇3 など）
- そのため移行は「行をHTMLにする」作業ではなく、**集計ロジックを
  Pythonへ移植する**作業になる。他の型Aとは性質が違い、分量も大きい
- 上位100件に絞る`DEFAULT_RANK_LIMIT`があるため、出力自体は小さい

### 進め方の案（handoverより）

- **進め方**: 8部門すべてを1つのHTMLに焼き込み、`?division=`を
  ページ内の表示切替パラメータとして扱えば、現在のURL形式を維持できる
- **検証の進め方**: 集計ロジックだけ先にPythonへ移植して結果を書き出し、
  現行ページの表示と突合して一致を確認してから、HTML生成とページ側の
  JSを作る。ロジックの誤りとマークアップの誤りを同時にデバッグしない
  ため

新サイトのレーダーチャート（docs/new-site-design.md §4）が同じ集計を
使うため、Python移植は新サイトでも再利用できる。**現行サイト用に
移植するか、新サイトまで据え置くか**が判断点。

起票のみ。#7に本issueへのリンクをコメントする。

2026-09-11のレビューで判明。

### コメント (2件)

**retroeater** (2026-09-11):

## 集計場所の選択肢（2026-09-12 の検討）

「Pythonへ移植する」以外に、**スプレッドシート側で集計してしまう案**が
出たので、`league_ranking.js` の中身を読んだうえで比較した。

### 9部門の難易度

| 部門 | シート側集計の難易度 |
|---|---|
| 通算得点 | 易（すでに `SUM(H) GROUP BY A`） |
| 通算得点/期 | 易 |
| 期最高得点 | 易 |
| 期単位浮き率 | 易（COUNTIFS） |
| 節最高得点 | 中（13節分がI〜U列に横持ち。縦に開く処理が要る） |
| 節単位浮き率 | 中（同上） |
| **期連続浮き回数** | **難** |
| **節連続浮き回数** | **難** |
| **連続昇級回数** | **難** |

難の3部門は「連続」の判定で、名前・期・節の順に並べた行を上から舐めて
カウンタを持ち越す逐次処理。リーグごとの閾値も違う（鳳凰6、桜花・
JWRC・特昇3）。数式でやるなら生データに補助列を足して1行ずつ前行を
参照する形になり、15,416行×3部門で再計算が重く、行の挿入や並べ替えで
壊れる。**平野さんが手で編集するシートに計算列が混ざる**運用面の難もある。

### 4つの選択肢

- **(a) Python へ移植** — 移植コストは最大だが、リポジトリ内で完結し
  テストしやすい
- **(b) シート数式で集計** — 連続系3部門が苦しい。シートが重くなる
- **(c) Apps Script で集計して別シートに書き出す** — 手続き型なので
  `league_ranking.js` のループをほぼそのまま移植できる（同じJavaScript）。
  DataTable API の呼び出しを配列操作に置き換えるだけで済み、元データの
  シートも汚れない。ただし GitHub Actions とは別系統の自動化が1つ増える
- **(d) 据え置き** — #7 の対象から外す

### 判断材料になる指摘

**「どうせDB移行時に計算式を作るのだから、いま作るのは二重投資」という
読みは、(a) には当てはまらない。** 集計ロジックをPythonで持っておけば、
DB移行時に差し替えるのはデータの取得口だけで、計算そのものは持っていける。
新サイトのレーダーチャート（`docs/new-site-design.md` §4）も同じ集計を
使うため、再利用先は2つある。

一方 (b) と (c) は、DB移行時に確実に捨てることになる。「捨てる前提で
安く済ませる」なら (c) が最安。

### 判断の順序

**#111（型B）と本issueの両方で Charts を使わないと決めない限り、
`gstatic.com` は消えず #9 のCSPは変わらない。** 片方だけ移行しても
CSPへの効果はゼロ。したがって #111 の結論が出てから本issueを判断すると
無駄がない。

**retroeater** (2026-09-12):

### SEO/AIO観点の追加（2026-09-12、Claudeとの検討）

このissueはパフォーマンス案件として立てたが、SEO/AIO施策10件の中では**2番目**に重要。

理由: Google Charts依存ページはクローラーから見て本文が空。#142の初回計測で唯一クリックを獲得しているのが `houou_ranking.html?sheet=鳳凰`（4クリック/20表示/順位7.4）で、このランキング3ページに含まれる。検索流入の実績があるページの中身が検索エンジン・AIに読めない状態のため、#111（型B）より先に、SEO観点を加えて判断する。

---

## #139 check_image_links.py の対象を jpml_pros.html 以外の生成済みページへ広げるか決める

- 作成: 2026-09-11
- ラベル: 分野: 自動化

### 本文

### 状況

`check_image_links.py`は`TARGET_HTML = jpml_pros.html`のみを対象にして
いる。焼き込み済みの他ページは監視外:

- `saikyo_results.html`（kinmaweb.jp 1,324 ＋ pbs.twimg.com 705）
- `resource_logs.html`（pbs.twimg.com 2,630）
- `video_live.html`（img.youtube.com 2,332）
- `jpml_titles` / `saikyo_mens` / `video_*` / `rh_paifu` など

旧Google Charts方式では実行時取得だったので同条件だったが、焼き込みで
古いURLが固定化されるため、リンク切れが放置されやすくなった。

### 論点（判断待ち）

- 対象を全生成ページに広げるか（HEADリクエスト数が約1万に増える）
- jpml_prosだけでよいと判断するか
- ページごとに頻度を変えるか

#103（定期再生成）と併せて設計する。

2026-09-11のレビューで判明。

---

## #135 abs.twimg.com の既定アイコンURL（13件）を img/avatar.svg に正規化する

- 作成: 2026-09-11
- ラベル: 分野: 整理・保守, 対象: jpml_pros

### 本文

### 状況

handoverは「saikyo_mensの移行でabs.twimg.comへの依存は解消済み」と
しているが、それはフォールバックの話。スプレッドシート側の画像URLと
して `https://abs.twimg.com/sticky/default_profile_images/default_profile_200x200.png`
が焼き込み済みHTMLに残っている。

```
grep -c "abs.twimg.com/sticky/default_profile_images" jpml_pros.html saikyo_results.html
jpml_pros.html:11
saikyo_results.html:2
```

計13件。

### 対応案（判断待ち）

- (a) スプレッドシート側で該当セルを空にする（生成時にフォールバックへ落ちる）
- (b) 生成スクリプト側で `abs.twimg.com/sticky/default_profile_images/` を
  `img/avatar.svg` に置換する。(b)ならデータを直さなくても再発しない

**目的は #9 の `img-src` からこのドメインを外せるようにすること。**

どちらにするかは平野さんの判断。本issueはまず起票のみ。

2026-09-11のレビューで判明。

---

## #132 regenerate-page.yml で workflow_dispatch の入力を run: に直接展開している

- 作成: 2026-09-11
- ラベル: 分野: 自動化, 分野: セキュリティ

### 本文

### 状況

`.github/workflows/regenerate-page.yml` の「対象ページを再生成」ステップで、
`workflow_dispatch` の入力を `run:` ブロックへ直接展開している。

```yaml
python3 scripts/regenerate.py ${{ github.event.inputs.target_page }} \
  | tee /tmp/targets.txt
```

GitHub Actions の script injection の典型パターン。`${{ }}` はシェルが起動する前に
テキストとして置換されるため、入力に `;` や `$( )` を含めると任意のコマンドが走る。

同ファイルの「変更をコミット・push」ステップにある
`git add ${{ steps.regen.outputs.files }}` も同じ形。こちらの値は
`scripts/regenerate.py` の出力（リポジトリ内のコードが決める）なので、外部入力ではない。

### 深刻度は低い

`workflow_dispatch` の実行にはリポジトリへの write 権限が必要で、
**外部から到達できる経路ではない。** すでに push できる人だけが悪用できるため、
実質的な権限昇格にならない。

ただし修正が数行で済むこと、このワークフローは `cloudflare` ブランチへ push する
権限で動いており成功すれば本番に反映されることから、直しておく。

### 対応

入力を `env:` 経由に移し、シェル側で変数として参照する。

```yaml
      - name: 対象ページを再生成
        id: regen
        env:
          TARGET_PAGE: ${{ github.event.inputs.target_page }}
        run: |
          set -o pipefail
          if [ "${{ github.event_name }}" = "workflow_dispatch" ]; then
            python3 scripts/regenerate.py $TARGET_PAGE | tee /tmp/targets.txt
          else
            ...
```

`$TARGET_PAGE` をクォートしないのは、`target_page` が
「スペース区切りで複数ページ」を受ける仕様（`scripts/regenerate.py` の
`pages` 引数が `nargs="*"`）で、単語分割を意図的に使っているため。
クォートすると `all` 以外の複数指定が1つの引数として渡り壊れる。
**クォートなしでも `env:` 経由であれば `; rm -rf` のような注入は起きない**
（シェルは展開後の値を再解釈しないため）。ワイルドカードだけは展開されうるので、
気になる場合は `set -f` を併用する。

`git add` 側も同様に `env:` へ移すと揃う。

### 背景

Mantis（Google の AI セキュリティレビュー用ハーネス）の採用検討中に、
リポジトリを読んでいて見つかったもの。Mantis 自体は不採用
（`docs/handover.md` の「検討して見送った技術」参照）。

---

## #130 Block AI botsトグル廃止に伴い、挙動ベースのAIボット制御に移行する

- 作成: 2026-09-11
- ラベル: 状況: 待ち, 分野: SEO/AIO, 分野: セキュリティ

### 本文

### 背景

Cloudflare の「Block AI bots」一括トグルは 2026-09-15 に廃止され、
挙動ベースの制御（Search / Agent / Training の3分類）へ移行する。

9月15日以降、複数の目的を持つクローラーは宣言されたすべての挙動で評価され、
**最も厳しいルールが適用される**。Googlebot / Applebot / Bingbot はいずれも
検索インデックスとAI機能を単一のユーザーエージェントでクロールするため、
「AI学習をブロック」という設定に巻き込まれる。

### 緊急対応（2026-09-11 実施済み）

Security → Settings → Bot traffic → 「Block AI bots」で
`Mixed purpose crawlers will continue to be allowed.` を選択した。

docs/handover.md の方針「検索エンジンとAIの検索・回答は許可」に合わせるため。

**学習用クローラーをブロックしてもAI検索・回答での露出は減らない**
（学習クロールは引用も参照トラフィックも生まないため）。
したがって混在クローラーを許可しても、学習利用を拒否するという
当初の目的は損なわれない。

逆に混在クローラーをブロックしたままだと、検索流入そのものを失うリスクを負う。
#5（titleの整備）や #122（`?name=` の内訳確認）など SEO の作業を
積み上げている最中に取るリスクではない。

### 本対応（このissue）

旧トグル廃止後、挙動ベースの制御で設定を組み直す。

| 分類 | 方針 |
|---|---|
| Search | 許可 |
| Agent（AIの検索・回答） | 許可 |
| Training（学習） | ブロック |

### 確認事項

- 混在クローラー（Googlebot / Applebot / Bingbot）が Search として扱われ、
  ブロックされないこと
- AI Crawl Control の管理 robots.txt の内容が方針と一致しているか
  （robots.txt は Cloudflare が自作分の前に前置している）
- 設定後、Search Console でクロールエラーが増えていないこと

### 期限

2026-09-15 に旧トグルが廃止される。その後すみやかに着手する。

### コメント (2件)

**retroeater** (2026-09-11):

### 追記（2026-09-12、レビュー反映）

期限2026-09-15。旧トグル廃止後の設定変更は平野さんがダッシュボードで
実施する。結果を以下の観点でここに記録すること。

- Search / Agent の許可設定
- Training のブロック設定
- 検索とAI学習の両方を行う混在クローラーの扱い
- robots.txtの配信内容（AI Crawl Controlの管理robots.txtとの整合）

**retroeater** (2026-09-12):

### SEO/AIO施策としての位置づけ（2026-09-12、Claudeとの検討）

SEO/AIO施策10件の中で**最優先**（期限付き）。
- Search / Agent 許可・Training ブロックで組み直し、Googlebot / Bingbot / Applebot の混在クローラーが弾かれないことを確認する
- 配信される robots.txt の `Content-Signal` が方針と一致しているか同時に確認する
- ここを誤ると他のSEO/AIO施策がすべて無効になるため、9/15以降すみやかに実施

---

## #129 Early Hints用のLinkヘッダを_headersに設計する

- 作成: 2026-09-11
- ラベル: 分野: パフォーマンス, 対象: 全ページ

### 本文

### 背景

2026-09-11 に Cloudflare の Early Hints を有効化した。ただし
**トグルを入れただけでは何も起きない。**

Cloudflare の Early Hints は、レスポンスに含まれる
`Link: ...; rel=preload` / `rel=preconnect` ヘッダをキャッシュし、
次回以降のリクエストに対して 103 で先出しする仕組み。HTML 内の
`<link>` タグは読まない。

（Cloudflare Pages には `<link>` 要素から `Link:` ヘッダを自動生成する機能があるが、
Workers 静的アセットで同じ挙動をするかは未確認。まず実測で確かめること。）

参照:
- https://developers.cloudflare.com/cache/advanced-configuration/early-hints/
- https://developers.cloudflare.com/pages/configuration/early-hints/

### まず確認

    curl -sI https://ryoei.pro/jpml_pros.html | grep -i "^link:"

`Link:` が自動で付いているなら設計は不要。付いていなければ `_headers` に書く。

### 設計上の論点

`/*` 一括では書けない。CSSの構成がページによって違う。

| 対象 | CSS |
|---|---|
| 全27ページ共通 | `assets/vendor/bootstrap/css/bootstrap.min.css` |
| `index.html` のみ | `index.css` + `aos.css` + `glightbox.min.css` |
| 他26ページ | `style.css` |

`_headers` のパスパターンで出し分けるか、共通の Bootstrap CSS だけに絞るかを決める。
preload したのに使わないリソースがあるとブラウザのコンソールに警告が出るため、
ページごとに正確に書くこと。

### 期待値は低めに見積もる

Early Hints が稼ぐのは「リクエスト→レスポンス到着までの空き時間」だが、
HTML は `cf-cache-status: HIT` でその空き時間自体が短い。

また、Lighthouse の改善提案1位は Bootstrap CSS の未使用分
（mobile 合計約1,090ms、docs/lighthouse-baseline.md）であり、
これは preload では解決しない。Bootstrap をやめるかどうかは #101（新サイト）の判断。

**効果が測れなければ Early Hints ごと Off に戻してよい。**
「現行サイトに作り込みすぎない」方針に照らして、`_headers` が複雑になる対価に
見合うかで判断する。

### 前提

Early Hints は HTTP/2 または HTTP/3 接続でのみ動作する。
どちらも 2026-09-11 に有効化済み。

### コメント (3件)

**retroeater** (2026-09-11):

### 注意（2026-09-11）

Speed Brain が Workers 静的アセットで拒否された件（#119）と同じく、
「設定が有効になっている」ことと「実際に動いている」ことは別。
判定は必ずレスポンスの実測で行うこと。

**retroeater** (2026-09-11):

### Smart Hints（クローズドベータ）が代替になりうる（2026-09-11）

Speed → Content Optimization に **Smart Hints** という項目がある。
クローズドベータで、Sign up ボタンから申し込む形式。

> By using Smart Hints, Cloudflare will automatically select
> Early Hints and Fetch Priority for resources on your website
> to improve the render time in browser

**Cloudflare が自動で Early Hints の対象を選ぶ**ため、
このissueの主題である「`_headers` に `Link:` を手書きする」作業が
不要になる可能性がある。

ページごとに CSS 構成が違う（index.html だけ別系統）という設計上の論点も、
自動選択なら解消する。

### 進め方

着手前に Smart Hints へ申し込む。ベータに通れば手書きは不要になり、
通らなければ当初の設計どおり `_headers` に書く。
登録自体は無料で、通らなくても何も起きない。

### 前提の確認（済）

Early Hints のトグルは Speed → Content Optimization で有効（2026-09-11）。
HTTP/2・HTTP/3 も有効。

**retroeater** (2026-09-11):

### 追記（2026-09-12、レビュー反映）

Smart Hintsへの申込みが済んでいるか不明。申込み済みなら日付を、未なら
申込み後に日付をここに記録すること（平野さん）。

---

## #126 Bing Webmaster Toolsに登録しIndexNowを検討する

- 作成: 2026-09-11
- ラベル: 状況: 待ち, 分野: SEO/AIO

### 本文

Search Console からインポートできるので登録は数分。麻雀という領域で Bing の
比率は低いと思われるが、コストがほぼゼロで、GSC と独立した検証材料になる。

### IndexNow

Cloudflare の Crawler Hints を On にすると IndexNow に自動通知が飛ぶ。
ただしキャッシュ連動のため、Cache Rules の判断（別issue）の後に効果を確認する。

### 完了条件

登録後、Bing 側のインデックス数と GSC の22URLを突き合わせる。

### コメント (2件)

**retroeater** (2026-09-12):

### 優先度と理由（2026-09-12、Claudeとの検討）

SEO/AIO施策10件の中で**7番目**。Bingのインデックスは Copilot や ChatGPT検索の参照元になるため、AIO観点では検索シェア以上の意味がある。GSCからのインポートで数分。

**retroeater** (2026-09-12):

### 登録完了（2026-09-12、平野さんが実施）

Google Search Console からのインポートで Bing Webmaster Tools に登録した。
所有権は自動で引き継がれ、手動の確認は不要だった。

#### サイトマップ

| 項目 | 値 |
|---|---|
| Sitemap URL | https://ryoei.pro/sitemap.xml |
| Last submit / Last crawl | 2026-09-12 |
| Status | Success |
| URLs discovered | 25 |
| エラー / 警告 | 0 / 0 |

25件はリポジトリの sitemap.xml の `<loc>` 件数と一致。意図的に除外して
いる5ページ（404.html / saikyo_mens.html / _redirects 転送の3件）も
含まれていない。

### IndexNow（Crawler Hints）は保留

issue本文にある Cloudflare の Crawler Hints は、今回は **On にしない**。

Crawler Hints はエッジキャッシュ上のコンテンツ変化を検知して IndexNow へ
通知する仕組みだが、「デプロイがエッジキャッシュのエントリを実際に
置き換えるか」は #156 で検証待ちの状態にある。置き換わりが未確認の段階で
有効にすると、通知が飛んでいるかどうかを判定できない。

→ **#156 の結果が出てから判断する。**

なお issue本文の「Cache Rules の判断の後に効果を確認する」という前提は、
#123（Cache Rules による HTML のエッジキャッシュ）が却下クローズされた
ため既に解消している。現在の依存先は #156。

### 残作業（完了条件）

Bing 側のインデックス数と GSC の22URLを突き合わせる。クロール開始直後の
ため 2026-09-15〜16 頃に確認する（平野さんが実施）。

あわせて `?name=` 付きURLが Bing でも個別にインデックスされるかを見る。
Google はパラメータ付き14件を検索結果に出している（handover SEO節）が、
Bing が同様に扱うかは未知。扱いが違えば #113（canonicalなし）の判断が
検索エンジンごとに別の結果を生むことになり、#159（?name= からの301設計）
の前提に関わる。

---

## #125 Cloudflare ObservatoryでLighthouseを定期実行する

- 作成: 2026-09-11
- ラベル: 分野: パフォーマンス

### 本文

現在 docs/lighthouse-baseline.md を手作業で作っている。Speed → Observatory で
指定ページの Lighthouse を定期実行し、回帰を通知させられる。

#7 で残り12ページを移行していく最中なので、悪化の検知手段があると安心。

### 決めること

対象ページの選定（全27ページは不要）。候補:

- index（唯一の別系統・ライブラリ232KB）
- jpml_pros（最重量。mobile perf 37）
- saikyo_results（未移行の最大懸念。2,560行）
- jpml_titles（型Aの代表）

### コメント (1件)

**retroeater** (2026-09-11):

### 追記（2026-09-12、レビュー反映）

候補の saikyo_results は移行済み（mobile perfはdocs/lighthouse-baseline.md
の移行結果を参照）。未移行の最大規模はhouou_results（15,416行、#111）に
変わった。候補をindex / jpml_pros / houou_results / jpml_titlesに見直す。

---

## #124 Rate Limiting rulesを設定する

- 作成: 2026-09-11
- ラベル: 分野: セキュリティ

### 本文

#91 で Super Bot Fight Mode は「Pro では Definitely automated しか遮断できず、
実測で最大の塊である Likely automated 41% に手が出ない」として却下した。
Rate Limiting rules は bot score を使わないため、同じ層に効かせられる。

Pro は rate limiting rules を数本・IP単位・1分窓で使える
（正確な本数はダッシュボードで確認）。

### 当サイトは閾値を低くしやすい

table.js はページ内で絞り込みを完結させるため、実ユーザーのHTMLリクエスト数が
非常に少ない。一方、選手1,100名のデータベースはスクレイピング対象になりやすい。

### 案

同一IPが1分に N 回以上 `.html` を要求したら Managed Challenge。
まず Log モードで運用して閾値を決める（#76 と同じ進め方）。

### 除外

`/cdn-cgi/` は Web Analytics のビーコン送信先なので必ず除外する（#110 と同じ注意点）。

### あわせて検討

`cf.client.bot`（Verified Bot 判定）を使ったカスタムルール。Pro でも利用できる。
検索エンジンを素通しし、それ以外の非ブラウザ的アクセスに Managed Challenge を出す分岐。

---

## #122 Search Consoleで「?name=」付きURLの内訳をエクスポートする

- 作成: 2026-09-11
- ラベル: 分野: SEO/AIO

### 本文

docs/handover.md に「検索結果に出た22URLのうち14件が `?name=` 付きだったが、
どのページのものかは未確認」とある。この内訳は次の2つの判断の前提になっている。

- #7 のURLパラメータ削除判断（ページを移行するたびに発生する）
- canonical の方針判断（別issue）

### 手順

検索結果のパフォーマンス → ページ →「URLを含む: ?name=」でフィルタ → エクスポート。

結果は docs に表として残す。ページを移行するたびに毎回悩まずに済むよう、
先に1回取っておく。

### コメント (1件)

**retroeater** (2026-09-11):

### 目的の変更（2026-09-11）

#113 が (c) 現状維持に決まり、#7 のURLパラメータは一律そのまま引き継ぐ
方針になったため、本issueの「削除判断の前提」という役割はなくなった。

また GSC の計測開始が最近のため、取得できる期間が短い。母数が小さい状態では
「出てこなかった＝不要」とは言えず、削除判断の材料には元々向かない。

新しい目的: 新サイト（#101）で選手個別ページを設計するときの基礎データとして、
現時点のスナップショットを取っておく。どの選手名に検索需要があるかの初期値。
handover の SEO 節にある「上位が突出せず裾野が広い」分布の裏付けになる。

取得後 docs に表として残し、クローズする。優先度は下げてよい。

---
_Generated by [Claude Code](https://claude.ai/code)_

---

## #111 #7の型B 3ページ（Dashboard＋ローソク足）の移行方針を決める

- 作成: 2026-09-11
- ラベル: 分野: SEO/AIO, 分野: パフォーマンス, 対象: 全ページ

### 本文

### 対象

`houou_results` / `ouka_results` / `wrc_results`

### 構造（2026-09-11 のコード調査＋実機確認で判明）

1ファイル内で `google.charts.load` を2回呼んでいる。

- `packages:['table','controls']` … `Dashboard` に `ControlWrapper` をバインドし、
  `Table`(`page:'enable'`) に接続する。**常時表示**（`?name`の有無に関わらず描画される）
- `packages:['corechart']` … `if(search_name)` の内側。**`?name` があるときだけ**
  別クエリでローソク足を描く。中身は選手個人の期別成績推移

つまりこのページは「表＋グラフ」ではなく、常時表示のダッシュボードに、
選手指定時だけグラフが足される構造になっている。

**3ページとも同一構造ではない。** 実機確認で以下の差分が判明した。

| ページ | コントロール | リーグ欄の型 | pageSize | 実描画行数(`?name`なし) |
| --- | --- | --- | --- | --- |
| `houou_results` | 名前・期・リーグ(3つ) | **CategoryFilter(ドロップダウン)** | 500 | 500(31ページ) |
| `ouka_results` | 名前・期・リーグ(3つ) | StringFilter(テキスト入力) | 100 | 100(16ページ) |
| `wrc_results` | **名前のみ(1つ)** | (欄自体が存在しない) | 100 | 100(16ページ) |

### 論点1: グラフ本体

**静的SVG化（旧選択肢c）は成立しない。** グラフが選手依存のため、
選手ごとに1枚ずつ事前生成することになり現実的でない。

残る選択肢は:
- (a) Google Charts 据え置き。`www.gstatic.com` は残り、#9 のCSPは
  `script-src` に gstatic を許可したまま確定できる。作業量は最小
- (b) Apache ECharts に載せ替え。セルフホスト可能で外部依存は増えないが、
  新サイトで作り直す予定のページに新しいライブラリを入れることになる

### 論点2: `?name` なしの既定表示が全件になる

| ページ | パラメータなしの行数(元データ) | 現在のDOM行数(Charts側のページング) |
| --- | --- | --- |
| `houou_results` | 15,416 | 500 |
| `ouka_results` | 1,580 | 100 |
| `wrc_results` | 1,507 | 100 |

現在DOM行数が小さく収まっているのは Google Charts の `page:'enable'` が
実際にDOMを分割しているため。**自前の `row.hidden` 方式（`.mj-pager`）に
置き換えると `houou_results` は15,416行がDOMに乗り、`saikyo_results`
(2,560行)を超えて #7 最大のDOM規模ページになる。**

対応案:
- `?name=` を必須にして、未指定時は表を出さない（挙動が変わる）
- ページ送りをDOMから行を出し入れする方式に作り直す（#24と同根の作業）
- 型Bだけ据え置く

### 論点3: ControlWrapper の置き換え

`table.js` には CategoryFilter（値をデータから自動生成するドロップダウン。
`houou_results`のリーグ欄のみが該当）に相当する部品がない。表を静的化
するなら新規に作る必要がある。`ouka_results`のリーグ欄はStringFilter
なので既存のtable.jsの絞り込みで代替できるが、`wrc_results`には
期・リーグの欄自体がなく、3ページを同じ設定で一括処理できない。

### 判断材料

- **カスタムツールチップも `addListener` も6ページとも存在しない。**
  使われているのは Google Charts 既定のホバーツールチップのみ
  （静的化で失われるインタラクションの実態はこれだけ。実機確認済み）
- アクセス実態は Cloudflare Pro の HTTP Traffic 分析でパス別に確認できる
- 型C（#127）・型D（#128）は本issueとは別に判断する

### コメント (4件)

**retroeater** (2026-09-11):

## 訂正: 静的SVGでもツールチップは失われない

本issueの本文で「ツールチップとホバー時の値表示は失われる」を静的化のデメリットとして挙げていたが、これは誤り。

各棒(または該当要素)を`<g>`で包み、内側に`<title>`要素を置くと、ブラウザが標準のホバーツールチップを表示する。JSもCSSも不要。

#128(型D、resource_efficiency)の実装でこの方式を使い、動作を確認済み。

**retroeater** (2026-09-11):

### 追記（2026-09-12、レビュー反映）

据え置き（a）を早期に確定させる案: houou_resultsの15,416行は自前ページ
送りでは解けず、EChartsは新サイトで採用予定（docs/new-site-design.md
§5）。据え置きなら#9はscript-srcにwww.gstatic.com、connect-srcに
docs.google.comを含めて書け、#7のスコープが収束する。#127も同じ判断に
従う。採否は平野さんの判断。

**retroeater** (2026-09-11):

## 型C(#127)の完了を受けた選択肢の追加（2026-09-12）

本issueの本文では「ローソク足は `?name=` 依存のため、選手ごとに1枚ずつ
事前生成することになり静的SVG化は不成立」としているが、**#127 で
別の解き方が実証された。**

型Cでは、選手依存のデータ（折れ線）を**全選手分まとめてJSONに焼き込み、
`?name=` に応じてクライアント側で1本だけ描く**方式を採用した。
グラフの土台は静的SVG、外部ライブラリはゼロ。

- `houou_leagues_data.json` は 104KB（gzip 36KB）
- `?name=` 未指定時は fetch されない（既定選手の折れ線は静的SVGに焼き込み済み）
- 実測で mobile performance 98 / TBT 0ms

**ローソク足にも同じ方式が使える可能性がある。** 選手ごとのOHLCデータを
JSONにして、クライアントで1本だけ描く。Charts も ECharts も不要。

### ただし型Bには別の壁がある

型Cと違い、型Bには**表**がある。こちらは未解決のまま。

- `Dashboard` + `ControlWrapper` 3種（StringFilter×2 + CategoryFilter）。
  `table.js` に CategoryFilter 相当の部品がない
- `?name=` 未指定時の `houou_results` は15,416行。Google Charts の
  `page:'enable'` + `pageSize:500` が実際にDOMを分割しているため現状は
  成立しているが、自前の `row.hidden` 方式では #7 最大のDOM規模になる

**つまり本issueの論点は「グラフをどうするか」から「表をどうするか」へ
移った。** グラフ側は型Cの方式で解ける見込みが立っている。

### 検討すべきこと

- houou / ouka / wrc それぞれで、全選手分のOHLCデータをJSONにしたときの
  サイズ（型Cと同じく gzip後50KBを目安にする）
- 表の15,416行をどう扱うか。`?name=` 必須にする／ページ送りを
  DOM出し入れ方式に作り直す（#24と同根）／型Bだけ据え置く、の3択

**retroeater** (2026-09-12):

### SEO/AIO観点の追加（2026-09-12、Claudeとの検討）

#141と同じ理由で、Google Charts依存はクローラーに本文が届かない問題でもある。`houou_results.html?name=` は検索結果に出た `?name=` 付きURLの一例でもあり（handover SEO節）、静的化はSEO/AIO施策としても意味がある。優先順位は#141の後。

---

## #107 新サイトのUI方針を決める（カードUI・段階的開示・ダークモード）

- 作成: 2026-09-11
- ラベル: 状況: 保留, 分野: UI/UX, 対象: index

### 本文

- #101（新サイトの第一弾＝トップページ）の設計時に決める項目
- カードUIパターン: 現行の本質は表形式だが、選手個別ページの構想とは相性がよい
- モバイルファースト設計: 上記の実測結果を見てから決める
- 段階的開示: #24（五十音タブ）がまさにこれ。INP 458ms の根本解決策として既に方針決定済み。新サイトで実装する
- ダークモード: 現行CSSは色がベタ書きのため変数化から必要。新サイトで最初から入れるほうが安い
- CSS text-box（text-box-trim）: タイポグラフィの余白調整。デザインを詰める段階で検討する
- @starting-style / transition-behavior: allow-discrete / linear() / Web Animations API: アニメーションを入れるなら、その時点で併せて検討する

---

## #106 訪問者のデバイス比率を実測する

- 作成: 2026-09-11
- ラベル: 分野: UI/UX, 対象: 全ページ

### 本文

- モバイルファースト設計を採るかどうかの判断材料。現在は推測で話している
- Cloudflare の HTTP Traffic 分析（Analytics → Traffic）で Source device type の内訳が見られる（Pro機能）。Freeでは出ない
- あわせて Search Console 側のデバイス別データも確認する
- 結果は #101（新サイトのトップページ）の設計方針に反映する

---

## #105 ページの先読み（Speculation Rules API）の要否を判断する

- 作成: 2026-09-11
- ラベル: 状況: 待ち, 分野: パフォーマンス, 対象: 全ページ

### 本文

- <link rel="prefetch"> は、この構成では有害な可能性がある。移行済みページは resource_logs 1.77MB / video_live 1.55MB / jpml_titles 782KB で、押されるとは限らないリンク先を先読みすると転送量だけが膨らむ。実測のページビューは1日114、訪問75（2026年9月9日、約10時間分）
- <link rel="prerender"> はChrome独自かつ非推奨。Speculation Rules API に置き換わっている
- Speculation Rules API は Baseline ではなく、広く使われているブラウザの一部で動かない。CSP を入れる場合は script-src での許可も必要（#9と関連）
- やるなら eagerness を絞り、ホバー時のみ先読みする形になる
- #7 の完了後、ページ構成が固まって Lighthouse の実測が出てから判断する

### コメント (2件)

**retroeater** (2026-09-11):

### Speed Brain では代替できないことが確定した（2026-09-11）

#119 の判定により、Cloudflare の Speed Brain は Workers 静的アセット配信では
prefetch が拒否される（`disabled for worker requests`）ことが分かった。
「Cloudflare の設定だけで済ませる」選択肢は消えた。

### 残る選択肢

(a) 自前で Speculation Rules を HTML に書く
    - 27ページすべての `<head>` に `<script type="speculationrules">` を追加する
      作業になる（生成ページは scripts/lib/page.py 側で一括対応できる）
    - Cloudflare のエッジ prefetch を介さないため、`disabled for worker requests`
      の制約は受けない。ブラウザが直接取りに行く
    - CSP（#9）で `script-src` に inline script の許可が必要になる。
      「インラインハンドラの排除」を進めてきた方針と逆行する

(b) 見送る

### 判断材料

- 平均的な訪問者が何ページ遷移するか。1ページで離脱するなら prefetch の
  出番自体がない。#90（Bot Report）や Web Analytics の指標で確認できる
- #24（五十音タブ）や #101（新サイト）で情報設計が変わる予定があり、
  遷移パターンも変わる可能性がある

### 依存

#9 と併せて判断する。CSP のポリシーが固まる前に inline script を増やさないこと。

**retroeater** (2026-09-11):

### Cloudflare 側の prefetch 手段は完全に潰れた（2026-09-11）

Speed → Content Optimization に **Prefetch URLs** という項目があるが、
**Requires an Enterprise plan** と明記されている。

Speed Brain が Workers 静的アセットで拒否される（#119）ことと合わせて、
Cloudflare の設定だけで prefetch を実現する手段は残っていない。

このissueは「自前で Speculation Rules を HTML に書く」か「見送り」の
二択で確定。判断材料は既存コメントのとおり。

---

## #104 Bootstrap JSの依存を棚卸しし、Popover APIへの置換を検討する

- 作成: 2026-09-11
- ラベル: 状況: 待ち, 分野: パフォーマンス, 対象: 全ページ

### 本文

- ナビのドロップダウンが bootstrap.bundle.min.js に依存している。Popover API（ネイティブ）に置き換えられれば、JSを1本減らせる可能性がある
- 前提として、bootstrap.bundle.min.js が他のどの機能で使われているかの棚卸しが必要。ドロップダウンだけなら外せる
- #9（CSP）とは相乗効果がある（インラインJSと外部JSが減る）
- ただし「現行サイトに作り込みすぎない」方針とは緊張関係にある。#7 が終わってから、投資に見合うかを判断する

---

## #103 生成済みページの定期再生成を検討する

- 作成: 2026-09-10
- ラベル: 状況: 待ち

### 本文

## 背景

#7で生成時焼き込みに移行したページ(jpml_pros / jpml_titles / jpml_test / resource_logs / video_live)は、スプレッドシートの更新が自動では反映されない。`regenerate-page.yml` はスクリプト(`scripts/generate_*.py`)や対応する`.js`の変更をpushで検知する作りで、スプレッドシートの変更そのものは検知しないため。

現在はワークフローを`workflow_dispatch`で手動実行するしかない（`target_page`にページ名、または`all`）。

## 検討事項

- 定期実行の要否と頻度（週次など）
- 対象を`all`にするか、ページごとに個別のスケジュールを持つか
- 差分がないときに無駄なコミットを作らない仕組み（現状の「変更なし」判定で足りるか）
- 更新頻度の実態（どのシートがどれくらいの頻度で変わるか）を踏まえた頻度設計

## 進め方

#7の完了後、生成対象が出そろってから判断するのがよい。

### コメント (2件)

**retroeater** (2026-09-11):

### 追記（2026-09-12、レビュー反映）

移行済みは14ページになった（起票時は5ページ）。14ページ分のデータが
手動実行に依存しており、運用リスクとして最大。#7の完了を待たず、
週次cron（workflow_dispatchと同じallを回し、差分がなければコミットしない
現行の判定をそのまま使う）で先に着手する案を提案する。採否は平野さんの
判断。

Projectsボードでの優先順位変更は平野さんが実施。

**retroeater** (2026-09-11):

### 判断: 採用（2026-09-12）

#7の完了を待たず、週次cronを先行導入した（c73279a）。

- 既定ブランチが`cloudflare`であることを確認済み（scheduleは既定ブランチ上のワークフローファイルのみ対象のため必須の前提）
- `schedule`を追加（毎週日曜20:37 UTC=月曜05:37 JST。毎時00分は実行が集中し遅延しやすいため37分にずらした）
- 実行ロジックの分岐を「pushかどうか」に反転。schedule/workflow_dispatchはどちらも`all`相当（inputsが空なら`all`にフォールバック）で回す
- 差分がなければコミットしない既存の判定（`git diff --cached --quiet`）はそのまま流用。新規実装は不要だった

導入後に確認すること:
- 初回のスケジュール実行がActionsタブで走ること（初回発火まで遅れることがある）
- 差分がない週に「変更なし」で終わり、無駄なコミットが増えないこと
- 14ページ全量の実行時間。長すぎる場合はページごとの分割を再検討する

Projectsボードでの優先順位変更は平野さんが実施。

---

## #101 トップページをテンプレートから脱却して作り直す

- 作成: 2026-09-10
- ラベル: 状況: 保留, 分野: SEO/AIO, 分野: 整理・保守, 対象: index

### 本文

index.html を iPortfolio テンプレートから脱却させる。
診断は #15 を参照。

## 位置づけ: 新サイトの第一弾として実施する

docs/new-site-design.md の新サイト構想において、
最初に着手する対象とする。

理由:
- 他26ページと構造が独立しており（#15）、依存が最も少ない
- 現行スタックで作り込むと新サイトで再度作ることになる
- Astro の試作対象としても適している（#20 参照）

## 情報設計（決定済み）

トップページは**個人の実績を見せる場**である。
選手データベースは平野良栄個人のポートフォリオを構成する
要素の一つという位置づけ。

現行のセクション構成
（hero / about / facts / resume / portfolio）は
情報設計としては妥当。作り直しは中身の質の問題として扱う。

## 同時に解消されること

| 項目 | 内容 |
| --- | --- |
| ライセンス制約 | BootstrapMadeへのリンク義務がなくなる |
| index.css | 12KB・645行の別系統CSSが不要になる |
| index専用ライブラリ | 232KB（#98参照）。演出を作り直す前提 |

## 着手前に決めること

1. 現行の演出のうち何を引き継ぐか
   （タイピング風アニメーション、数字のカウントアップ、
   　スクロールフェードイン、ライトボックス、portfolio絞り込み）
   引き継ぐ場合、Astro でどう実装するか
2. portfolio に何を並べるか
   （選手データベース、note連載、マインドアスリート出演 など）
3. 新サイトのスタックを確定させる（#21）

## 依存

#21（Astroへの移行を検討する）の判断が前提。

### コメント (1件)

**retroeater** (2026-09-12):

### SEO/AIO観点の追加（2026-09-12、Claudeとの検討）

選手個別ページはSEO/AIO施策10件の中で**8番目**だが、新サイト側では最も効果が大きい施策。1,100ページ超の入口ができ、title / description / canonical をページごとに持てる。既存 `?name=` 付きURLからの301設計は別issue（「?name= 付きURLから選手個別ページへの301マッピングを設計する」）で扱う。

---

## #97 書籍ページをAmazon APIで作り変える

- 作成: 2026-09-09
- ラベル: 状況: 保留, 分野: 自動化

### 本文

リソース配下の書籍ページについて、Amazon Product
Advertising API の利用を検討する。

## 前提

現行の27ページに書籍に該当するページは存在しない。
新規に作るか、既存ページの一部を切り出す想定。

## 保留の理由

Amazon PA-API はアソシエイト・プログラムへの参加が前提であり、
一定期間内に売上実績がないとAPIアクセスが停止される。
書籍紹介が主目的で収益化の導線を作らない場合、
運用の前提を満たせない可能性がある。

## 判断に必要なこと

1. アフィリエイトリンクを設置するか
   サイトの位置づけ(麻雀の普及・企業案件の入口)と
   収益化の導線が噛み合うかの判断が要る
2. APIを使わない場合の代替
   書影・書誌情報を手作業で登録する。
   冊数が少なければこちらで十分
3. 掲載する書籍の範囲と冊数

## 次のアクション

上記1〜3を決める。決まるまでは着手しない。

### コメント (1件)

**retroeater** (2026-09-11):

### 追記（2026-09-12、レビュー反映）

「決まるまで着手しない」状態で、決める場が設定されていない。判断する日を決めるか、状況: 保留を付けて新サイト着手時に再検討する扱いにするかを平野さんが決める。

---

## #96 Google Workspace APIでカレンダーの参照・更新を自動化する

- 作成: 2026-09-09
- ラベル: 状況: 保留, 分野: 自動化

### 本文

リソース配下にカレンダー機能を設けることを検討する。

## 前提

現行の27ページにカレンダーに該当するページは存在しない。
新規に作る想定。

## 決めるべきこと

1. 何のカレンダーか
   (対局日程 / 連盟の公式行事 / 自身の予定 など)
2. 誰が見るのか。公開か限定公開か
   限定公開なら #29(認証)に依存する
3. 参照だけか、サイトから更新もするのか
   更新を行う場合は書き込み権限とシークレット管理が必要になる
4. 情報源はどこか
   Googleカレンダー / スプレッドシート / 手入力

## 技術的な論点

- 現在スプレッドシートの取得には gviz エンドポイントを
  使っている(scripts/lib/sheets.py)。これは公式に
  ドキュメント化されていない事実上の内部APIであり、
  Google側の都合で変わる可能性がある。
  Workspace API に寄せるなら、この置き換えも併せて
  検討する価値がある
- 認証はサービスアカウントを使う。
  GitHub Actions のSecretsに鍵を置く運用になる
- 参照のみでよければ、カレンダーの公開URLから
  ICS形式を取得してビルド時に静的化する方法もある。
  APIを使わずに済むため、まずこちらで足りないか確認する

## 次のアクション

上記1〜4を決める。決まるまでは着手しない。

### コメント (1件)

**retroeater** (2026-09-11):

### 追記（2026-09-12、レビュー反映）

「決まるまで着手しない」状態で、決める場が設定されていない。判断する日を決めるか、状況: 保留を付けて新サイト着手時に再検討する扱いにするかを平野さんが決める。

---

## #95 #7のテーブル描画方式を比較検討する

- 作成: 2026-09-09
- ラベル: 状況: 保留, 分野: パフォーマンス

### 本文

#7 で21ページのGoogle Charts依存を解消するにあたり、
テーブルの描画方式を先に決める必要がある。

## 背景

jpml_pros.html は自前実装で描画している。その結果として
以下のissueが派生した。

- #24 五十音タブで表示件数を絞る(1,100人の一覧が重い)
- #83〜#87 INPの測定と改善

21ページを同じ自前方式に移すと、同種の問題を21回抱えることになる。

## 候補

### A. 自前実装(jpml_pros.html と同じ方式)
- 依存が増えない
- #24 のような問題を個別に解き続ける必要がある

### B. AG Grid (Community版・MITライセンス)
- ソート・フィルタ・仮想スクロールを標準で持つ
- #24 が不要になる可能性がある
- 依存が1つ増える

### C. その他の軽量テーブルライブラリ

## 比較の観点

1. バンドルサイズ
   Google Charts を消したいのに、より重い依存を足しては本末転倒。
   現状 gstatic.com/charts/loader.js が何KB相当か測ってから比べる
2. 配信方法
   CDN読み込みだと外部ドメインが増え、#9(CSP)の前提が崩れる。
   セルフホストできるか
3. ライセンス
   AG Grid は Community版がMIT、Enterprise版は有償。
   使いたい機能が Community 版に含まれるか
4. 1,100行を描画したときのINP
   #83 で測定した手法をそのまま使える
5. 21ページの列構成の差異を吸収できるか

## 進め方

jpml_titles.html 1枚で候補AとBを実装して比較する。
#7 の「まず1ページで型を作る」方針と両立する。

## 依存

#7 の着手前に決着させること。

### コメント (1件)

**retroeater** (2026-09-10):

## 位置づけを変更する

本issueは #7 の前提ではなく、**#7 の完了後に新規構築の
文脈で検討する**ものとする。

### 理由

#7 は現行方式（jpml_pros.html と同じ自前実装）で
21ページを揃える。

当初「#24 のような問題を21回抱えることになる」と
懸念したが、#24 が生じたのは jpml_pros.html が1,100行を
扱うためであり、21ページの成績表はより小規模である。
同種の問題が同じ規模で発生するとは限らない。

ライブラリ（AG Grid 等）の選定は、新サイトの
スタック決定（#21）と併せて判断するほうが筋が通る。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01786uUDe5x11WyMc5U1yLdw

---

## #84 GitHub Pagesを無効化する

- 作成: 2026-09-09
- ラベル: 状況: 待ち, 分野: インフラ

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

## #82 SNSシェア・URLコピーボタンを設置する

- 作成: 2026-09-09
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

## #30 メール送信の手段を検討する

- 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: インフラ

### 本文

認証のマジックリンクや選手への通知が必要になった場合。Resendは無料枠が月3000通で扱いやすい。Cloudflare Email Routingは受信専用なので送信には使えない。

---
<sub>移行前のタスク番号: 67</sub>

---

## #29 認証方式を検討する

- 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: インフラ

### 本文

選手1000人にログインしてもらう仕組みは、技術より運用負担(パスワード忘れ・メール変更の問い合わせ)が大きい。固有トークン付きURLを配る方式ならログイン不要で運用負担がほぼゼロ。本格的な認証が必要ならClerk(無料枠1万MAU)かSupabase Auth。

---
<sub>移行前のタスク番号: 66</sub>

---

## #28 Cloudflare D1の採用を検討する

- 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: インフラ

### 本文

SDPデータベース(選手が自分の情報を編集する仕組み)向け。Supabaseは無料枠が1週間で自動停止するため却下した。D1は5GB・1日500万行読み取りが無料で自動停止もない。2026年9月から無料プランは1日の行数上限に達するとエラーを返す。

---
<sub>移行前のタスク番号: 65</sub>

---

## #25 プロフィール画像をR2へ移行する

- 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: インフラ, 対象: jpml_pros

### 本文

1985枚が7つの外部ドメインに依存している。ただしX・noteの画像を自サイトで再配信することは各社の規約上グレーで、著作権も選手個人にある。ron2.jp分(845枚・連盟の資産)だけなら許諾のハードルは低い。将来SDPデータベースで選手自身に画像をアップロードしてもらうのが最も筋が良い。

---
<sub>移行前のタスク番号: 23</sub>

---

## #24 五十音の行タブで絞り込めるようにする

- 作成: 2026-09-07
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

- 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: UI/UX, 対象: jpml_pros

### 本文

検索ボックスが左側180pxしか覆っていないため、右側の帯にデータ行が透けて見える。width:100% と box-sizing:border-box の2行で解決できるが、いったん許容している。

---
<sub>移行前のタスク番号: 20</sub>

---

## #22 龍龍・X・note・YouTube列をかな順でソートできるようにする

- 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: UI/UX, 対象: jpml_pros

### 本文

一度実装したが動作しなかったため削除した。空欄の選手は昇順・降順どちらでも最下部に固定したい。

---
<sub>移行前のタスク番号: 18</sub>

---

## #21 Astroへの移行を検討する

- 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: 整理・保守, 対象: 全ページ

### 本文

27ページすべてにheadの中身とnavbar読み込みがコピーされており、SEO展開やOGP追加のたびに全ページを触る必要がある。Astroなら1つのレイアウトで済む。代償としてビルド工程が復活し、Pythonの生成スクリプトの扱いを決める必要がある。試作(旧74番)の結果を見て判断。

---
<sub>移行前のタスク番号: 73</sub>

---

## #17 Email Routingで独自ドメインのメールアドレスを作る

- 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: インフラ

### 本文

contact@ryoei.pro のようなアドレスを作り、既存のメールに転送する。無料で、メールボックスもサーバー設定も不要。送信はできない(受信・転送のみ)。企業からの問い合わせ窓口として。ドメイン切替(旧11番)の直後に実施。

### 依存: #116 で SPF を「送信しない」に設定済み

2026-09-11 に #116 でなりすまし対策として、以下を設定した。

| Type | Name | Content |
|---|---|---|
| TXT | @ | `v=spf1 -all` |
| TXT | `_dmarc` | `v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s;` |
| TXT | `*._domainkey` | `v=DKIM1; p=` |

**受信だけなら影響しないが、`@ryoei.pro` からの送信を行う場合は
SPF の書き換えが必須。** 書き換えないと送信メールが拒否される。
DMARC も `adkim=s` / `aspf=s` と厳密なため、あわせて見直しが要る。

MX レコードは未設定のため、受信するには MX の追加が必要。

---
<sub>移行前のタスク番号: 68</sub>

---

## #15 index.htmlが別系統の構造になっている件

- 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: 整理・保守, 対象: index

### 本文

index.html はWebサイトテンプレート由来で index.css と11個のvendorライブラリを使い、他26ページは style.css のみという二重構造。統一の必要はないが、assets/vendor の1.2MBはトップページ1枚のためだけに存在する。将来トップページを作り直す機会があれば最大の削減余地。

---
<sub>移行前のタスク番号: 56</sub>

### コメント (1件)

**retroeater** (2026-09-10):

## 方針決定（2026-09-10）

トップページの位置づけを確定した。

**個人の実績を見せる場**である。選手データベースは
平野良栄個人のポートフォリオを構成する要素の一つという整理。

したがって現行のセクション構成
（hero / about / facts / resume / portfolio）は
情報設計としては妥当であり、作り直しは中身の質の問題として扱う。

作り直しは新サイトの第一弾として行う（別issue）。

## 調査結果の追記

### ライセンス上の制約

BootstrapMade の無料テンプレート iPortfolio 由来。
フッターの「Designed by BootstrapMade」リンクは、
Pro版を購入しない限り削除できない（HTMLコメントに明記あり）。

### フッターの表記が未修正

349行目が以下のままになっている。

  &copy; Copyright <strong><span>iPortfolio</span></strong>

テンプレートのプレースホルダが残っている。別issueで対応する。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01786uUDe5x11WyMc5U1yLdw

---

## #13 構造化データ(JSON-LD)を追加する

- 作成: 2026-09-07
- ラベル: 状況: 保留, 分野: SEO/AIO, 対象: jpml_pros

### 本文

ItemList と Person で選手情報を機械可読にする。静的HTML化で検索エンジンが中身を読めるようになったため、効果が見込める。検索結果やAIアシスタントでの認識に効く。

---
<sub>移行前のタスク番号: 38</sub>

### コメント (9件)

**retroeater** (2026-09-09):

「状況: 保留」ラベルを追加。構造化データは新サイトで対応する判断をしたため。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01F9dijmUHdMUVBVPevDpXRw

**retroeater** (2026-09-12):

### 優先度と理由（2026-09-12、Claudeとの検討）

SEO/AIO施策10件の中で**9番目**（新サイトで対応、保留のまま）。
- 選手個別ページに `Person`、一覧に `ItemList`、全体に `WebSite` / `BreadcrumbList`
- AI回答での「誰がどの団体の誰か」の認識精度に直接効くため、AIO施策としても中核
- ビルド工程（#21）があれば生成を自動化できる

**retroeater** (2026-09-12):

video_wayhome.html（#102第2段）で先行実装した。

VideoObject（最新話1件）とItemList（全エピソード）の2ブロックをJSON-LDで出力（`scripts/generate_video_wayhome.py`の`build_json_ld()`）。ブラウザ上で両ブロックが有効なJSONとしてパースでき、`@type`が意図どおりであることをChrome DevTools Protocol経由で確認済み。schema.orgのVideoObject必須プロパティ（name/description/thumbnailUrl/uploadDate）は満たしているが、`duration`はスプレッドシートに情報がなく含めていない。

**Googleのリッチリザルトテストは未実施。** 本番未反映で検証対象URLがまだ存在しないため。本番反映後に`https://search.google.com/test/rich-results`で実URLを検証することを推奨する。

このページ以外（jpml_prosの選手データベース）への展開は本issueの本来のスコープのまま、別途判断。

**retroeater** (2026-09-12):

## 未実行の TODO: リッチリザルトテストによる実URL検証（平野さん作業）

#102 第2段で `video_wayhome.html` に JSON-LD（`VideoObject` + `ItemList`）を
先行実装したが、**本番未反映のため実URLでの検証ができなかった**。
代わりに ①両ブロックが構文的に有効な JSON であること（`JSON.parse`）、
②`VideoObject` / `ItemList` の必須・推奨プロパティが揃っていることの
コードレビュー、の2点で代替している。

リッチリザルトテストは対話的な外部ツールのため**自動化で代行しない**。
本番反映後に手で実行する作業として残す。

### 本番反映後の検証手順

- [ ] **リッチリザルトテストを開く** — https://search.google.com/test/rich-results
- [ ] **検証するURL**: `https://ryoei.pro/video_wayhome.html`
      （「URL をテスト」側を使う。未反映の間はコード貼り付けでも代替可）
- [ ] **`VideoObject` が1件認識されること**を確認（最新話1件を出力している）
- [ ] **`ItemList` が1件認識されること**を確認
      （エピソード全件。`ListItem` に `position` / `url` / `name`）
- [ ] **2ブロックとも「検出された項目」に並ぶこと**を確認
      （片方しか出ない場合は JSON-LD のパース失敗を疑う）
- [ ] **エラー（赤）が0件であること**を確認
- [ ] **警告（黄）の内容を確認** — 下記の既知のギャップ以外に警告が出ていないか
- [ ] モバイル / PC の両方で結果が同じか（差が出たら記録する）

### 既知のギャップ: `duration` は未設定（警告が出ても想定内）

`VideoObject` の `duration`（ISO 8601 形式の動画尺）は**意図的に設定していない**。
スプレッドシートに秒数などの尺情報が無いため。Google は `duration` を
**推奨プロパティ**として挙げているので、**この項目の警告が出るのは想定内**で、
対応不要。

将来シート側に尺の列を追加できるなら埋める余地がある
（`scripts/generate_video_wayhome.py` の `build_json_ld()` に1行足すだけで済む形）。
その判断はこの issue とは別で構わない。

### 補足

- 本番反映のタイミング自体は平野さんの判断。この作業では**デプロイしていない**
- 実装の詳細と検証済み事項は `docs/new-site-design.md` §12「構造化データ（#13先行実装）」
- ビルダー関数の形（辞書を組み立てて `json.dumps` + `</` エスケープ）は、
  この issue の本体スコープ（選手個別ページの `Person` / `ItemList`）に
  そのまま流用できる

### ラベルの見直し

`対象: jpml_pros` のみだったが、実態に合わせて **`対象: video_wayhome` を追加**した
（VideoObject / ItemList をこのページで先行実装済み）。`対象: jpml_pros` は
本体スコープ（選手情報の `Person` / `ItemList`）が未着手のまま残っているので併記する。

---
_Generated by [Claude Code](https://claude.ai/code)_

**retroeater** (2026-09-12):

着手中: 本番検証（VideoObjectのuploadDate指摘2件・ItemListがリッチリザルト対象外）への対応を行っています。

- lib/sheets.py: 全セルにstrip()を掛ける(空白混入対策)
- generate_video_wayhome.py: uploadDateを完全なISO 8601(00:00:00 JST近似)に変換、ItemListの現状をコメントで記録

セッション: https://claude.ai/code/session_01Ph5dbxcvrwYgdaWbd6Jg95

**retroeater** (2026-09-12):

## 本番検証結果への対応、完了

平野さんが本番URL(video_wayhome.html)で実行したGoogleリッチリザルトテスト・schema.org検証ツールの結果（VideoObjectは検出・有効、任意の指摘2件がいずれもuploadDate／ItemListはリッチリザルト対象外／schema.org検証はエラー・警告なし）を踏まえ、以下を対応しました。

### 1. uploadDateを完全なISO 8601に
`2026-08-08` → `2026-08-08T00:00:00+09:00`。スプレッドシートには日付しか無いため、時刻は **00:00:00 JSTで近似**（実際の公開時刻ではない）。正確な時刻が必要になれば YouTube Data API の `videos.list`(`snippet.publishedAt`)で取得できる（#62でAPIキー発行が前提）。パースできない値はuploadDateキーごと省略する方針にした（不正な文字列を出すより安全。VideoObject自体は出す。uploadDateは必須プロパティではなく、値が不正でもGoogleは「任意」の指摘に留めているため）。詳細・理由は `scripts/generate_video_wayhome.py` の `_to_upload_date()` のコメントに記録

### 2. スプレッドシート由来の値をstrip()
個別対応ではなく `scripts/lib/sheets.py` の `_normalize()` で全セル共通に対処（全16ページに影響する変更）。push後、`scripts/lib/` の変更を検知した `regenerate-page.yml` が全16ページを自動再生成し、実際の差分は **resource_logs.html / saikyo_results.html / video_wayhome.html の3ページ**（他13ページは差分なし）。すべて空白除去のみで、意図しない差分は無いことを確認済み（commit [27dbc3c](https://github.com/retroeater/mj/commit/27dbc3cc7c73c2f65c066353af498a9c21a09279)）。副次的な効果として、saikyo_results.htmlの一部行で `href` 末尾の空白（`https://x.com/t_oriyama ` 等、壊れたリンクの原因）や `?name=` 完全一致の失敗要因（`data-name`先頭の空白）も解消された

### 3. ItemListの扱い
削除せず、現状Googleのリッチリザルト対象外であること・理由（itemListElement.urlがyoutube.com=外部サイトを指しているため）をコメントで記録。#162にコメントを追加済み

### 残課題
- **duration は依然として未設定。** ただし本番検証でGoogleはこれを問題として報告していない
- 他ページへ展開する際、uploadDate相当の日付列を持つページでは同じ形式（00:00:00 JST近似・パース失敗時は省略）を使うこと

### ビルド状況
push後、`regenerate-page.yml`（全16ページ再生成）・`Workers Builds: mj` とも成功を確認（check-runsより）。**「ビルドが成功した」ことの確認であり、「本番がその通りに見える」ことの確認ではない。** ryoei.pro自体はセッションから遮断されているため、実URLでの再検証はセッションからはできません

### お願い
修正が本番へ反映された後、**再度リッチリザルトテスト／schema.org検証ツールでの再テストをお願いします。** 特に以下が消えていることの確認:
- 「uploadDateの日時値が無効です」
- 「日時プロパティ「uploadDate」にタイムゾーンがありません」

このissue(#13)は、他ページへの展開が未着手のため引き続きオープンのままにします。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Ph5dbxcvrwYgdaWbd6Jg95

**retroeater** (2026-09-12):

着手中: 再テスト結果(警告なし)の記録と、uploadDateコメントの記述修正(「必須プロパティではない」は誤り)を行っています。

セッション: https://claude.ai/code/session_01Ph5dbxcvrwYgdaWbd6Jg95

**retroeater** (2026-09-12):

## 再テスト結果（平野さんが本番URLで実行。セッションからは再現できない）

対象: https://ryoei.pro/video_wayhome.html（クロール 2026/09/12 21:30:59）

**VideoObject: 検出・有効。警告なし。** 前回の2件（uploadDateの日時値が無効／タイムゾーンが無い）はいずれも解消。

- name: 第11期桜蕾戦 武田雛歩（空白1つに是正済み）
- description: 日本プロ麻雀連盟「帰り道ついていってイイっすか」。第11期桜蕾戦を終えた武田雛歩への密着インタビュー動画です。（不自然な空白が解消）
- thumbnailUrl / contentUrl / embedUrl: 従来どおり
- uploadDate: 2026-08-08T00:00:00+09:00

duration の欠落は今回も指摘されなかった。

## 対応内容（3点）

1. **uploadDateのISO 8601化**: `2026-08-08` → `2026-08-08T00:00:00+09:00`。スプレッドシートには日付しかないため、時刻は00:00:00 JSTで近似（実際の公開時刻ではない）
2. **lib/sheets.pyの入口でstrip()**: 個別ページではなく `fetch_sheet()` の入口で全16ページ共通に対処
3. **ItemListは削除せず据え置き**: リッチリザルトの対象外（itemListElement.urlがyoutube.comを指しているため）。schema.org検証ツールではエラー・警告なし。#162で個別ページができれば自サイトURLを指すようになり、カルーセルの候補になる旨を#162にコメント済み

### strip()はvideo_wayhome以外にも波及した

個別ページではなく `fetch_sheet()` の入口で対処した結果、resource_logs.htmlで13行、saikyo_results.htmlで4行の末尾/先頭空白が解消（店名の末尾空白がaltとdata-infoの両方に入っていた等）。副次的に、saikyo_results.htmlの一部行で壊れていたリンク（`href`末尾の空白）や `?name=` 完全一致の失敗要因（`data-name`先頭の空白）も解消された。実差分はcommit [27dbc3c](https://github.com/retroeater/mj/commit/27dbc3cc7c73c2f65c066353af498a9c21a09279)。

### 記述の訂正

`3f0f8b4` のコミットメッセージおよび修正前の`scripts/generate_video_wayhome.py`のコメントに「uploadDateは必須プロパティではない」との記述があったが、これは誤り。**GoogleのVideoObjectではname/thumbnailUrl/uploadDateの3つが必須プロパティ。** 前回「任意」の指摘に留まったのは、値が存在した上で形式が不完全だったためであり、プロパティ自体が任意だからではない。コミットメッセージは履歴のため直せないが、ソースコメントは修正した。あわせて、パース失敗時にuploadDateキーを省略する現在の実装は「その回だけ必須プロパティ欠落のエラーになる」ことを承知の上での選択である旨を明記した（現在38行すべて正常にパースできており通常は発動しない。発動するようになった場合はVideoObject自体を出さない判断もありうる）

## 他ページへ展開する際の注意

- uploadDate相当の日付列を持つページでは同じISO 8601形式（00:00:00 JST近似、パース失敗時は省略）を使うこと
- name / thumbnailUrl / uploadDate はGoogleの必須プロパティであること（今回の誤りを繰り返さない）

## 残課題

durationは依然として未設定だが、2回のテストとも指摘されていない。正確な公開時刻と尺が必要になれば#62（YouTube Data APIのキー発行）の後に`videos.list`で取得できる。他ページへの展開は未着手のため、引き続きオープンのままにする。

## ラベルの見直し

「対象: video_wayhome」を外した。video_wayhomeでの先行実装（JSON-LD追加・本番検証・指摘解消）が完了したため。「対象: jpml_pros」（選手個別ページへのPerson/一覧へのItemList）は未着手のため残す。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Ph5dbxcvrwYgdaWbd6Jg95

**retroeater** (2026-09-12):

#162で追加したエピソード個別ページ（`/wayhome/<動画ID>.html`）について、本番URL（`https://ryoei.pro/wayhome/UtxpVoWy2GY.html`）でGoogleのリッチリザルトテストを実行したところ、`VideoObject`が有効なアイテムとして検出された（2026-09-12）。

一覧ページ（video_wayhome.html）のJSON-LDは本番未反映の時点でしか検証できず「本番反映後に実URLで改めて実行することを推奨する」と記録していたが（本issueのコメント参照）、今回個別ページで実際に本番URLでの検証が取れた。個別ページ側の`VideoObject`の組み立ては一覧ページと共通の`scripts/lib/wayhome.py`の`build_video_object()`を使っているため、一覧ページ側の実装も同様に有効と見てよい材料になる。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Tp6w3RZZoBPCnAAaKchVtV

---

## #9 CSP(Content-Security-Policy)を設定する

- 作成: 2026-09-07
- ラベル: 状況: 待ち, 分野: セキュリティ, 対象: 全ページ

### 本文

Bootstrapのローカル化(旧44番)で外部依存が減り、インラインonerrorも廃止済みなので設定しやすい状態。Sentry導入(旧64番)で外部ドメインが増えるため、その後に着手する。

---
<sub>移行前のタスク番号: 12</sub>

### コメント (6件)

**retroeater** (2026-09-11):

### Speed Brain との非互換（2026-09-11）

Speed Brain を有効化した（#119）。Speed Brain は strict-dynamic や nonce を使う
CSP とは併用できないと公式に明記されている。

参照: https://developers.cloudflare.com/speed/optimization/content/speed-brain/

#119 の判定で Speed Brain が機能すると分かった場合、CSP のポリシー設計で
strict-dynamic / nonce を採用するかどうかは、Speed Brain を残すかどうかと
セットの判断になる。

### あわせて（#120のチェックリスト）

Early Hints も 2026-09-11 に有効化した。こちらは `Link:` ヘッダを読むだけで
HTML を書き換えないため、CSP との競合はない。

**retroeater** (2026-09-11):

### 追記（2026-09-12、レビュー反映）

Speed Brainとの併用制約は#119で「機能しない・Off」に確定したため無効。

生成済みHTMLの`<img src>`から機械的に洗い出した外部ドメイン一覧（gstatic
を除き12件）:

| ドメイン | 用途/発生ページ |
|---|---|
| `img.youtube.com` | jpml_test / rh_paifu / video_en / video_live / video_mtsuku / video_wayhome / index |
| `pbs.twimg.com` | jpml_pros / jpml_titles / resource_logs / saikyo_mens / saikyo_results |
| `ron2.jp` | jpml_pros / jpml_test / jpml_titles |
| `abs.twimg.com` | jpml_pros（11件）/ saikyo_results（2件）データ側13件、正規化は#135 |
| `yt3.googleusercontent.com` | jpml_pros |
| `yt3.ggpht.com` | jpml_pros |
| `assets.st-note.com` | jpml_pros |
| `d2l930y2yx77uc.cloudfront.net` | jpml_pros |
| `stat.profile.ameba.jp` | jpml_pros |
| `kinmaweb.jp` | saikyo_results（1,324件） |
| `i.ytimg.com` | index |
| `www.icualumni.com` | index |

次のコマンドで再現できる:

```
for f in *.html; do grep -o 'src="https\?://[^/"]*' "$f" | sed 's/src="//'; done | sort | uniq -c | sort -rn
```

handover「画像ドメインの実測結果（#9の材料）」の表にも同じ12件を反映した。

**retroeater** (2026-09-11):

### インラインイベントハンドラの残存ページが5→3に(2026-09-11)

`houou_leagues.html` / `ouka_leagues.html`の型C静的化(#127)で、旧
`onchange="javascript:location.href = this.value"`を廃止し、新設した
`leagues.js`側で`addEventListener('change', ...)`に置き換えた。

機械的に確認したところ、`onchange="javascript:`/`onclick="javascript:`/
`onerror="`を含むページは以下のコマンドで検出できる。

```
grep -rl 'onchange="javascript:\|onclick="javascript:\|onerror="' *.html
```

現状の残存は次の3ページ(ランキング系、いずれも#7の型B判断待ち)のみ:

- `houou_ranking.html`
- `ouka_ranking.html`
- `wrc_ranking.html`

ランキング系3ページを#7の対象から外す場合でも、インラインハンドラの
排除自体はCSP(#9)の前提のため、別途対応が必要な点に注意。

---
_Generated by [Claude Code](https://claude.com/claude-code)_

**retroeater** (2026-09-12):

#102 第1段（video_wayhomeのヒーロー画像）を実装。issue本文にあった「外部依存はi.ytimg.com」は誤りで、既存表と同じ `img.youtube.com` のみで完結し、CSPへの影響はなし（`img-src` の追加は不要）。

第2段（背景動画の自動再生）に進む場合は `frame-src` へ `www.youtube-nocookie.com` の追加が必要になる見込み（#102本文の記載どおり）だが、第2段は現時点で未着手・別途判断。

**retroeater** (2026-09-12):

#102第2段（video_wayhome全面リデザイン、表を廃止）後も外部依存はimg.youtube.comのみで変わらず。CSPへの影響はなし。

**retroeater** (2026-09-12):

#102 第3段（video_wayhome の背景動画自動再生）を見送ることが決まった（2026-09-12）。理由は#102本文参照。

CSP設計への影響:
- `frame-src` に `www.youtube-nocookie.com` を追加する必要は無くなった
- **video_wayhome の外部依存は img.youtube.com のみで確定**（動画自体は埋め込まず、サムネイル画像のみ参照する構成のまま）
- 現時点でサイト全体に third-party の iframe は存在しない。CSPを設計する際、`frame-src 'none'` を出発点にできる

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0122eHDpjFz1CugjjsePn61x

---

## #8 龍龍の所属・出身地等との照合

- 作成: 2026-09-07
- ラベル: 分野: 自動化, 対象: jpml_pros

### 本文

ron2.jp の選手ページから取得できる所属・出身地・段位・かな読みと、スプレッドシートの内容を突き合わせる。表記ゆれ(「九州本部」対「九州」など)の吸収が必要。画像の同期確認(旧61番)の後に着手する。

---
<sub>移行前のタスク番号: 63</sub>

---

## #7 他21ページのGoogle Charts依存を解消する

- 作成: 2026-09-07
- ラベル: 状況: 対応中, 分野: パフォーマンス, 対象: 全ページ

### 本文

27ページ中11ページが、いまもブラウザから直接Googleスプレッドシートにクエリを投げている。www.gstatic.com と docs.google.com への依存が消え、初期表示も速くなる。旧55番が前提。Astro移行(旧73番)の判断もこのタイミング。

---
<sub>移行前のタスク番号: 39</sub>

### コメント (9件)

**retroeater** (2026-09-11):

## rh_results.html を移行(2026-09-11)

型A'(多列テキストテーブル、画像列なし)の1ページ目。共通部品として以下を追加した。

- `TableConfig.show_filter`(#searchBoxes自体を持たないページ用)
- `.mj-table-auto`(style.css。画像列固定を前提としない多列テーブル用)
- `table.js`のテーブル検出セレクタを`.mj-table[data-filter-param]`→`.mj-table`に変更(絞り込み欄なしでもナビバー固定分のオフセット計算は必要なため)

これらは`rh_results_detail`と型Bの表部分でも使う想定。

また、スプレッドシートの表示形式(`#,##0.0`等)が`fetch_sheet()`では取得できないことが分かった。gvizは生の数値とは別に表示用文字列を持つが`fetch_sheet()`は生の値しか返さないため、`rh_results`側で書式を再現する整形関数を追加して対処した(`scripts/lib/sheets.py`は変更していない)。数値列を持つページを今後移行する際は同じ確認が必要。

進捗: 21ページ中10ページ完了・残11ページ。詳細はdocs/handover.mdの「#7 の進め方」を参照。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_011Asd1Gp8BAvU9bB9fJS2SZ

**retroeater** (2026-09-11):

## 訂正: gvizは表示形式付き文字列(f)を返す

前回のコメントで「スプレッドシートの表示形式(#,##0.0等)はfetch_sheet()では取得できない」と書いたが、これは誤り。gvizのレスポンスはセルごとに生の値(v)とは別に表示用文字列(f)を持っており、シートの表示形式が反映されている。rh_results側で書いていたCOLUMN_DECIMALS + format_number()による自前整形は不要だった。

## 対応

- `fetch_sheet()`(scripts/lib/sheets.py)に`formatted: bool = False`を追加。`True`でセルの`f`を優先して使う
- 既定は`False`のまま。選手IDやYouTube動画IDなどURL・HTML属性に埋め込む値では`f`の桁区切り("6,010")がリンクを壊すため
- `generate()`(scripts/lib/page.py)にも`formatted`引数を追加し、そのまま渡す
- `generate_rh_results.py`をformatted=Trueを使う形に書き換え、自前整形コードを削除

`rh_results.html`はバイト単位で無変更、既存9ページも出力に差分がないことを確認済み。数値列を含む他のページ(`rh_results_detail`等)を移行する際は、URL・属性に使う列が含まれていないことを確認したうえで`formatted=True`を使う。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_011Asd1Gp8BAvU9bB9fJS2SZ

**retroeater** (2026-09-11):

## rh_results_detail.html を移行し型A'を完了(2026-09-11)

- QUERY側で表示列のみ(A,C,E,G,I,R,S,T,V)を取得(22列取得して後から間引く旧方式はやめた)
- `formatted=True`が必須だった。A列(日付)はgvizのtype=dateで、生の値(v)が"Date(2026,0,24)"というJS Date形式の文字列になるため
- 対局列にXアイコンを後置。`build_image_cell()`は画像セル単体を作る関数のため使わず、`build_row_html`内で直接組み立てた
- **旧Google Charts版(gh-pages)を実レンダリングして比較したところ、全列が折り返されていた。** `.mj-table`既定のnowrapのままだと375px幅で横スクロールが発生したため、`#rh_results_detail_table td`全体に`white-space: normal`を適用して解消(団体列12文字の団体名、着順列9桁の値など、短そうに見えた列にも幅を圧迫する例外値があった)
- Lighthouse(mobile): performance 89 / TBT 236ms / DOM 3,573要素(321行のわりに軽い)

型A'(rh_results / rh_results_detail)完了。進捗: 21ページ中11ページ完了・残10ページ。詳細はdocs/handover.mdとdocs/lighthouse-baseline.mdを参照。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_011Asd1Gp8BAvU9bB9fJS2SZ

**retroeater** (2026-09-11):

## グラフ系6ページの構造調査、#111を型別に分割(2026-09-11)

型A'(rh_results / rh_results_detail)の完了に続けて、残り12ページのうちグラフを描画する6ページ(型B/C/D)の構造をコードと実機の両方で確認した。

### 訂正: houou_resultsが#7最大のDOM規模ページになりうる

これまで「`houou_results`等は`?name`必須で未指定時は何も描画しない」と記録していたが誤り。実機確認の結果、`?name`が必須なのはローソク足(`#myChart`)だけで、**表(`myTable`)は`?name`の有無に関わらず無条件で描画される**。現在DOM行数が500に収まっているのはGoogle Chartsの`page:'enable'`+`pageSize:500`が実際にDOMを分割しているためで、自前の`.mj-pager`(`row.hidden`)方式に置き換えると15,416行が丸ごとDOMに乗り、`saikyo_results`(2,560行)を超えて**#7最大のDOM規模ページ**になる。詳細はdocs/lighthouse-baseline.md・docs/handover.mdを更新済み。

### #111を型別に3分割

グラフ系6ページは型B/C/Dで性質が大きく異なり、1つのissueでは判断できないため分割した。

- **#111**(型B、houou_results/ouka_results/wrc_results): 常時表示のDashboard+Tableに`?name`時のみローソク足が乗る構造。3ページとも同一ではなく、houou_resultsのみリーグ欄がCategoryFilter(ドロップダウン)、ouka_resultsはStringFilter、wrc_resultsは名前欄のみ(実機確認で判明)
- **#127**(型C、houou_leagues/ouka_leagues): 積み上げ棒は全員共通、`?name`依存は折れ線1本のみ。静的化とのハイブリッドが成立しうる
- **#128**(型D、resource_efficiency): URLパラメータ非依存・データ固定(34行)。グラフ系で唯一、完全に静的SVG化できる

6ページとも、カスタムツールチップ・`addListener`は存在しない(既定のGoogle Chartsツールチップのみ)ことも実機確認済み。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_011Asd1Gp8BAvU9bB9fJS2SZ

**retroeater** (2026-09-11):

## resource_efficiency.html を移行し型Dを完了(2026-09-11)

グラフ系6ページで唯一、完全に静的SVG化できるページ(#128)。

- scripts/lib/chart.pyを新規作成(横棒グラフのSVG生成、標準ライブラリのみ)
- scripts/lib/page.pyにrender_content()を追加。表を持たないページ用にHEAD_TEMPLATEを切り出した(既存11ページの出力は無変更を確認済み)
- 各棒の<g>内の<title>要素でJS/CSSなしのツールチップを実現。#111/#127/#128に「ツールチップは失われる」という誤記の訂正コメントを追加した
- gstatic.com依存を解消。グラフ系で唯一、外部JSを一切読まないページになった
- シート名の特定に手間取った件を記録: 旧JSはgid=1188043937としか書いておらず、gid=0が「詳細」、1188043937が「シート1」という一見逆に見える対応だった

型D完了。進捗: 21ページ中12ページ完了・残9ページ(型B3・型C2・型A4)。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_011Asd1Gp8BAvU9bB9fJS2SZ

**retroeater** (2026-09-11):

## saikyo_results.html をビルド時生成に移行（2026-09-11）

型Aの2列テーブル(2,560行)を `scripts/lib/page.py` の共通処理で静的HTML化した。型Aはランキング3ページを除いて完了（残8ページ）。

### `?name=` の列取り違えバグを発見・修正（#122 関連）

移行前の実機確認で、旧 `saikyo_results.js` の `?name=` に列の取り違えバグがあることが分かった。

- コード上のコメントは「A列=対局日 / H列=名前」と書いているが、実際のクエリは `queryStatement += ' AND A = "' + search_name + '"'` で、**A列（対局日）に対して名前文字列を完全一致させていた**。H列（名前）は一度も参照されていない
- gh-pages版（旧方式のまま）で実機確認: `?name=`に実在の選手名を指定すると0件、実在の対局日の文字列を指定するとヒットする。バグを再現できた
- `?name=`は#122で調査中のSearch Console実測（`?name=`付きURLの内訳）に関わる可能性があるため、削除はせず、コメントが示す「本来意図されていたはずの挙動」（H列＝名前の完全一致）に修正して移行した。バグ自体（A列に対する完全一致）は再現していない
- 挙動としては「ほぼ常に0件」から「名前で絞り込める」への意図的な変更になる。#122の`?name=`アクセス実績を見るときは、この変更が入る前後で挙動が違う点に注意

### その他の実装メモ

- 写真が空の行（528件、全体の約20%）は、旧`getFormattedImage()`がTwitter IDも画像URLもない場合に戻り値が未初期化(`undefined`)になるバグを持っていたが、実機確認の結果Google Chartsはこれを空セルとして描画しており「undefined」という文字列が出るわけではなかった。`build_image_cell()`に空文字を渡すだけで同じ見た目を再現できたため、個別分岐は不要だった
- フォールバック画像は`img/avatar.svg`に統一（旧版はTwitter IDの有無で`img/twitter.svg`と`src=''`に分かれており、後者は自ページへの画像リクエストになるバグだった。`saikyo_mens`での対応を踏襲）
- 行高(`contain-intrinsic-size`)は160×90画像基準の98pxを、mobile幅での実測（中央値・90パーセンタイル・最大値がいずれも98px一致）で確認して採用
- 詳細は `scripts/generate_saikyo_results.py` のモジュールdocstringと `docs/handover.md` / `docs/lighthouse-baseline.md` を参照

**retroeater** (2026-09-11):

## 未移行ページの gviz クエリに、URLパラメータをエスケープなしで連結している

Mantis の検討中にリポジトリを読んでいて見つけたもの。
**#7 の移行で該当ページごと消えるため、単独の対応は不要。**
移行時に再発させないための記録。

### 該当箇所は3ファイル

`houou_results.js` / `ouka_results.js` / `wrc_results.js` が、
URLパラメータ `?name=` をクエリ文字列にそのまま連結している。

```js
let search_name = params.get('name')
let queryStatement = 'SELECT A,B,...,U WHERE V = "Y"'
queryStatement += ' AND A = "' + search_name + '" ORDER BY B,C'
```

`"` を含む値を渡すと文字列を抜け出して WHERE 句を書き換えられる。

### 他の未移行ページは該当しない（確認済み）

- `houou_leagues.js` / `ouka_leagues.js` — `queryStatement` は `const` の固定文字列。
  `?name=` は取得後のクライアント側の絞り込みにしか使っていない
- `league_ranking.js` — クエリは `getQueryString(division)` の if/else で選ぶ固定文字列9種で、
  連結はしていない。ただし `?sheet=` はデータソースURLに連結している
  （`WORKBOOK_URL + '?sheet=' + SHEET_NAME + '&headers=1'`）。
  同じワークブックのシート名を指すだけで、クエリ構文には触れない

### 実害は小さい

- 対象は読み取り専用の公開スプレッドシート1冊で、シート内の同じデータしか取れない
- 認証もセッションもないため、盗める資格情報がない
- 結果は Google Charts の Table / Chart に描画されるので、DOM XSS の経路にもならない

### 移行時の留意点

Python 側（`scripts/lib/page.py` の `generate()`）は QUERY をビルド時に組み立て、
URLパラメータはブラウザ側の絞り込み（`table.js` の `data-name-mode` /
`data-filter-param`）で扱う構造になっているため、
**型A/A'と同じ手順で移行すればこの形は自動的に消える。**

型B（#111）・型C（#127）でグラフ本体に Google Charts を残す方針を取る場合、
`?name=` をクエリに渡す箇所が残る可能性がある。その場合は値の `"` を
エスケープするか、取得は全件にしてフィルタをクライアント側で行うこと。

### 関連

同じ検討中に見つけた GitHub Actions の script injection は #132 に切り出した。

---
_Generated by [Claude Code](https://claude.ai/code)_

**retroeater** (2026-09-11):

### 追記（2026-09-12、レビュー反映）

ランキング3ページは #141 で扱う。残り8ページの内訳: 型B 3（#111）・型C 2（#127）・ランキング 3（#141）。

**retroeater** (2026-09-11):

### 型C(houou_leagues / ouka_leagues)完了(2026-09-11、#127)

方針(c)静的SVG+折れ線だけクライアント描画のハイブリッドで移行完了。
残るは型B(houou_results / ouka_results / wrc_results、#111で方針検討中)
とランキング系3ページ（houou_ranking / ouka_ranking / wrc_ranking）の
計6ページ。

詳細は#127のクローズコメント参照。

---
_Generated by [Claude Code](https://claude.com/claude-code)_

---

## #4 Sentryを導入してJSエラーを検知する

- 作成: 2026-09-07
- ラベル: 分野: 自動化, 対象: jpml_pros

### 本文

jpml_pros.js の自作フィルター・ソート・固定列の処理が特定の環境で壊れても気づく手段がない。無料枠(月5000エラー)で十分。外部ドメインが1つ増えるため、CSP設定(旧12番)より先に入れる。

---
<sub>移行前のタスク番号: 64</sub>

### コメント (1件)

**retroeater** (2026-09-11):

### 追記（2026-09-12、レビュー反映）

「現行サイトに作り込みすぎない」方針との整合を再確認したい。現行サイトに
外部ドメインを1つ足してからCSP（#9）を書く順序になっているが、新サイト
（#101）側で導入するほうが自然な可能性がある。状況: 保留にするか、現行で
入れるかを平野さんが判断する。

---

## #3 YouTubeチャンネルアイコンの一致確認

- 作成: 2026-09-07
- ラベル: 分野: 自動化, 対象: jpml_pros

### 本文

YouTube Data API v3 の channels.list で82チャンネルのアイコンURLを取得し、サイトの表示と突き合わせる。API呼び出しは2回・消費クォータ2ユニットで済む。Google CloudでのAPIキー発行と、GitHub Secretsへの登録が前提。

---
<sub>移行前のタスク番号: 62</sub>

---
