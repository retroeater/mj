// houou_leagues.html / ouka_leagues.html 共通(#127)。
//
// 積み上げ棒は選手によらず共通で静的SVGに焼き込み済み。ここでは
// ?name= に応じて選手1名分の折れ線(<polyline>)と凡例ラベルだけを
// 差し替える。?name= が無ければ何もしない(焼き込み済みの既定選手の
// ままになる)。JSONが読み込めない場合も同様に既定選手のまま。
//
// 該当選手の順位データが無いときは、折れ線を消すだけでなく凡例の
// 項目を隠して説明を出す(#168)。詳細はshowNoDataNotice()のコメント。
//
// インラインイベントハンドラは使わない(#9)。旧版の
// onchange="javascript:location.href = this.value" を廃止し、ここで
// addEventListener('change', ...) を登録する。
(function () {
	'use strict'

	const select = document.getElementById('selectbox')
	if (select) {
		select.addEventListener('change', function () {
			if (this.value) {
				location.href = this.value
			}
		})
	}

	const params = new URLSearchParams(location.search)
	const name = params.get('name')
	if (!name) {
		return
	}

	const jsonUrl = document.currentScript.dataset.jsonUrl
	if (!jsonUrl) {
		return
	}

	fetch(jsonUrl)
		.then(function (res) {
			return res.json()
		})
		.then(function (data) {
			applyName(name, data[name] || [])
		})
		.catch(function () {
			// 取得に失敗した場合は焼き込み済みの既定選手の折れ線のまま
		})

	function applyName(selectedName, points) {
		document.querySelectorAll('polyline[data-chart-role="line"]').forEach(function (line) {
			const left = parseFloat(line.dataset.plotLeft)
			const top = parseFloat(line.dataset.plotTop)
			const width = parseFloat(line.dataset.plotWidth)
			const height = parseFloat(line.dataset.plotHeight)
			const yMax = parseFloat(line.dataset.yMax)
			const periodCount = parseFloat(line.dataset.periodCount)
			const bandWidth = width / periodCount

			function xOf(i) {
				return left + bandWidth * (i + 0.5)
			}
			function yOf(v) {
				return top + (v / yMax) * height
			}

			const pointsStr = points
				.map(function (p) {
					return xOf(p[0]) + ',' + yOf(p[1])
				})
				.join(' ')
			line.setAttribute('points', pointsStr)
		})

		const hasData = points.length > 0

		document.querySelectorAll('[data-chart-role="legend-line-label"]').forEach(function (el) {
			el.textContent = selectedName
			// 折れ線が無いときは凡例の項目ごと隠す。青い色見本の隣に
			// 名前だけが残ると「線がどこかにある」と誤読されるため。
			const item = el.closest('.mj-chart-legend-item')
			if (item) {
				item.hidden = !hasData
			}
		})

		if (!hasData) {
			showNoDataNotice(selectedName)
		}
	}

	// 順位データが無い選手の着地点に説明を出す(#168)。
	//
	// jpml_pros.html は「鳳凰最高」「桜花最高」列にこのページへのリンクを
	// 出しており、初出場の期が進行中の選手もリンク対象に含まれる。その期は
	// 順位が未確定でlib/leagues.pyのselect_periods()が期ごと除外するため、
	// 折れ線データが1件も作られない(houou 25名・ouka 14名が該当)。
	//
	// リンク元(jpml_pros)側で出し分ける案も検討したが、鳳凰と桜花で出場
	// 回数の数え方が違い(43後デビューは鳳凰出場が空、21期デビューは桜花
	// 出場が1回)、リンク元の列だけでは両ページを統一的に判定できなかった。
	// そのため着地側で説明する。期が確定すれば自然に解消するが、新しい期が
	// 始まるたびに再発する。
	function showNoDataNotice(selectedName) {
		const legend = document.querySelector('.mj-chart-legend')
		if (!legend || document.getElementById('leagueNoData')) {
			return
		}
		const notice = document.createElement('p')
		notice.id = 'leagueNoData'
		notice.className = 'mj-margin-text'
		notice.setAttribute('role', 'status')
		notice.textContent = selectedName + ' の順位データが見つかりませんでした。'
			+ '初出場の期が進行中の場合は、その期の順位が確定するまで表示されません。'
		legend.after(notice)
	}
})()
