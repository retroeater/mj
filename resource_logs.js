// resource_logs.html 専用の小さなJS: 名前セレクトボックスの制御
// (検索フィルター・ページ送りの共通処理は table.js に移した(#7))
//
// - 旧来 onchange="javascript:location.href=..." というインラインハンドラ
//   だったため、change イベントで拾う形に置き換えた(#9のCSP前提)
// - 選択中の名前を反映するため、?name= に一致する選択肢があれば
//   初期表示時に selected にする(table.js の window.mjTable.getSearchParam
//   を使う。旧Google Charts版はこれができておらず、?name=で開いても
//   「名前を選択」のままだった)

document.addEventListener('DOMContentLoaded', function () {
	const nameSelect = document.getElementById('name_select')
	if (!nameSelect) return

	const searchName = window.mjTable.getSearchParam('name')

	if (searchName) {
		const matchValue = 'resource_logs.html?name=' + searchName
		const option = Array.from(nameSelect.options).find(function (opt) { return opt.value === matchValue })
		if (option) nameSelect.value = matchValue
	}

	nameSelect.addEventListener('change', function () {
		if (nameSelect.value) location.href = nameSelect.value
	})
})
