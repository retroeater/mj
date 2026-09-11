// houou_leagues.html / ouka_leagues.html 共通(#127)。
//
// 積み上げ棒は選手によらず共通で静的SVGに焼き込み済み。ここでは
// ?name= に応じて選手1名分の折れ線(<polyline>)と凡例ラベルだけを
// 差し替える。?name= が無ければ何もしない(焼き込み済みの既定選手の
// ままになる)。JSONが読み込めない場合も同様に既定選手のまま。
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

		document.querySelectorAll('[data-chart-role="legend-line-label"]').forEach(function (el) {
			el.textContent = selectedName
		})
	}
})()
