const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=league-by-class'

google.charts.load('current', {'packages':['corechart']})
google.charts.setOnLoadCallback(drawChart)

function drawChart() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery('SELECT A,B,C,E WHERE E <> 0')
	query.send(handleQueryResponse)

	function handleQueryResponse(response) {
		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}
		
		const data = response.getDataTable()

		
		const options = {
			bubble: {
				textStyle: {fontSize: 11}
			},
			chartArea: {
				left: 20,
				top: 20,
				width: '100%',
				height: '80%'
			},
			colorAxis: {
				legend: {
					position: 'none'
				}
			},
			hAxis: {
				direction: -1,
				maxValue: 35,
				textPosition: 'none'
			},
			vAxis: {
				maxValue: 13,
				textPosition: 'none'
			},
			title: 'リーグ✕期（36期後期時点）',
			titlePosition: 'in'
        }

        const chart = new google.visualization.BubbleChart(document.getElementById('myChart'))

        chart.draw(data, options)
	}
}

(function(){
    let requestId;
    window.addEventListener('resize', function(){
        cancelAnimationFrame(requestId);
        requestId = requestAnimationFrame(function(){
            drawChart();
        })
    })
})()
