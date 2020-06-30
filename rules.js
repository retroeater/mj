var spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1IRMeWJNi_U8yJfz7OmSzG_PVV8R7tLPWS6xahZfmDXg/edit#gid=1629718271'

google.charts.load('current', {'packages':['table']});
google.charts.setOnLoadCallback(drawTable);

function drawTable() {
	var query = new google.visualization.Query(spreadsheet_url)
	query.setQuery('SELECT A,B,C,D,E,F,G,H,I,J,K')
	query.send(handleQueryResponse)

	function handleQueryResponse(response) {
		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		var data = response.getDataTable()

		var table = new google.visualization.Table(document.getElementById('myTable'));

		var options = {
			allowHtml: true,
			width: '100%',
			height: '100%'
		}

		// 必要列のみ表示
		var view = new google.visualization.DataView(data)

		table.draw(view, options);
	}
}
