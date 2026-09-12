// wayhome/<動画ID>.html(エピソード個別ページ、#162)専用のJS。
//
// このページには検索欄(#searchBoxes)が無いため、video_wayhome.jsが持つ
// ?name=の初期値付けや--navbar-height実測(#searchBoxesの固定位置決め用)は
// 不要。table.jsと同じ理由でこのページの対象外(.mj-tableが無い)。
// 必要な機能だけを次の2つに絞って持たせている:
//   - 画像の読み込み失敗時のフォールバック(data-fallback。table.js/
//     video_wayhome.jsと同じ実装)
//   - 共有ボタン(URLをコピー)。video_wayhome.jsと同じ3段フォールバック
//     (docs/new-site-design.md「共有ボタン」参照)

document.addEventListener('DOMContentLoaded', function () {
	// ---- 画像フォールバック ----
	document.addEventListener('error', function (event) {
		const img = event.target
		if (!(img instanceof HTMLImageElement)) return
		const fallback = img.dataset.fallback
		if (!fallback) return
		delete img.dataset.fallback // 代替画像も失敗した場合の無限ループを防ぐ
		img.src = fallback
	}, true)

	// ---- URLをコピー ----
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
