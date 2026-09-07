// 静的テーブルの検索フィルターとソート機能
// (以前のGoogle Charts + 毎回のスプレッドシート問い合わせ方式を置き換え)

document.addEventListener('DOMContentLoaded', function () {
	const params = new URL(document.location).searchParams
	const table = document.getElementById('pros_table')
	if (!table) return

	const placeInput = document.getElementById('place_filter')
	const nameInput = document.getElementById('name_filter')
	const leagueInput = document.getElementById('league_filter')
	const oukaInput = document.getElementById('ouka_filter')

	function getSearchParam(name) {
		const value = params.get(name)
		return value && value !== 'null' ? value : ''
	}

	placeInput.value = getSearchParam('place')
	nameInput.value = getSearchParam('name')
	leagueInput.value = getSearchParam('league')
	oukaInput.value = getSearchParam('ouka')

	function applyFilters() {
		const place = placeInput.value.toLowerCase()
		const name = nameInput.value.toLowerCase()
		const league = leagueInput.value.toLowerCase()
		const ouka = oukaInput.value.toLowerCase()

		table.querySelectorAll('tbody tr').forEach(function (row) {
			const matches =
				row.dataset.place.toLowerCase().includes(place) &&
				row.dataset.name.toLowerCase().includes(name) &&
				row.dataset.league.toLowerCase().includes(league) &&
				row.dataset.ouka.toLowerCase().includes(ouka)
			row.style.display = matches ? '' : 'none'
		})
	}

	;[placeInput, nameInput, leagueInput, oukaInput].forEach(function (input) {
		input.addEventListener('input', applyFilters)
	})

	applyFilters()

	// 列ヘッダークリックでソート。
	// 龍龍/X/note/YouTube列(2〜5列目, 0-indexed)は、
	// かな順ソートが未実装のためいったんソート対象から除外する。
	const NO_SORT_COLUMNS = [2, 3, 4, 5]

	const thead = table.querySelector('thead')
	const tbody = table.querySelector('tbody')
	const headerCells = Array.from(table.querySelectorAll('thead th'))
	const sortDirections = new Array(headerCells.length).fill(true) // true=昇順

	headerCells.forEach(function (th, index) {
		if (!NO_SORT_COLUMNS.includes(index)) {
			th.style.cursor = 'pointer'
		}
	})

	thead.addEventListener('click', function (event) {
		const th = event.target.closest('th')
		if (!th || !thead.contains(th)) return

		const colIndex = headerCells.indexOf(th)
		if (colIndex === -1) return
		if (NO_SORT_COLUMNS.includes(colIndex)) return

		const ascending = sortDirections[colIndex]
		const rows = Array.from(tbody.querySelectorAll('tr'))

		rows.sort(function (a, b) {
			const cellA = a.children[colIndex]
			const cellB = b.children[colIndex]
			const valA = (cellA && cellA.dataset.sort !== undefined) ? cellA.dataset.sort : (cellA ? cellA.textContent.trim() : '')
			const valB = (cellB && cellB.dataset.sort !== undefined) ? cellB.dataset.sort : (cellB ? cellB.textContent.trim() : '')
			if (valA < valB) return ascending ? -1 : 1
			if (valA > valB) return ascending ? 1 : -1
			return 0
		})

		rows.forEach(function (row) { tbody.appendChild(row) })
		sortDirections[colIndex] = !ascending
	})

	// 横スクロール時、1・2列目(所属/出身地・名前)を固定表示にする。
	// 1列目の幅は内容に応じて変わる(nowrap指定で自動調整)ため、
	// 2列目のsticky位置(left)は固定値では決め打ちできず、
	// 実際にレンダリングされた1列目の幅を都度測ってJSで設定する。
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

	function updateStickyOffsets() {
		const firstColCells = table.querySelectorAll('thead th:nth-child(1), tbody td:nth-child(1)')
		if (firstColCells.length === 0) return
		const width = firstColCells[0].getBoundingClientRect().width

		table.querySelectorAll('thead th:nth-child(2), tbody td:nth-child(2)').forEach(function (cell) {
			cell.style.left = width + 'px'
		})
	}

	function updateLayout() {
		updateOffsets()
		updateStickyOffsets()
	}

	updateLayout()
	window.addEventListener('resize', updateLayout)

	// スマホではハンバーガーメニューの開閉でナビバーの高さが変わるが、
	// これはresizeイベントを発火しないため、--navbar-height が古いままになり
	// 本文が潜り込む。ナビバー自体のサイズ変化を直接監視して追従させる。
	// メニューの開閉(ハンバーガー)や検索ボックスの開閉は resize を発火しないため、
	// 要素自体のサイズ変化を監視して追従させる。
	if (typeof ResizeObserver !== 'undefined') {
		const observer = new ResizeObserver(updateLayout)
		const navbar = document.querySelector('nav.navbar')
		const searchBoxes = document.getElementById('searchBoxes')
		if (navbar) observer.observe(navbar)
		if (searchBoxes) observer.observe(searchBoxes)
	}

	// display:none の要素は ResizeObserver が反応しない環境もあるため、
	// Bootstrapの開閉イベントでも明示的に更新する(アニメーション完了時)
	const searchBoxesEl = document.getElementById('searchBoxes')
	if (searchBoxesEl) {
		searchBoxesEl.addEventListener('shown.bs.collapse', updateLayout)
		searchBoxesEl.addEventListener('hidden.bs.collapse', updateLayout)
	}
})
