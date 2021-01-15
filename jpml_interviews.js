const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=jpml_interviews&headers=1'

google.charts.load('current', {'packages':['table','controls']})
google.charts.setOnLoadCallback(drawDashboard)

function drawDashboard() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery('SELECT A,B,C,D,E')
	query.send(handleQueryResponse)

	function handleQueryResponse(response) {
		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const data = response.getDataTable()

		for(let i = 0; i < data.getNumberOfRows(); i++) {

				// タイトルフォーマット
				let formattedTitle = getFormattedTitle(data,i)

				data.setValue(i, 2, formattedTitle)
		}

		const dashboard = new google.visualization.Dashboard(document.getElementById('dashboard_div'))

		const nameFilter = new google.visualization.ControlWrapper({
			controlType: 'StringFilter',
			containerId: 'name_filter_div',
			options: {
				filterColumnIndex: 0,
				matchType: 'any'
			}
		})

		const interviewerFilter = new google.visualization.ControlWrapper({
			controlType: 'StringFilter',
			containerId: 'interviewer_filter_div',
			options: {
				filterColumnIndex: 1,
				matchType: 'any'
			}
		})

		const table = new google.visualization.ChartWrapper({
					'chartType': 'Table',
					containerId: 'table_div',
			options : {
				allowHtml: true,
				width: '100%',
				height: '100%',
				sortColumn: 3,
				sortAscending: false
			}
		})

		// 必要列のみ表示
		const view = new google.visualization.DataView(data)
		view.setColumns([0,1,2,4])

		dashboard.bind([nameFilter,interviewerFilter], table)
		dashboard.draw(view)
	}
}

function getFormattedTitle(data,row_index) {
	
	const title = data.getValue(row_index,2)
	const url = data.getValue(row_index,3)

	let formattedTitle = ""

	formattedTitle += ' <a href="' + url + '" target="_blank"><img alt="記事" src="img/125_arr_hoso.png" height="29" width="29" /></a> ' + title

	return formattedTitle	
}
