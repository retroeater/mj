const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=leagues'

google.charts.load('current', {'packages':['corechart']})
google.charts.setOnLoadCallback(drawChart)

function drawChart() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery('SELECT A,L,K,J,I,H,G,F,E,D,C,B,M,N,O')
	query.send(handleQueryResponse)

	function handleQueryResponse(response) {
		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}
		
		const data = response.getDataTable()
		
        const options = {
			isStacked: true,
			legend: {position: 'bottom'},
			seriesType: 'bars',
			colors: [
				'#CCCCCC', // E
				'#CCCCFF', // D3
				'#CCDDFF', // D2
				'#CCEEFF', // D1
				'#CCFFFF', // C3
				'#DDFFEE', // C2
				'#EEFFDD', // C1
				'#FFFFCC', // B2
				'#FFEECC', // B1
				'#FFDDCC', // A2
				'#FFCCCC', // A1
				'#CC0000', // 石立岳大
				'#009900', // 西川淳
				'#0000CC'  // 平野良栄
			],
			series: {
				11: {type:'line'},
				12: {type:'line'},
				13: {type:'line'},
			},
			interpolateNulls: true
        }

        const chart = new google.visualization.ColumnChart(document.getElementById('myChart'))

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
