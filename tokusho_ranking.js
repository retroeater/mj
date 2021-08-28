const params = (new URL(document.location)).searchParams
let search_division = params.get('division')
let search_name = params.get('name')

if(!search_division) {
	search_division = '通算得点'
}

if(!search_name) {
	search_name = ''
}

const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=特昇&headers=1'
let queryStatement

switch(search_division) {
	case '期最高得点':
		queryStatement = 'SELECT A,H WHERE V = "Y" ORDER BY H DESC LIMIT 100'
		break
	case '節最高得点':
		queryStatement = 'SELECT A,I,J,K,L,M,N,O,P,Q,R,S,T,U WHERE V = "Y"'
		break
	case '期単位浮き率':
		queryStatement = 'SELECT A,H WHERE V = "Y" AND H IS NOT NULL ORDER BY A,H'
		break
	default: // 通算得点
		queryStatement = 'SELECT A,SUM(H) WHERE V = "Y" GROUP BY A ORDER BY SUM(H) DESC LIMIT 50'
		break
}

google.charts.load('current', {'packages':['table','controls']})
google.charts.setOnLoadCallback(drawDashboard)

function drawDashboard() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery(queryStatement)
	query.send(handleQueryResponse)

	let rank
	let name
	let score

	let numberOfDecimalDigits = 1

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
		else if(search_division == '期単位浮き率') {
			data = getSeasonPositiveRate(data)
			numberOfDecimalDigits = 3
		}

		for(let i = 0; i < data.getNumberOfRows(); i++) {

			rank = i+1
			name = data.getValue(i,0)
			score = data.getValue(i,1).toFixed(numberOfDecimalDigits)

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

		for(let section = 1; section < 9; section++) {

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

function getSeasonPositiveRate(data) {

	let seasonPositiveRateData = new google.visualization.DataTable()
	seasonPositiveRateData.addColumn('string','名前')
	seasonPositiveRateData.addColumn('number','節最高得点')
	seasonPositiveRateData.addColumn('number','ソートキー1')
	seasonPositiveRateData.addColumn('number','ソートキー2')

	let previousName
	let numberOfPositiveScores = 0
	let numberOfNegativeScores = 0
	let seasonPositiveRate = 0
	let sortKey1 = 0
	let sortKey2 = 0
	
	for(let i = 0; i < data.getNumberOfRows(); i++) {

		let name = data.getValue(i,0)
		let seasonScore = data.getValue(i,1)

		if(name == previousName) {
			if(seasonScore >= 0) {
				numberOfPositiveScores++
			}
			else {
				numberOfNegativeScores++
			}
		}
		else {
			seasonPositiveRate = numberOfPositiveScores/(numberOfPositiveScores+numberOfNegativeScores)
			sortKey1 = 1 - seasonPositiveRate
			sortKey2 = 100 - (numberOfPositiveScores + numberOfNegativeScores)

			if(numberOfPositiveScores+numberOfNegativeScores >= 5) {
				seasonPositiveRateData.addRows([
					[previousName,seasonPositiveRate,sortKey1,sortKey2]
				])			
			}

			previousName = name
			numberOfPositiveScores = 0
			numberOfNegativeScores = 0

			if(seasonScore >= 0) {
				numberOfPositiveScores++
			}
			else {
				numberOfNegativeScores++
			}
		}
	}
	if(numberOfPositiveScores+numberOfNegativeScores >= 5) {
		seasonPositiveRateData.addRows([
			[previousName,seasonPositiveRate,sortKey1,sortKey2]
		])			
	}

	seasonPositiveRateData.sort([{column:2},{column:3},{column:0}])
	seasonPositiveRateData.removeRows(10,seasonPositiveRateData.getNumberOfRows()-10)

	return seasonPositiveRateData
}
