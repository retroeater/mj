const params = (new URL(document.location)).searchParams
let search_name = params.get('name')
let search_date = params.get('date')

if(!search_name) {
	search_name = ''
}

if(!search_date) {
	search_date = ''
}

const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1y8xBxGpIt-C23cwG7MDjDkebMlpnBufa4_IzYAo2QyQ/edit?sheet=ロン2&headers=1'

let queryStatement = 'SELECT O,P,Q,R,S,T,U,V,W,X,Y,Z WHERE AI = "Y"'

if(search_name) {
	queryStatement = queryStatement + ' AND Q ="' + search_name + '"'
}

if(search_date) {
	queryStatement = queryStatement + ' AND O ="' + search_date + '"'
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

			const chartData = new google.visualization.DataTable()
			chartData.addColumn('string','日付')
//			chartData.addColumn('number','平均順位')
			chartData.addColumn('number','立直率')
			chartData.addColumn('number','副露率')
			chartData.addColumn('number','和了率')
			chartData.addColumn('number','放銃率')
			chartData.addColumn('number','連帯率')

			const data = response.getDataTable()

			let currentTotalScore = 0
			let newTotalScore = 0

			for(let i = 0; i < data.getNumberOfRows(); i++) {

				let asOfDate = data.getValue(i,0)
				let riichiRate = data.getValue(i,4)
				let callRate = data.getValue(i,5)
				let winnningRate = data.getValue(i,6)
				let dealinRate = data.getValue(i,8)
//				let averagePlacement = data.getValue(i,10)
				let firstOrSecondRate = data.getValue(i,11)

				chartData.addRows([
					[
						asOfDate,
//						averagePlacement,
						riichiRate,
						callRate,
						winnningRate,
						dealinRate,
						firstOrSecondRate
					]
				])
			}
			
			const options = {
				chartArea: {
					left: 20,
					right: 20,
					top: 20,
					width: '100%',
					height: '80%'
				},
				hAxis: {
					direction: -1
				},
				legend: {
					position: 'bottom'
				},
				pointSize: 10,
				title: search_name,
				titlePosition: 'in',
				vAxis: {
					maxValue: 70,
					minValue: 0,
					textPosition: 'in'
				}
			}

			const chart = new google.visualization.LineChart(document.getElementById('myChart'))

			chart.draw(chartData, options)
		}
	}
}

google.charts.load('current', {'packages':['table','controls']})
google.charts.setOnLoadCallback(drawDashboard)

function drawDashboard() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery(queryStatement)
	query.send(handleQueryResponse)

	let asOfDate
	let id
	let name
	let lastUpdatedDate
	let riichiRate
	let callingRate
	let winningRate
	let averageWinningPoint
	let dealinRate
	let averageDealinPoint
	let averagePlacement
	let firstOrSecondRate

	function handleQueryResponse(response) {

		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const chartData = new google.visualization.DataTable()
//		chartData.addColumn('number','ID')
		chartData.addColumn('string','名前')
		chartData.addColumn('string','時点')
		chartData.addColumn('string','平均順位')
		chartData.addColumn('string','連対率')
		chartData.addColumn('string','和了率')
		chartData.addColumn('string','平均和了点')
		chartData.addColumn('string','放銃率')
		chartData.addColumn('string','平均放銃点')
		chartData.addColumn('string','立直率')
		chartData.addColumn('string','副露率')
		chartData.addColumn('string','最終対戦日')
		
		const data = response.getDataTable()

		for(let i = 0; i < data.getNumberOfRows(); i++) {

			asOfDate = data.getValue(i,0)
//			id = data.getValue(i,1)
			name = data.getValue(i,2)
			lastUpdatedDate = data.getValue(i,3)
			riichiRate = data.getValue(i,4).toFixed(2)
			callingRate = data.getValue(i,5).toFixed(2)
			winningRate = data.getValue(i,6).toFixed(2)
			averageWinningPoint = data.getValue(i,7).toLocaleString()
			dealinRate = data.getValue(i,8).toFixed(2)
			averageDealinPoint = data.getValue(i,9).toLocaleString()
			averagePlacement = data.getValue(i,10).toFixed(2)
			firstOrSecondRate = data.getValue(i,11).toFixed(2)

			chartData.addRows([
				[
					name,
					asOfDate,
					averagePlacement,
					firstOrSecondRate,
					winningRate,
					averageWinningPoint,
					dealinRate,
					averageDealinPoint,
					riichiRate,
					callingRate,
					lastUpdatedDate
				]			
			])
		}

		const dashboard = new google.visualization.Dashboard(document.getElementById('dashboard_div'))

		const nameFilter = new google.visualization.ControlWrapper({
			controlType: 'StringFilter',
			containerId: 'name_filter_div',
			options: {
				filterColumnIndex: 0,
				matchType: 'any',
				ui: {
					label: '',
					placeholder: '名前'
				}
			},
			state: {
					value: search_name
			}
		})

		const table = new google.visualization.ChartWrapper({
			'chartType': 'Table',
			containerId: 'myTable',
			options : {
				allowHtml: true,
				page: 'enable',
				pageSize: 500,
				width: '100%',
				height: '100%'
			}
		})

		const view = new google.visualization.DataView(chartData)

		dashboard.bind([nameFilter], table)
		dashboard.draw(view)
	}
}

(function() {
    let requestId
    window.addEventListener('resize', function() {
        cancelAnimationFrame(requestId)
        requestId = requestAnimationFrame(function() {
            drawChart()
        })
    })
})()
