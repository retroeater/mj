// 静的テーブルの検索フィルター・ページ送り
// (以前のGoogle Charts + 毎回のスプレッドシート問い合わせ方式を置き換え)
//
// jpml_titles.js との違い:
//   - PAGE_SIZE は 50(現行 Google Charts 版の pageSize: 50 を踏襲。
//     jpml_titles は 100)
//   - ?name= の意味が異なる。jpml_titles では ?name= は入力欄を持たず
//     data-name との完全一致(WHERE句相当)だったが、jpml_test では
//     ?name= は概要の絞り込み入力欄の「初期値」として使う(部分一致)。
//     同じパラメータ名でページによって挙動が違う点は、型Aの共通化に
//     着手するときの設定項目になる
//   - 上記のため data-name 属性・完全一致フィルターは持たない
//   - 列ヘッダによるソートは持たない(jpml_pros.html専用の機能とする方針)

document.addEventListener('DOMContentLoaded', function () {
	const params = new URL(document.location).searchParams
	const table = document.getElementById('test_table')
	if (!table) return

	// 1ページの件数。他ページへ展開するときはこの値を変える
	const PAGE_SIZE = 50

	const infoInput = document.getElementById('info_filter')

	function getSearchParam(name) {
		const value = params.get(name)
		return value && value !== 'null' ? value : ''
	}

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

	// ?name= は概要の絞り込み入力欄の初期値として使う(部分一致)
	infoInput.value = getSearchParam('name')

	// ソートを持たないため、行の並びは初期化時から変わらない。
	// 検索対象は毎回変わらないので、行と小文字化済みの検索用文字列を
	// 最初に1度だけ組み立てて使い回す。
	const tbody = table.querySelector('tbody')
	const rowIndex = Array.from(tbody.querySelectorAll('tr')).map(function (row) {
		return { row: row, info: row.dataset.info.toLowerCase(), matches: true }
	})

	const countEl = document.getElementById('result_count')
	const pagerEl = document.querySelector('.mj-pager')
	const pagerPrev = document.getElementById('pager_prev')
	const pagerNext = document.getElementById('pager_next')
	const pagerStatus = document.getElementById('pager_status')

	let currentPage = 0 // 0-indexed

	function render() {
		const infoQuery = infoInput.value.toLowerCase()

		const matched = []
		for (const entry of rowIndex) {
			const isMatch = entry.info.includes(infoQuery)
			entry.matches = isMatch
			if (isMatch) matched.push(entry)
		}

		const total = matched.length
		const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
		if (currentPage > pageCount - 1) currentPage = pageCount - 1
		if (currentPage < 0) currentPage = 0

		const start = currentPage * PAGE_SIZE
		const end = start + PAGE_SIZE

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
		const singlePage = total <= PAGE_SIZE
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

	infoInput.addEventListener('input', scheduleFilters)

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
