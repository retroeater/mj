// 型A(2列テーブル)の共通処理: 検索フィルター・ページ送り
// (以前のGoogle Charts + 毎回のスプレッドシート問い合わせ方式を置き換え)
//
// jpml_titles.js / jpml_test.js / resource_logs.js / video_live.js の
// 4本がほぼ同一だったため1本に統合したもの(#7)。ページごとの違いは
// table要素のdata属性で渡す(scripts/lib/page.py の TableConfig参照):
//   - data-page-size   : 1ページの件数。省略時はページ送りなし(例: video_mtsuku)
//   - data-name-mode   : "exact"なら ?name= をdata-nameとの完全一致に使う
//                        (旧 Google Charts 版の WHERE A = "名前" 相当)
//   - data-filter-param: 概要の絞り込み欄の初期値に使うURLパラメータ
//                        ("name" か "tag"。ページによって異なる)
//
// ページ固有のUI(resource_logsの名前セレクトボックス・タグリンク等)は
// ここでは共通化せず、そのページ専用の小さなJSを別に持たせる。
// window.mjTable.getSearchParam をその最小限のフックとして公開する。

window.mjTable = window.mjTable || {}

window.mjTable.getSearchParam = function (name) {
	const params = new URL(document.location).searchParams
	const value = params.get(name)
	return value && value !== 'null' ? value : ''
}

