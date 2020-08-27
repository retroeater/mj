const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1p3JQrsjaywAB85aoiYcHoz5vrwzbBKMOQF7SWLM08Vw/edit#gid=0'

google.charts.load('current', {'packages':['table']});
google.charts.setOnLoadCallback(drawTable);

function drawTable() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery('SELECT A,B,C,D,E')
	query.send(handleQueryResponse)

	function handleQueryResponse(response) {
		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const data = response.getDataTable()

		const table = new google.visualization.Table(document.getElementById('myTable'))

		for(let i = 0; i < data.getNumberOfRows(); i++) {

				// 名前フォーマット
				let formattedName = getFormattedName(data,i)

				// タイトルフォーマット
				let formattedTitle = getFormattedTitle(data,i)

				data.setValue(i, 0, formattedName)
				data.setValue(i, 3, formattedTitle)
		}

		// 必要列のみ表示
		const view = new google.visualization.DataView(data)
		view.setColumns([0,2,3,5])

		const options = {
			allowHtml: true,
			width: '100%',
			height: '100%',
			showRowNumber: true,
			sortColumn: 3,
			sortAscending: false
		}

		table.draw(view, options)
	}
}

function getFormattedName(data,row_index) {

	let name_jp_kanji = data.getValue(row_index,0)
	let name_jp_kana = data.getValue(row_index,1)

	let formattedName = ""

	formattedName = name_jp_kanji + ' （' + name_jp_kana + '）'

	return formattedName
}

function getFormattedTitle(data,row_index) {

	const title = data.getValue(row_index,3)
	const url = data.getValue(row_index,4)

	let formattedTitle = ""

	formattedTitle += ' <a href="' + url + '" target="_blank"><img alt="記事" src="img/125_arr_hoso.png" height="29" width="29" /></a> ' + title

	return formattedTitle
}
