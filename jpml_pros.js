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

	// 列ヘッダークリックでソート(data-sort属性があればそちらを、無ければ表示テキストを使用)
	const headers = table.querySelectorAll('thead th')
	headers.forEach(function (th, colIndex) {
		th.style.cursor = 'pointer'
		let ascending = true
		th.addEventListener('click', function () {
			const tbody = table.querySelector('tbody')
			const rows = Array.from(tbody.querySelectorAll('tr'))

			rows.sort(function (a, b) {
				const cellA = a.children[colIndex]
				const cellB = b.children[colIndex]
				const valA = cellA.dataset.sort !== undefined ? cellA.dataset.sort : cellA.textContent.trim()
				const valB = cellB.dataset.sort !== undefined ? cellB.dataset.sort : cellB.textContent.trim()
				if (valA < valB) return ascending ? -1 : 1
				if (valA > valB) return ascending ? 1 : -1
				return 0
			})

			rows.forEach(function (row) { tbody.appendChild(row) })
			ascending = !ascending
		})
	})
})
