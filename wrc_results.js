const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=wrc&headers=1'

const params = (new URL(document.location)).searchParams
let search_name = params.get('name')

if(!search_name) {
	search_name = ''
}

let queryStatement = 'SELECT A,B,C,D,E,F,G,H,I,J,K WHERE L = "Y"'

if(search_name) {
	queryStatement += ' AND B = "' + search_name + '" ORDER BY C'
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
			chartData.addColumn('string','期')
			chartData.addColumn('number','期初1')
			chartData.addColumn('number','期初2')
			chartData.addColumn('number','期末1')
			chartData.addColumn('number','期末2')

			const data = response.getDataTable()

			let currentTotalScore = 0
			let newTotalScore = 0

			for(let i = 0; i < data.getNumberOfRows(); i++) {

				let season = data.getValue(i,2)
				let score = data.getValue(i,5)

				let formattedClass = getFormattedClass(season)

				newTotalScore = currentTotalScore + score

				chartData.addRows([
					[
						formattedClass,
						currentTotalScore,
						currentTotalScore,
						newTotalScore,
						newTotalScore					
					]			
				])			

				currentTotalScore = newTotalScore
			}
			
			const options = {
				chartArea: {
					left: 20,
					top: 20,
					width: '100%',
					height: '80%'
				},
				legend: {
					position: 'none'
				},
				title: '通算得点：' + newTotalScore.toFixed(1),
				titlePosition: 'in',
				bar: {
					groupWidth: '90%'
				},
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
				vAxis: {
					textPosition: 'in'
				}
			}

			const chart = new google.visualization.CandlestickChart(document.getElementById('myChart'))

			chart.draw(chartData, options)
		}
	}
}

google.charts.load('current', {'packages':['table','controls']});
google.charts.setOnLoadCallback(drawDashboard)

function drawDashboard() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery(queryStatement)
	query.send(handleQueryResponse)

	function handleQueryResponse(response) {
		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const chartData = new google.visualization.DataTable()
		chartData.addColumn('string','名前')
		chartData.addColumn('string','期')
		chartData.addColumn('number','順位')
//		chartData.addColumn('string','結果')
		chartData.addColumn('number','合計')
		chartData.addColumn('number','第1節')
		chartData.addColumn('number','第2節')
		chartData.addColumn('number','第3節')
		chartData.addColumn('number','第4節')
		chartData.addColumn('number','第5節')

		const data = response.getDataTable()

		let	key			// A キー
		let name		// B 名前
		let season		// C 期
		let rank		// D 順位
		let result		// E 結果
		let pointTotal	// F 合計
		let point01		// G 第1節
		let point02		// H 第2節
		let point03		// I 第3節
		let point04		// J 第4節
		let point05		// K 第5節
		let isVisible	// L 表示

		for(let i = 0; i < data.getNumberOfRows(); i++) {

//			key = data.getValue(i,0)
			name = data.getValue(i,1)
			season = data.getValue(i,2)
			rank = data.getValue(i,3)
//			result = data.getValue(i,4)
			pointTotal = data.getValue(i,5)
			point01 = data.getValue(i,6)
			point02 = data.getValue(i,7)
			point03 = data.getValue(i,8)
			point04 = data.getValue(i,9)
			point05 = data.getValue(i,10)
//			isVisible = data.getValue(i,11)

			let formattedClass =getFormattedClass(season)

			chartData.addRows([
				[
					name,
					formattedClass,
					rank,
//					result,
					pointTotal,
					point01,
					point02,
					point03,
					point04,
					point05
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
					label: ' 名前:'
				}
			},
			state: {
					value: search_name
			}
		})

		const table = new google.visualization.ChartWrapper({
			chartType: 'Table',
			containerId: 'myTable',
			options : {
				allowHtml: true,
				page: 'enable',
				pageSize: 100,
				width: '100%',
				height: '100%'
			}
		})

		const view = new google.visualization.DataView(chartData)

		dashboard.bind([nameFilter], table)
		dashboard.draw(view)
	}
}

function getFormattedClass(season) {

	let formattedClass

	formattedClass = season + '期'

	return formattedClass
}
