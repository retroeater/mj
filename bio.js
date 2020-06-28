google.charts.load('current', {'packages':['table']});
google.charts.setOnLoadCallback(drawTable);

var spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1O7FuxVJ--bnV9zxP9XUEJ6g8tu-paG0VhkhFSGkHOvY/edit#gid=0'

function drawTable() {
	var query = new google.visualization.Query(spreadsheet_url)
	query.setQuery('SELECT A,B')
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
