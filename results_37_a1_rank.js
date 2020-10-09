const spreadsheet_url_rank = 'https://docs.google.com/spreadsheets/d/1xw_MUb2yNdPv-kRxX2xQWOr1Z3BoIFEpsjOp3MRjVTY/edit?sheet=順位推移'

google.charts.load('current', {'packages':['corechart']})
google.charts.setOnLoadCallback(drawChart)

function drawChart() {

	const query = new google.visualization.Query(spreadsheet_url_rank)
	query.setQuery('SELECT A,B,C,D,E,F,G,H,I,J,K')
	query.send(handleQueryResponse)

	function handleQueryResponse(response) {
		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}
		
		const data = response.getDataTable()
		
        const options = {
			legend: {position: 'bottom'}
        }

        const chart = new google.visualization.LineChart(document.getElementById('myChart'))

        chart.draw(data, options)
	}
}