document.addEventListener('DOMContentLoaded', function () {
	const table = document.querySelector('.mj-table[data-filter-param]')
	if (!table) return

	const getSearchParam = window.mjTable.getSearchParam

	const pageSizeAttr = table.dataset.pageSize
	const PAGE_SIZE = pageSizeAttr ? Number(pageSizeAttr) : null // nullならページ送りなし
	const nameMode = table.dataset.nameMode // "exact" | undefined
	const filterParam = table.dataset.filterParam || 'name'

	const infoInput = document.getElementById('info_filter')
	// data-name-mode="exact"のときだけ ?name= を完全一致に使う。
	// 値そのもの(nullなら未指定)。
	const searchName = nameMode === 'exact' ? getSearchParam('name') : ''

	// 画像の読み込み失敗を1箇所でまとめて処理する(旧: imgごとのonerror属性)。
	// error イベントはバブリングしないため、キャプチャフェーズで受ける。
	document.addEventListener('error', function (event) {
		const img = event.target
		if (!(img instanceof HTMLImageElement)) return
		const fallback = img.dataset.fallback
		if (!fallback) return
		delete img.dataset.fallback // 代替画像も失敗した場合の無限ループを防ぐ
		img.src = fallback
	}, true)

	if (infoInput) infoInput.value = getSearchParam(filterParam)

	// ソートを持たないため、行の並びは初期化時から変わらない。
	// 検索対象は毎回変わらないので、行と小文字化済みの検索用文字列を
	// 最初に1度だけ組み立てて使い回す。
	const tbody = table.querySelector('tbody')
	const rowIndex = Array.from(tbody.querySelectorAll('tr')).map(function (row) {
		return { row: row, name: row.dataset.name, info: (row.dataset.info || '').toLowerCase(), matches: true }
	})

	const countEl = document.getElementById('result_count')
	const pagerEl = document.querySelector('.mj-pager')
	const pagerPrev = document.getElementById('pager_prev')
	const pagerNext = document.getElementById('pager_next')
	const pagerStatus = document.getElementById('pager_status')

	let currentPage = 0 // 0-indexed

	function render() {
		const infoQuery = infoInput ? infoInput.value.toLowerCase() : ''

		const matched = []
		for (const entry of rowIndex) {
			const isMatch = (!searchName || entry.name === searchName) && entry.info.includes(infoQuery)
			entry.matches = isMatch
			if (isMatch) matched.push(entry)
		}

		const total = matched.length
		// ページ送りがない場合は全件を1ページとして扱う(件数に関わらず全行表示)。
		const effectivePageSize = PAGE_SIZE || Math.max(total, 1)
		const pageCount = Math.max(1, Math.ceil(total / effectivePageSize))
		if (currentPage > pageCount - 1) currentPage = pageCount - 1
		if (currentPage < 0) currentPage = 0

		const start = currentPage * effectivePageSize
		const end = start + effectivePageSize

		// 状態が変わる行だけ書き換える。毎回全行に代入すると
		// そのたびにレイアウトが再計算されて重くなる
		matched.forEach(function (entry, i) {
			const shouldShow = i >= start && i < end
			if (entry.row.hidden === shouldShow) entry.row.hidden = !shouldShow
		})
		for (const entry of rowIndex) {
			if (!entry.matches && !entry.row.hidden) entry.row.hidden = true
		}

		// #pager_status はrole=status/aria-liveを持たない(読み上げの発生源は
		// #result_countのみにする)。そのため複数ページあるときは、
		// ページ移動が読み上げ利用者にも伝わるよう件数表示にページ情報も含める。
		const singlePage = !PAGE_SIZE || total <= PAGE_SIZE
		if (countEl) {
			if (singlePage) {
				countEl.textContent = total + '件を表示しています'
			} else {
				const shownStart = start + 1
				const shownEnd = Math.min(end, total)
				countEl.textContent = total + '件中 ' + shownStart + '〜' + shownEnd + '件目を表示しています（' +
					(currentPage + 1) + ' / ' + pageCount + 'ページ）'
			}
		}

		if (pagerEl) {
			pagerEl.hidden = singlePage
			pagerPrev.disabled = currentPage === 0
			pagerNext.disabled = currentPage >= pageCount - 1
			if (pagerStatus) {
				pagerStatus.textContent = (currentPage + 1) + ' / ' + pageCount + 'ページ'
			}
		}
	}

	// 打鍵ごとに走らせず、入力が落ち着いてから1度だけ実行する
	let filterTimer = null
	function scheduleFilters() {
		clearTimeout(filterTimer)
		filterTimer = setTimeout(function () {
			currentPage = 0 // 絞り込み条件が変わったら1ページ目に戻す
			render()
		}, 120)
	}

	if (infoInput) infoInput.addEventListener('input', scheduleFilters)

	if (pagerPrev) {
		pagerPrev.addEventListener('click', function () {
			if (currentPage > 0) {
				currentPage--
				render()
			}
		})
	}
	if (pagerNext) {
		pagerNext.addEventListener('click', function () {
			currentPage++
			render()
		})
	}

	render()

	// 上部のBootstrapメニューと検索ボックスは画面に固定表示するため、
	// その実測高さをCSS変数に渡す。フォントや折り返し、検索ボックスの
	// 開閉で高さが変わるので固定値にはしない。
	//   --navbar-height : メニューの高さ(検索ボックスのtop位置に使う)
	//   --content-offset: メニュー + 検索ボックスの高さ
	//                     (本文のpadding-topとテーブルヘッダーのtop位置に使う)
	function updateOffsets() {
		const navbar = document.querySelector('nav.navbar')
		const searchBoxes = document.getElementById('searchBoxes')
		if (!navbar) return

		const navbarHeight = navbar.getBoundingClientRect().height
		// 閉じているときはdisplay:noneなのでoffsetHeightは0になる
		const searchHeight = searchBoxes ? searchBoxes.offsetHeight : 0

		const root = document.documentElement.style
		root.setProperty('--navbar-height', navbarHeight + 'px')
		root.setProperty('--content-offset', (navbarHeight + searchHeight) + 'px')
	}

	updateOffsets()
	window.addEventListener('resize', updateOffsets)

	// スマホではハンバーガーメニューの開閉でナビバーの高さが変わるが、
	// これはresizeイベントを発火しないため、--navbar-height が古いままになり
	// 本文が潜り込む。ナビバー自体のサイズ変化を直接監視して追従させる。
	if (typeof ResizeObserver !== 'undefined') {
		const observer = new ResizeObserver(updateOffsets)
		const navbar = document.querySelector('nav.navbar')
		const searchBoxes = document.getElementById('searchBoxes')
		if (navbar) observer.observe(navbar)
		if (searchBoxes) observer.observe(searchBoxes)
	}

	// display:none の要素は ResizeObserver が反応しない環境もあるため、
	// Bootstrapの開閉イベントでも明示的に更新する(アニメーション完了時)
	const searchBoxesEl = document.getElementById('searchBoxes')
	if (searchBoxesEl) {
		searchBoxesEl.addEventListener('shown.bs.collapse', updateOffsets)
		searchBoxesEl.addEventListener('hidden.bs.collapse', updateOffsets)
	}
})
