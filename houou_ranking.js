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
	case '期単位浮き率':
		queryStatement = 'SELECT B,H WHERE V = "Y" AND H IS NOT NULL ORDER BY B,H'
		break
	case '節最高得点':
		queryStatement = 'SELECT B,I,J,K,L,M,N,O,P,Q,R,S,T,U WHERE V = "Y"'
		break
	case '節単位浮き率':
		queryStatement = 'SELECT B,I,J,K,L,M,N,O,P,Q,R,S,T,U WHERE V = "Y" ORDER BY B'
		break
	case '連続昇級回数':
		queryStatement = 'SELECT B,C,D,W WHERE V = "Y" ORDER BY B,C,D'
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
		else if(search_division == '節単位浮き率') {
			data = getSectionPositiveRateData(data)			
			numberOfDecimalDigits = 3
		}
		else if(search_division == '期単位浮き率') {
			data = getSeasonPositiveRateData(data)
			numberOfDecimalDigits = 3
		}
		else if(search_division == '連続昇級回数') {
			data = getConsecutivePromotionData(data)
			numberOfDecimalDigits = 0
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

function getConsecutivePromotionData(data) {

	let consecutivePromotionData = new google.visualization.DataTable()
	consecutivePromotionData.addColumn('string','名前')
	consecutivePromotionData.addColumn('number','連続昇級回数')
	consecutivePromotionData.addColumn('number','ソートキー')

	let previousName
	let numberOfConsecutivePromotions = 0
	let sortKey = 0
	
	for(let i = 0; i < data.getNumberOfRows(); i++) {

		let name = data.getValue(i,0)
		let season = data.getValue(i,1)
		let half = data.getValue(i,2)
		let result = data.getValue(i,3)

		if(name == previousName) {
			if(result == '昇級') {
				numberOfConsecutivePromotions++
			}
			else {
				if(numberOfConsecutivePromotions >= 3) {
					sortKey = 100 - numberOfConsecutivePromotions
					consecutivePromotionData.addRows([
						[previousName,numberOfConsecutivePromotions,sortKey]
					])
				}
				numberOfConsecutivePromotions = 0
			}
		}
		else {
			if(numberOfConsecutivePromotions >= 3) {
				sortKey = 100 - numberOfConsecutivePromotions
				consecutivePromotionData.addRows([
					[previousName,numberOfConsecutivePromotions,sortKey]
				])
			}

			previousName = name
			numberOfConsecutivePromotions = 0

			if(result == '昇級') {
				numberOfConsecutivePromotions++
			}
		}
	}
	if(numberOfConsecutivePromotions >= 3) {
		sortKey = 100 - numberOfConsecutivePromotions
		consecutivePromotionData.addRows([
			[previousName,numberOfConsecutivePromotions,sortKey]
		])
	}

	consecutivePromotionData.sort([{column:2},{column:0}])

	return consecutivePromotionData
}

function getSectionPositiveRateData(data) {

	let sectionPositiveNegativeData = new google.visualization.DataTable()
	sectionPositiveNegativeData.addColumn('string','名前')
	sectionPositiveNegativeData.addColumn('number','節単位浮き数')
	sectionPositiveNegativeData.addColumn('number','節単位沈み数')

	let sectionPositiveRateData = new google.visualization.DataTable()
	sectionPositiveRateData.addColumn('string','名前')
	sectionPositiveRateData.addColumn('number','節単位浮き率')
	sectionPositiveRateData.addColumn('number','ソートキー1')
	sectionPositiveRateData.addColumn('number','ソートキー2')

	let numberOfPositiveScores = 0
	let numberOfNegativeScores = 0

	for(let i = 0; i < data.getNumberOfRows(); i++) {

		let name = data.getValue(i,0)

		for(let section = 1; section < 14; section++) {

			let sectionScore = data.getValue(i,section)

			if(sectionScore > 0) {
				numberOfPositiveScores++
			}
			else if(sectionScore < 0){
				numberOfNegativeScores++
			}
		}
		sectionPositiveNegativeData.addRows([
			[name,numberOfPositiveScores,numberOfNegativeScores]
		])

		numberOfPositiveScores = 0
		numberOfNegativeScores = 0
	}

	let previousName
	let sectionPositiveRate = 0
	let sortKey1 = 0
	let sortKey2 = 0

	numberOfPositiveScores = 0
	numberOfNegativeScores = 0

	for(let i = 0; i < sectionPositiveNegativeData.getNumberOfRows(); i++) {

		let name = sectionPositiveNegativeData.getValue(i,0)

		if(name == previousName) {
			numberOfPositiveScores = numberOfPositiveScores + sectionPositiveNegativeData.getValue(i,1)
			numberOfNegativeScores = numberOfNegativeScores + sectionPositiveNegativeData.getValue(i,2)
		}
		else {
			sectionPositiveRate = numberOfPositiveScores / (numberOfPositiveScores + numberOfNegativeScores)
			sortKey1 = 1 - sectionPositiveRate
			sortKey2 = 1000 - (numberOfPositiveScores + numberOfNegativeScores)

			if(numberOfPositiveScores + numberOfNegativeScores >= 50) {
				sectionPositiveRateData.addRows([
					[previousName,sectionPositiveRate,sortKey1,sortKey2]
				])
			}

			previousName = name
			numberOfPositiveScores = 0
			numberOfNegativeScores = 0

			numberOfPositiveScores = sectionPositiveNegativeData.getValue(i,1)
			numberOfNegativeScores = sectionPositiveNegativeData.getValue(i,2)
		}
	}
	sectionPositiveRate = numberOfPositiveScores / (numberOfPositiveScores + numberOfNegativeScores)
	sortKey1 = 1 - sectionPositiveRate
	sortKey2 = 1000 - (numberOfPositiveScores + numberOfNegativeScores)

	if(numberOfPositiveScores+numberOfNegativeScores >= 50) {
		sectionPositiveRateData.addRows([
			[previousName,sectionPositiveRate,sortKey1,sortKey2]
		])			
	}

	sectionPositiveRateData.sort([{column:2},{column:3},{column:0}])
	sectionPositiveRateData.removeRows(50,sectionPositiveRateData.getNumberOfRows()-50)

	return sectionPositiveRateData
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

function getSeasonPositiveRateData(data) {

	let seasonPositiveRateData = new google.visualization.DataTable()
	seasonPositiveRateData.addColumn('string','名前')
	seasonPositiveRateData.addColumn('number','期単位浮き率')
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

			if(numberOfPositiveScores+numberOfNegativeScores >= 10) {
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
	if(numberOfPositiveScores+numberOfNegativeScores >= 10) {
		seasonPositiveRateData.addRows([
			[previousName,seasonPositiveRate,sortKey1,sortKey2]
		])			
	}

	seasonPositiveRateData.sort([{column:2},{column:3},{column:0}])
	seasonPositiveRateData.removeRows(100,seasonPositiveRateData.getNumberOfRows()-100)

	return seasonPositiveRateData
}