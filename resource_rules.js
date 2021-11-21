const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1y8xBxGpIt-C23cwG7MDjDkebMlpnBufa4_IzYAo2QyQ/edit?sheet=ルール&headers=1'

google.charts.load('current', {'packages':['table']});
google.charts.setOnLoadCallback(drawTable);

function drawTable() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery('SELECT A,B,C,D,E,F,G,H,I,J,K')
	query.send(handleQueryResponse)

	function handleQueryResponse(response) {
		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const data = response.getDataTable()

		const table = new google.visualization.Table(document.getElementById('myTable'));

		const options = {
			allowHtml: true,
			width: '100%',
			height: '100%'
		}

		// 必要列のみ表示
		const view = new google.visualization.DataView(data)

		table.draw(view, options);
	}
}
