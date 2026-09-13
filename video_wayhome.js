// video_wayhome.html 専用のJS(#102第2段: 新サイトのパイロット)。
//
// table.js は .mj-table が無いページでは何もしないため読み込んでいない。
// このページには .mj-table が存在せず table.js の対象外になるため、
// 以下をこのファイルに移植している:
//   - 画像の読み込み失敗時のフォールバック(data-fallback)
//   - 検索欄(#info_filter)の絞り込み
// 移植を忘れると、このページだけ画像フォールバックが効かなくなる
// (docs/handover.md に注意点として記録済み)。
//
// #188/#189: 虫眼鏡アイコンで開閉する#searchBoxes方式(旧)は廃止し、navbar
// 直下の常時表示フィルタバーに置き換えた。navbarとフィルタバーはどちらも
// position:stickyのため、互いの高さを --mj-nav-h / --mj-filter-h として
// CSS変数に実測反映する(ブレークポイント・collapse開閉で高さが変わるため
// ハードコードしない)。
//
// #190: エピソード一覧を可変列グリッドに変えたため、横スクロールの矢印
// ボタン(旧)は廃止した(ラップして複数行になるグリッドでは意味を持たない)。
//
// 追加でこのページ固有の機能:
//   - URLをコピーするボタン(navigator.clipboard.writeText()。新サイトの
//     選手個別ページでも同じ方式を使う想定、docs/new-site-design.md参照)

document.addEventListener('DOMContentLoaded', function () {
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

	let cardIndex = []
	if (track) {
		cardIndex = Array.from(track.querySelectorAll('.mj-video-card')).map(function (card) {
			return { card: card, info: (card.dataset.info || '').toLowerCase() }
		})
	}
	const totalCount = cardIndex.length

	function render() {
		if (!track) return
		const query = infoInput ? infoInput.value.toLowerCase() : ''
		let shown = 0
		for (const entry of cardIndex) {
			const matches = entry.info.includes(query)
			if (matches) shown++
			if (entry.card.hidden === matches) entry.card.hidden = !matches
		}
		if (countEl) {
			countEl.textContent = shown === 0
				? '該当する動画がありません'
				: totalCount + '件中 ' + shown + '件を表示'
		}
	}

	let filterTimer = null
	function scheduleFilter() {
		clearTimeout(filterTimer)
		filterTimer = setTimeout(render, 120)
	}
	if (infoInput) infoInput.addEventListener('input', scheduleFilter)
	render()

	// ---- `/`キーで検索欄にフォーカス、Escでフォーカス解除&クリア(#189) ----
	// 入力欄(検索欄に限らず文字入力可能な要素全般)にフォーカスがある間は
	// `/`を通常の文字入力として扱う。ここを分岐し忘れると検索語に
	// 「/」が打てなくなる。
	function isEditableTarget(el) {
		if (!el) return false
		const tag = el.tagName
		return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
	}

	document.addEventListener('keydown', function (event) {
		if (event.key === '/' && infoInput && !isEditableTarget(event.target)) {
			event.preventDefault()
			infoInput.focus()
		} else if (event.key === 'Escape' && document.activeElement === infoInput) {
			infoInput.value = ''
			infoInput.blur()
			render()
		}
	})

	// ---- navbar・フィルタバーの実高さを --mj-nav-h / --mj-filter-h に反映(#188/#189) ----
	// navbar.js の document.write 注入後(このスクリプトはdeferなので後で走る)に
	// 実測する。ブレークポイントで高さが変わる・collapse開閉でも変わるため
	// ハードコードせず、ResizeObserverとwindowのresizeの両方で追随させる。
	function watchHeight(selector, propName) {
		const el = document.querySelector(selector)
		if (!el) return
		function update() {
			document.documentElement.style.setProperty(propName, el.getBoundingClientRect().height + 'px')
		}
		update()
		window.addEventListener('resize', update)
		if (typeof ResizeObserver !== 'undefined') {
			new ResizeObserver(update).observe(el)
		}
	}
	watchHeight('nav.navbar', '--mj-nav-h')
	watchHeight('.mj-filterbar', '--mj-filter-h')

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
