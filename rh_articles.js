const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1WxXJJ2vQPfjNsMYT9zBE2UU1Xo7T-PkhWYE6dtWtk50/edit?sheet=記事&headers=1'

const queryStatement = 'SELECT A,B,C,D,E,F WHERE G = "Y"'

google.charts.load('current', {'packages':['table','controls']})
google.charts.setOnLoadCallback(drawDashboard)

function drawDashboard() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery(queryStatement)
	query.send(handleQueryResponse)

	function handleQueryResponse(response) {

		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const data = response.getDataTable()

		for(let i = 0; i < data.getNumberOfRows(); i++) {

			// 名前フォーマット
			let formattedName = getFormattedName(data,i)

			// タイトルフォーマット
			let formattedTitle = getFormattedTitle(data,i)

			data.setValue(i, 0, formattedName)
			data.setValue(i, 3, formattedTitle)
		}

		const dashboard = new google.visualization.Dashboard(document.getElementById('dashboard_div'))

		const titleFilter = new google.visualization.ControlWrapper({
			controlType: 'StringFilter',
			containerId: 'title_filter_div',
			options: {
				filterColumnIndex: 2,
				matchType: 'any',
				ui: {
					label: '',
					placeholder: 'タイトル'
				}
			},
		})
	
		const table = new google.visualization.ChartWrapper({
			chartType: 'Table',
			containerId: 'table_div',
			options : {
				allowHtml: true,
				width: '100%',
				height: '100%',
				showRowNumber: false,
				sortColumn: 3,
				sortAscending: false
			}
		})

		// 必要列のみ表示
		const view = new google.visualization.DataView(data)
		view.setColumns([0,2,3,5])

		dashboard.bind([titleFilter], table)
		dashboard.draw(view)
	}
}

function getFormattedName(data,row_index) {

	let name_jp_kanji = data.getValue(row_index,0)
	let name_jp_kana = data.getValue(row_index,1)

	let formattedName = ""

	if(name_jp_kanji) {
		formattedName = name_jp_kanji + ' （' + name_jp_kana + '）'
	}

	return formattedName
}

function getFormattedTitle(data,row_index) {

	const title = data.getValue(row_index,3)
	const url = data.getValue(row_index,4)

	let formattedTitle = ""

	formattedTitle += ' <a href="' + url + '" target="_blank"><img alt="記事" src="img/box-arrow-up-right.svg" height="16" width="16" /></a> ' + title

	return formattedTitle
}
