const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=leagues'

google.charts.load('current', {'packages':['corechart']})
google.charts.setOnLoadCallback(drawChart)

function drawChart() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery('SELECT A,B,C,D,E,F,G,H,I,J,K,L,M,P,N,O')
	query.send(handleQueryResponse)

	function handleQueryResponse(response) {
		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}
		
		const data = response.getDataTable()
		
        const options = {
			animation: {
				duration: 1000,
				easing: 'out',
				startup: true
			},
//			axisTitlePosition: 'out',
			chartArea: {
				left: 20,
				top: 20,
				width: '100%',
				height: '80%'
			},
			colors: [
				'#FFCCCC', // A1
				'#FFDDCC', // A2
				'#FFEECC', // B1
				'#FFFFCC', // B2
				'#EEFFDD', // C1
				'#DDFFEE', // C2
				'#CCFFFF', // C3
				'#CCEEFF', // D1
				'#CCDDFF', // D2
				'#CCCCFF', // D3
				'#CCCCCC', // E
				'#CC0000', // 石立岳大
				'#333333', // 齋藤豪
				'#009900', // 西川淳
				'#0000CC'  // 平野良栄
			],
			curveType:  'function',
			interpolateNulls: true,
			isStacked: true,
			legend: {position: 'bottom'},
			seriesType: 'bars',
			series: {
				11: {type:'line'},
				12: {type:'line'},
				13: {type:'line'},
				14: {type:'line'}
			},
			vAxis: {
				direction: -1,
				textPosition: 'none'
			}
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
