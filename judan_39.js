const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=十段39&headers=1'

const params = (new URL(document.location)).searchParams
let search_name = params.get('name')

if(!search_name) {
	search_name = ''
}

const queryStatement = 'SELECT A,B,C,D,E WHERE E = "Y"'

google.charts.load('current', {'packages':['corechart']})
google.charts.setOnLoadCallback(drawChart)

function drawChart() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery(queryStatement)
	query.send(handleQueryResponse)

	let name		// A 名前
	let startRound	// B 参戦
	let endRound	// C 到達
	let eliminated	// D 敗退
	let isVisible	// E 表示

	function handleQueryResponse(response) {

		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const chartData = new google.visualization.DataTable()
		chartData.addColumn('string','名前')
		chartData.addColumn('number','参戦1')
		chartData.addColumn('number','参戦2')
		chartData.addColumn('number','到達1')
		chartData.addColumn('number','到達2')
		chartData.addColumn({type:'string',role:'style'})

		const data = response.getDataTable()

		for(let i = 0; i < data.getNumberOfRows(); i++) {

			name = data.getValue(i,0)
			startRound = data.getValue(i,1)
			endRound = data.getValue(i,2)
			eliminated = data.getValue(i,3)
//			isVisible = data.getValue(i,4)

			let style = getStyle(endRound,eliminated)

			chartData.addRows([
				[
					name,
					startRound,
					startRound,
					endRound,
					endRound,
					style
				]			
			])			
		}
		
		const options = {
			animation: {
				duration: 1000,
				easing: 'out',
				startup: true
			},
			bar: {
				groupWidth: '80%'
			},
			chartArea: {
				left: 80,
				top: 20,
				width: '90%',
				height: '90%'
			},
			legend: {
				position: 'none'
			},
			orientation: 'vertical',
			title: '第39期十段戦',
			titlePosition: 'in',
			candlestick: {
				fallingColor: {
					strokeWidth: 0,
					fill: '#FF6666'
				},
				risingColor: {
					strokeWidth: 0,
					fill: '#6666FF'
				}
			},
			hAxis: {
				ticks: [{v:0,f:'初段'},{v:1,f:'二段'},{v:2,f:'三段'},{v:3,f:'四段'},{v:4,f:'五段'},{v:5,f:'六段'},{v:6,f:'七八段'},{v:7,f:'九段'},{v:8,f:'九段S'},{v:9,f:'B16'},{v:10,f:'準決勝'},{v:11,f:'決勝'},{v:12,f:'十段位'}]
			},
			vAxis: {
				textStyle: {
					fontSize: 10
				}
			}
		}

		const chart = new google.visualization.CandlestickChart(document.getElementById('myChart'))

		chart.draw(chartData, options)
	}
}

function getStyle(endRound,eliminated) {

	let style

	style = 'color: #6666ff'

	if(eliminated) {
		switch(endRound) {
			case 8:
				style = 'color: #222222'
				break
			case 9:
				style = 'color: #444444'
				break
			case 10:
				style = 'color: #666666'
				break
			case 11:
				style = 'color: #888888'
				break
			case 12:
				style = 'color: #aaaaaa'
				break
			case 13:
				style = 'color: #cccccc'
				break
			default:
				style = 'color: #999999'
				break
		}
	}

	return style
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
