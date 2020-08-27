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

		// 必要列のみ表示
		const view = new google.visualization.DataView(data)
		view.setColumns([0,1,2,3,4])

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
