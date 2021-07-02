const params = (new URL(document.location)).searchParams
let search_division = params.get('division')
let search_name = params.get('name')

if(!search_division) {
	search_division = '通算得点'
}

if(!search_name) {
	search_name = ''
}

const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=houou&headers=1'
let queryStatement


switch(search_division) {
	case '期最高得点':
		queryStatement = 'SELECT B,H WHERE V = "Y" ORDER BY H DESC LIMIT 100'
		break
	case '節最高得点':
		queryStatement = 'SELECT B,I,J,K,L,M,N,O,P,Q,R,S,T,U WHERE V = "Y"'
		break
	default: // 通算得点
		queryStatement = 'SELECT B,SUM(H) WHERE V = "Y" GROUP BY B ORDER BY SUM(H) DESC LIMIT 100'
		break
}

google.charts.load('current', {'packages':['table','controls']})
google.charts.setOnLoadCallback(drawDashboard)

function drawDashboard() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery(queryStatement)
	query.send(handleQueryResponse)

	let division	// A 部門
	let rank		// B 順位
	let name		// C 名前
	let score		// D スコア
	let isVisible	// E 表示

	function handleQueryResponse(response) {

		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const chartData = new google.visualization.DataTable()
		chartData.addColumn('number','順位')
		chartData.addColumn('string','名前')
		chartData.addColumn('string',search_division)
		
		let data = response.getDataTable()

		if(search_division == '節最高得点') {
			data = getSectionHighScoreData(data)			
		}

		for(let i = 0; i < data.getNumberOfRows(); i++) {

			rank = i+1
			name = data.getValue(i,0)
			score = data.getValue(i,1).toFixed(1)

			chartData.addRows([
				[
					rank,
					name,
					score
				]			
			])
		}

		const dashboard = new google.visualization.Dashboard(document.getElementById('dashboard_div'))
		const infoFilter = new google.visualization.ControlWrapper({
			controlType: 'StringFilter',
			containerId: 'info_filter_div',
			options: {
				filterColumnIndex: 1,
				matchType: 'any',
				ui: {
					label: '名前:'
				}
			},
			state: {
				value: search_name
			}
		})

		const table = new google.visualization.ChartWrapper({
			chartType: 'Table',
			containerId: 'table_div',
			options : {
				allowHtml: true,
				width: '100%',
				height: '100%'
			}
		})

		const view = new google.visualization.DataView(chartData)

		dashboard.bind([infoFilter], table)
		dashboard.draw(view)
	}
}

function getSectionHighScoreData(data) {

	let sectionHighScoreData = new google.visualization.DataTable()
	sectionHighScoreData.addColumn('string','名前')
	sectionHighScoreData.addColumn('number','節最高得点')
	sectionHighScoreData.addColumn('number','ソートキー')

	for(let i = 0; i < data.getNumberOfRows(); i++) {

		let name = data.getValue(i,0)

		for(let section = 1; section < 14; section++) {

			let sectionScore = data.getValue(i,section)
			
			if(sectionScore > 0) {
				let sortKey = 1000 - sectionScore // sort key for descening order
				sectionHighScoreData.addRows([
					[name,sectionScore,sortKey]
				])
			}
		}
	}

	sectionHighScoreData.sort([{column:2},{column:0}])
	sectionHighScoreData.removeRows(100,sectionHighScoreData.getNumberOfRows()-100)

	return sectionHighScoreData
}
