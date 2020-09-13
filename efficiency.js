const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1O8IzJYEB_tfgvh1RI41mkR2JZjeHTFCZ4gtMY_l8fkQ/edit#gid=1188043937'

google.charts.load('current', {'packages':['corechart']})
google.charts.setOnLoadCallback(drawChart)

function drawChart() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery('SELECT A,B WHERE E = "Y" ORDER BY B DESC')
	query.send(handleQueryResponse)

	function handleQueryResponse(response) {
		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}
		
		const data = response.getDataTable()
		
        const options = {
			chartArea: {
				left: 100,
				top: 50,
				bottom: 0
			},
			legend: 'none',
			title: 'どの牌を残すとメンツができやすいか | Efficiency to create a new group from an existing group and/or an isolated tile',
			titleTextStyle: {bold: false}
        }

		const view = new google.visualization.DataView(data)
		view.setColumns(
			[
				0,
				1,
				{
					calc: "stringify",
					sourceColumn: 1,
					type: "string",
					role: "annotation"
				}
			]
		)

        const chart = new google.visualization.BarChart(document.getElementById('myChart'))

        chart.draw(view, options)
	}
}
