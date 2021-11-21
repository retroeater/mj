const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1WxXJJ2vQPfjNsMYT9zBE2UU1Xo7T-PkhWYE6dtWtk50/edit?sheet=成績&headers=1'

const queryStatement = 'SELECT A,B,C,D,E,F'

google.charts.load('current', {'packages':['table']});
google.charts.setOnLoadCallback(drawTable);

function drawTable() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery(queryStatement)
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

		const view = new google.visualization.DataView(data)

		table.draw(view, options);
	}
}
