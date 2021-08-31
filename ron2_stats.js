const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=ron2&headers=1'

const params = (new URL(document.location)).searchParams
let search_date = params.get('date')
let search_name = params.get('name')

if(!search_date) {
	search_date = '2021-09-01'
}

if(!search_name) {
	search_name = ''
}

let queryStatement = 'SELECT O,P,Q,R,S,T,U,V,W,X,Y,Z,AA,AB,AC,AD,AE,AF,AG,AH,AI WHERE AI = "Y" AND O = "' + search_date + '"'

if(search_name) {
	queryStatement += ' AND Q = "' + search_name + '"'
}

if(search_name) {

	google.charts.load('current', {'packages':['corechart']})
	google.charts.setOnLoadCallback(drawChart)

	function drawChart() {

		const query = new google.visualization.Query(spreadsheet_url)
		query.setQuery(queryStatement)
		query.send(handleQueryResponse)

		function handleQueryResponse(response) {

			if(response.isError()) {
				alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
				return
			}

			const data = response.getDataTable()

			let	riichiRate = data.getValue(0,12).toFixed(2)
			let callingRate = data.getValue(0,13).toFixed(2)
			let winningRate = data.getValue(0,14).toFixed(2)
			let averageWinningPoint = data.getValue(0,15).toFixed(2)
			let dealinRate = data.getValue(0,16).toFixed(2)
			let averageDealinPoint = data.getValue(0,17).toFixed(2)
			let averagePlacement = data.getValue(0,18).toFixed(2)
			let firstOrSecondRate = data.getValue(0,19).toFixed(2)

			let ctx = document.getElementById('myRadarChart').getContext('2d')
			let myChart = new Chart(ctx, {
				type: 'radar',
				data: {
					labels: [
						'平均順位',
						'連帯率',
						'和了率',
						'平均和了点',
						'放銃率',
						'平均放銃点',
						'立直率',
						'副露率'			
					],
					datasets: [{
						label: search_name,
						data: [
							averagePlacement,
							firstOrSecondRate,
							winningRate,
							averageWinningPoint,
							dealinRate,
							averageDealinPoint,
							riichiRate,
							callingRate
						],
						borderWidth: 10
					}]
				},
				options: {
					scales: {
						r: {
							suggestedMin: 30,
							suggestedMax: 70
						}
					}
				}
			})
		}
	}
}

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

		const chartData = new google.visualization.DataTable()
		chartData.addColumn('string','日付')
//		chartData.addColumn('number','ID')
		chartData.addColumn('string','名前')
		chartData.addColumn('string','最終対戦日')
		chartData.addColumn('number','立直率')
		chartData.addColumn('number','副露率')
		chartData.addColumn('number','和了率')
		chartData.addColumn('number','平均和了点')
		chartData.addColumn('number','放銃率')
		chartData.addColumn('number','平均放銃点')
		chartData.addColumn('number','平均順位')
		chartData.addColumn('number','連対率')

		const data = response.getDataTable()

		let	asOfDate			// A 日付
		let id					// B ID
		let name				// C 名前
		let lastPlayedDate		// D 最終対戦日
		let riichiRate			// O 立直率
		let callingRate			// P 副露率
		let winningRate			// Q 和了率
		let averageWinningPoint	// R 平均和了点
		let dealinRate			// S 放銃率
		let averageDealinPoint	// T 平均放銃点
		let averagePlacement	// U 平均順位
		let firstOrSecondRate	// V 連対率

		for(let i = 0; i < data.getNumberOfRows(); i++) {

			asOfDate = data.getValue(i,0)
//			id = data.getValue(i,1)
			name = data.getValue(i,2)
			lastPlayedDate = data.getValue(i,3)
			riichiRate = data.getValue(i,4)
			callingRate = data.getValue(i,5)
			winningRate = data.getValue(i,6)
			averageWinningPoint = data.getValue(i,7)
			dealinRate = data.getValue(i,8)
			averageDealinPoint = data.getValue(i,9)
			averagePlacement = data.getValue(i,10)
			firstOrSecondRate = data.getValue(i,11)
	
			chartData.addRows([
				[
					asOfDate,
//					id,
					name,
					lastPlayedDate,
					riichiRate,
					callingRate,
					winningRate,
					averageWinningPoint,
					dealinRate,
					averageDealinPoint,
					averagePlacement,
					firstOrSecondRate
				]			
			])
		}

		const table = new google.visualization.Table(document.getElementById('myTable'));

		const options = {
			allowHtml: true,
			width: '100%',
			height: '100%'
		}

		const view = new google.visualization.DataView(chartData)

		table.draw(view, options)		
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
