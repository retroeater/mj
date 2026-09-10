// 静的テーブルの検索フィルター・ソート・ページ送り
// (以前のGoogle Charts + 毎回のスプレッドシート問い合わせ方式を置き換え)
//
// jpml_pros.js との違い:
//   - フィルターは概要列1つのみ(所属/名前/リーグ/桜花の4つは不要)
//   - ?name= は入力欄を持たず、data-name との完全一致で内部的に絞り込む
//     (旧 Google Charts 版の WHERE A = "名前" と同じ挙動)
//   - 1・2列目のsticky固定は2列しかないため不要
//   - ページ送りを自前実装(旧 Google Charts 版の page:'enable', pageSize:100 相当)

document.addEventListener('DOMContentLoaded', function () {
	const params = new URL(document.location).searchParams
	const table = document.getElementById('titles_table')
	if (!table) return

	// 1ページの件数。他ページへ展開するときはこの値を変える
	const PAGE_SIZE = 100

	const infoInput = document.getElementById('info_filter')
	const searchName = params.get('name') // ?name= は完全一致用。値そのまま(nullなら未指定)

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

	infoInput.value = getSearchParam('tag')

	// 概要列(1列目)のインデックス。ソート対象はここだけ。
	const SORT_COLUMN_INDEX = 1

	// 検索対象は毎回変わらないので、行と小文字化済みの検索用文字列を
	// 最初に1度だけ組み立てて使い回す。ソートキーもここで確定させ、
	// ソート時に毎回textContentを読み直さずに済むようにする。
	// 優先順位: セルにdata-sortがあればその値、無ければ行のdata-info。
	// (jpml_prosは表示文字列と異なるソートキーを持つ列があるため
	//  data-sortをセルごとに持つが、jpml_titlesは概要列のみなので
	//  data-info をそのままソートキーに使い、data-sortの重複出力を
	//  やめている。ソート処理の実装自体はjpml_pros.jsと分かれたまま
	//  だが、型Aの共通化に着手するときはどちらかに寄せる)
	let tbody = table.querySelector('tbody') // ソート時に差し替えるので let
	const entryByRow = new Map()
	Array.from(tbody.querySelectorAll('tr')).forEach(function (row) {
		const sortCell = row.children[SORT_COLUMN_INDEX]
		const sortKey = (sortCell && sortCell.dataset.sort !== undefined) ? sortCell.dataset.sort : row.dataset.info
		const entry = {
			row: row,
			name: row.dataset.name,
			info: row.dataset.info.toLowerCase(),
			sortKey: sortKey,
			matches: true
		}
		entryByRow.set(row, entry)
	})

	function getOrderedEntries() {
		return Array.from(tbody.querySelectorAll('tr')).map(function (row) {
			return entryByRow.get(row)
		})
	}

	const countEl = document.getElementById('result_count')
	const pagerEl = document.querySelector('.mj-pager')
	const pagerPrev = document.getElementById('pager_prev')
	const pagerNext = document.getElementById('pager_next')
	const pagerStatus = document.getElementById('pager_status')

	let currentPage = 0 // 0-indexed

	function render() {
		const infoQuery = infoInput.value.toLowerCase()
		const ordered = getOrderedEntries()

		const matched = []
		for (const entry of ordered) {
			const isMatch = (!searchName || entry.name === searchName) && entry.info.includes(infoQuery)
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
		for (const entry of ordered) {
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

	// 列ヘッダークリックでソート。写真列(0列目)はソート対象外。
	const NO_SORT_COLUMNS = [0]

	const thead = table.querySelector('thead')
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

		// ソートキーは初期化時にentryByRowへ計算済みのものを使う。
		// 2,000行超あるため、比較のたびにDOMからtextContentを読み直さない。
		rows.sort(function (a, b) {
			const valA = entryByRow.get(a).sortKey
			const valB = entryByRow.get(b).sortKey
			if (valA < valB) return ascending ? -1 : 1
			if (valA > valB) return ascending ? 1 : -1
			return 0
		})

		// 既存のtbodyに2,000行超を移動させるとレイアウト計算が繰り返される。
		// 新しいtbodyを組み立ててから丸ごと入れ替えると、
		// 文書に反映されるのが1回で済む(#86)。
		const newBody = document.createElement('tbody')
		rows.forEach(function (row) { newBody.appendChild(row) })
		table.replaceChild(newBody, tbody)
		tbody = newBody // 以降の処理が新しいtbodyを見るように差し替える
		sortDirections[colIndex] = !ascending

		// 読み上げ利用者に、どの列がどの向きで並んでいるかを伝える
		headerCells.forEach(function (cell, i) {
			if (cell.hasAttribute('aria-sort')) {
				cell.setAttribute('aria-sort',
					i === colIndex ? (ascending ? 'ascending' : 'descending') : 'none')
			}
		})

		// ソートしたときは現在のページ番号を保つ(1ページ目に戻さない)
		render()
	})

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
