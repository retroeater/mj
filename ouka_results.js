const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=桜花&headers=1'

const params = (new URL(document.location)).searchParams
let search_name = params.get('name')
let search_class = params.get('class')

if(!search_name) {
	search_name = ''
}

if(!search_class) {
	search_class = ''
}

let queryStatement = 'SELECT A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U WHERE V = "Y"'

if(search_name) {
	queryStatement += ' AND A = "' + search_name + '" ORDER BY B'
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

				let season = data.getValue(i,1)
				let score = data.getValue(i,7)

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

		let name		// A 名前
		let season		// B 期
//		let half		// C 前後期
		let league		// D リーグ
		let leagueId	// E リーグキー
		let rank		// F 順位
//		let result		// G 結果
		let pointTotal	// H 合計
		let point01		// I 第1節
		let point02		// J 第2節
		let point03		// K 第3節
		let point04		// L 第4節
		let point05		// M 第5節
		let point06		// N 第6節
		let point07		// O 第7節
		let point08		// P 第8節
//		let point09		// Q 第9節
//		let point10		// R 第10節
//		let point11		// S 第11節
//		let point12		// T 第12節
//		let point13		// U 第13節

		for(let i = 0; i < data.getNumberOfRows(); i++) {

			name = data.getValue(i,0)
			season = data.getValue(i,1)
//			half = data.getValue(i,2)
			league = data.getValue(i,3)
			leagueId = data.getValue(i,4)
			rank = data.getValue(i,5)
//			result = data.getValue(i,6)
			pointTotal = data.getValue(i,7)
			point01 = data.getValue(i,8)
			point02 = data.getValue(i,9)
			point03 = data.getValue(i,10)
			point04 = data.getValue(i,11)
			point05 = data.getValue(i,12)
			point06 = data.getValue(i,13)
			point07 = data.getValue(i,14)
			point08 = data.getValue(i,15)
//			point09 = data.getValue(i,16)
//			point10 = data.getValue(i,17)
//			point11 = data.getValue(i,18)
//			point12 = data.getValue(i,19)
//			point13 = data.getValue(i,20)

			let formattedClass = getFormattedClass(season)

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

console.log(season)

	formattedClass = season + '期'

	console.log(formattedClass)


	return formattedClass
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
