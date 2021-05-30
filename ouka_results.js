const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=ouka&headers=1'

const params = (new URL(document.location)).searchParams
let search_name = params.get('name')
let search_class = params.get('class')

if(!search_name) {
	search_name = ''
}

if(!search_class) {
	search_class = ''
}

let queryStatement = 'SELECT A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R WHERE R = "Y"'

if(search_name) {
	queryStatement += ' AND B = "' + search_name + '" ORDER BY C,D'
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
				let score = data.getValue(i,8)

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
		chartData.addColumn('string','リーグ')
		chartData.addColumn('number','順位')
//		chartData.addColumn('string','結果')
		chartData.addColumn('number','合計')
		chartData.addColumn('number','第1節')
		chartData.addColumn('number','第2節')
		chartData.addColumn('number','第3節')
		chartData.addColumn('number','第4節')
		chartData.addColumn('number','第5節')
		chartData.addColumn('number','第6節')
		chartData.addColumn('number','第7節')
		chartData.addColumn('number','第8節')

		const data = response.getDataTable()

		let	key			// A キー
		let name		// B 名前
		let season		// C 期
		let half		// D 前後期
		let league		// E リーグ
		let leagueId	// F リーグキー
		let rank		// G 順位
		let result		// H 結果
		let pointTotal	// I 合計
		let point01		// J 第1節
		let point02		// K 第2節
		let point03		// L 第3節
		let point04		// M 第4節
		let point05		// N 第5節
		let point06		// O 第6節
		let point07		// P 第7節
		let point08		// Q 第8節
		let isVisible	// R 表示

		for(let i = 0; i < data.getNumberOfRows(); i++) {

//			key = data.getValue(i,0)
			name = data.getValue(i,1)
			season = data.getValue(i,2)
//			half = data.getValue(i,3)
			league = data.getValue(i,4)
			leagueId = data.getValue(i,5)
			rank = data.getValue(i,6)
//			result = data.getValue(i,7)
			pointTotal = data.getValue(i,8)
			point01 = data.getValue(i,9)
			point02 = data.getValue(i,10)
			point03 = data.getValue(i,11)
			point04 = data.getValue(i,12)
			point05 = data.getValue(i,13)
			point06 = data.getValue(i,14)
			point07 = data.getValue(i,15)
			point08 = data.getValue(i,16)
//			isVisible = data.getValue(i,17)

			let formattedClass =getFormattedClass(season)

			chartData.addRows([
				[
					name,
					formattedClass,
					league,
					rank,
//					result,
					pointTotal,
					point01,
					point02,
					point03,
					point04,
					point05,
					point06,
					point07,
					point08
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

		const classFilter = new google.visualization.ControlWrapper({
			controlType: 'StringFilter',
			containerId: 'class_filter_div',
			options: {
				filterColumnIndex: 1,
				matchType: 'any',
				ui: {
					label: ' 期:'
				}
			},
			state: {
				value: search_class
			}
		})

		const leagueFilter = new google.visualization.ControlWrapper({
			controlType: 'CategoryFilter',
			containerId: 'league_filter_div',
			options: {
				filterColumnIndex: 2,
				matchType: 'any',
				ui: {
					label: ' リーグ:'
				}
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

		dashboard.bind([nameFilter,classFilter,leagueFilter], table)
		dashboard.draw(view)
	}
}

function getFormattedClass(season) {

	let formattedClass

	formattedClass = season + '期'

	return formattedClass
}
