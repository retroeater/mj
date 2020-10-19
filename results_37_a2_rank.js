const spreadsheet_url_rank = 'https://docs.google.com/spreadsheets/d/1Dx3XGjp0xmiQMvp4PzIBu6SerXsRlMWAI9UsVumFfjM/edit?sheet=順位推移'

google.charts.load('current', {'packages':['corechart']})
google.charts.setOnLoadCallback(drawChart)

function drawChart() {

	const query = new google.visualization.Query(spreadsheet_url_rank)
	query.setQuery('SELECT A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P')
	query.send(handleQueryResponse)

	function handleQueryResponse(response) {
		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}
		
		const data = response.getDataTable()
		
        const options = {
			chartArea: {
				left: 50,
				top: 20,
				width: '100%',
				height: '80%'
			},
			legend: {position: 'bottom'},
			title: '第37期A2リーグ',
			titlePosition: 'in'
        }

        const chart = new google.visualization.LineChart(document.getElementById('myChart'))

        chart.draw(data, options)
	}
}
