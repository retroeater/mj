// video_wayhome.html 専用のJS(#102第2段: 新サイトのパイロット)。
//
// table.js は .mj-table が無いページでは何もしないため読み込んでいない。
// このページには .mj-table が存在せず table.js の対象外になるため、
// 以下をこのファイルに移植している:
//   - 画像の読み込み失敗時のフォールバック(data-fallback)
//   - 検索欄(#info_filter)の絞り込みと ?name= の初期値付け
//   - #searchBoxes(虫眼鏡から開く検索欄)を画面固定表示するための
//     --navbar-height の実測
// 移植を忘れると、このページだけ画像フォールバックが効かなくなる
// (docs/handover.md に注意点として記録済み)。
//
// 追加でこのページ固有の機能:
//   - エピソード横スクロールの矢印ボタン
//   - URLをコピーするボタン(navigator.clipboard.writeText()。新サイトの
//     選手個別ページでも同じ方式を使う想定、docs/new-site-design.md参照)

document.addEventListener('DOMContentLoaded', function () {
	// ---- ?name= の読み取り(table.jsのwindow.mjTable.getSearchParamと同じ実装) ----
	function getSearchParam(name) {
		const params = new URL(document.location).searchParams
		const value = params.get(name)
		return value && value !== 'null' ? value : ''
	}

	// ---- 画像フォールバック(table.jsから移植。忘れるとこのページだけ壊れる) ----
	document.addEventListener('error', function (event) {
		const img = event.target
		if (!(img instanceof HTMLImageElement)) return
		const fallback = img.dataset.fallback
		if (!fallback) return
		delete img.dataset.fallback // 代替画像も失敗した場合の無限ループを防ぐ
		img.src = fallback
	}, true)

	// ---- エピソードの絞り込み(ページ送りなし。#info_filterへの部分一致) ----
	const infoInput = document.getElementById('info_filter')
	const track = document.getElementById('episodeTrack')
	const countEl = document.getElementById('result_count')

	if (infoInput) infoInput.value = getSearchParam('name')

	let cardIndex = []
	if (track) {
		cardIndex = Array.from(track.querySelectorAll('.mj-video-card')).map(function (card) {
			return { card: card, info: (card.dataset.info || '').toLowerCase() }
		})
	}

	function render() {
		if (!track) return
		const query = infoInput ? infoInput.value.toLowerCase() : ''
		let shown = 0
		for (const entry of cardIndex) {
			const matches = entry.info.includes(query)
			if (matches) shown++
			if (entry.card.hidden === matches) entry.card.hidden = !matches
		}
		if (countEl) countEl.textContent = shown + '件を表示しています'
	}

	let filterTimer = null
	function scheduleFilter() {
		clearTimeout(filterTimer)
		filterTimer = setTimeout(render, 120)
	}
	if (infoInput) infoInput.addEventListener('input', scheduleFilter)
	render()

	// ---- #searchBoxes を画面固定表示するための --navbar-height 実測 ----
	// .mj-table系ページのtable.jsと違い、このページはナビバー自体を
	// 固定しない(body:has(.mj-table)が対象外のため)。#searchBoxesのみ
	// style.css側の既定ルールでposition:fixedになるので、開いたときの
	// top位置がナビバーの実高さとズレないよう更新する。
	function updateNavbarHeight() {
		const navbar = document.querySelector('nav.navbar')
		if (!navbar) return
		document.documentElement.style.setProperty('--navbar-height', navbar.getBoundingClientRect().height + 'px')
	}
	updateNavbarHeight()
	window.addEventListener('resize', updateNavbarHeight)
	if (typeof ResizeObserver !== 'undefined') {
		const navbar = document.querySelector('nav.navbar')
		if (navbar) new ResizeObserver(updateNavbarHeight).observe(navbar)
	}

	// ---- エピソード横スクロールの矢印ボタン ----
	const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
	document.querySelectorAll('.mj-video-scroll-btn').forEach(function (btn) {
		btn.addEventListener('click', function () {
			if (!track) return
			const cardWidth = track.querySelector('.mj-video-card')?.getBoundingClientRect().width || 200
			const amount = (cardWidth + 12) * 2 // gapぶんを含めた1クリックの移動量(カード2枚分)
			const delta = btn.dataset.dir === 'prev' ? -amount : amount
			track.scrollBy({ left: delta, behavior: reducedMotion ? 'auto' : 'smooth' })
		})
	})

	// ---- URLをコピー ----
	// navigator.clipboard は非セキュアコンテキスト(http、file://等)や
	// 古いブラウザでは存在しない。その場合はdocument.execCommand('copy')の
	// レガシー手段にフォールバックし、それも失敗したらURLを直接
	// aria-liveの領域に出して手動コピーを促す(#102第2段でこの方針を決定、
	// docs/new-site-design.mdに記録)。
	const copyBtn = document.getElementById('copyUrlBtn')
	const copyStatus = document.getElementById('copyStatus')

	function announceCopy(message) {
		if (copyStatus) copyStatus.textContent = message
	}

	function legacyCopy(text) {
		const textarea = document.createElement('textarea')
		textarea.value = text
		textarea.style.position = 'fixed'
		textarea.style.opacity = '0'
		document.body.appendChild(textarea)
		textarea.focus()
		textarea.select()
		let ok = false
		try {
			ok = document.execCommand('copy')
		} catch (e) {
			ok = false
		}
		document.body.removeChild(textarea)
		return ok
	}

	if (copyBtn) {
		copyBtn.addEventListener('click', function () {
			const url = window.location.href
			if (navigator.clipboard && window.isSecureContext) {
				navigator.clipboard.writeText(url).then(
					function () { announceCopy('URLをコピーしました') },
					function () {
						if (legacyCopy(url)) {
							announceCopy('URLをコピーしました')
						} else {
							announceCopy('コピーできませんでした。URLを選択してコピーしてください: ' + url)
						}
					}
				)
			} else if (legacyCopy(url)) {
				announceCopy('URLをコピーしました')
			} else {
				announceCopy('コピーできませんでした。URLを選択してコピーしてください: ' + url)
			}
		})
	}
})
