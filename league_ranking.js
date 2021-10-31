const params = (new URL(document.location)).searchParams
const searchMap = getSearchMap(params)

const WORKBOOK_URL = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit'
const ROWS_OF_HEADERS = 1
const SHEET_NAME = searchMap['sheet']

const DEFAULT_RANK_LIMIT = 100
const SORT_KEY_OFFSET = 1000

const dataSourceUrl = WORKBOOK_URL + '?sheet=' + SHEET_NAME + '&headers=' + ROWS_OF_HEADERS
const queryString = getQueryString(searchMap['division'])

google.charts.load('current', {'packages':['table','controls']})
google.charts.setOnLoadCallback(drawDashboard)

function drawDashboard() {

	const query = new google.visualization.Query(dataSourceUrl)
	query.setQuery(queryString)
	query.send(handleQueryResponse)

	function handleQueryResponse(response) {

		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const data = response.getDataTable()
		const chartData = getChartData(searchMap['sheet'],searchMap['division'],data)

		const dashboard = new google.visualization.Dashboard(document.getElementById('dashboard_div'))
		const infoFilter = getStringFilter('info_filter_div',1,'any','名前:',searchMap['name'])
		const table = getTable('table_div',true,'100%','100%')
		const view = new google.visualization.DataView(chartData)

		dashboard.bind([infoFilter], table)
		dashboard.draw(view)
	}
}

function getConsecutivePositiveSeasonData(data,sheet) {

	let consecutivePositiveSeasonData = new google.visualization.DataTable()
	consecutivePositiveSeasonData.addColumn('string','名前')
	consecutivePositiveSeasonData.addColumn('number','期連続浮き回数')
	consecutivePositiveSeasonData.addColumn('number','ソートキー')

	let numberOfMinimumConsecutivePositiveSeasons

	if(sheet == '鳳凰') {
		numberOfMinimumConsecutivePositiveSeasons = 6
	}
	else if(sheet == '桜花') {
		numberOfMinimumConsecutivePositiveSeasons = 3
	}
	else if(sheet == 'JWRC') {
		numberOfMinimumConsecutivePositiveSeasons = 3
	}
	else if(sheet == '特昇') {
		numberOfMinimumConsecutivePositiveSeasons = 3
	}

	let previousName
	let numberOfConsecutivePositive = 0
	let sortKey = 0
	
	for(let i = 0; i < data.getNumberOfRows(); i++) {

		let name = data.getValue(i,0)
		let season = data.getValue(i,1)
		let half = data.getValue(i,2)
		let totalPoint = data.getValue(i,3)

		if(name == previousName) {
			if(totalPoint > 0) {
				numberOfConsecutivePositive++
			}
			else {
				if(numberOfConsecutivePositive >= numberOfMinimumConsecutivePositiveSeasons) {
					sortKey = SORT_KEY_OFFSET - numberOfConsecutivePositive
					consecutivePositiveSeasonData.addRows([
						[previousName,numberOfConsecutivePositive,sortKey]
					])
				}
				numberOfConsecutivePositive = 0
			}
		}
		else {
			if(numberOfConsecutivePositive >= numberOfMinimumConsecutivePositiveSeasons) {
				sortKey = SORT_KEY_OFFSET - numberOfConsecutivePositive
				consecutivePositiveSeasonData.addRows([
					[previousName,numberOfConsecutivePositive,sortKey]
				])
			}

			previousName = name
			numberOfConsecutivePositive = 0

			if(totalPoint > 0) {
				numberOfConsecutivePositive++
			}
		}
	}
	if(numberOfConsecutivePositive >= numberOfMinimumConsecutivePositiveSeasons) {
		sortKey = SORT_KEY_OFFSET - numberOfConsecutivePositive
		consecutivePositiveSeasonData.addRows([
			[previousName,numberOfConsecutivePositive,sortKey]
		])
	}

	consecutivePositiveSeasonData.sort([{column:2},{column:0}])

	return consecutivePositiveSeasonData
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
					sortKey = SORT_KEY_OFFSET - numberOfConsecutivePromotions
					consecutivePromotionData.addRows([
						[previousName,numberOfConsecutivePromotions,sortKey]
					])
				}
				numberOfConsecutivePromotions = 0
			}
		}
		else {
			if(numberOfConsecutivePromotions >= 3) {
				sortKey = SORT_KEY_OFFSET - numberOfConsecutivePromotions
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
		sortKey = SORT_KEY_OFFSET - numberOfConsecutivePromotions
		consecutivePromotionData.addRows([
			[previousName,numberOfConsecutivePromotions,sortKey]
		])
	}

	consecutivePromotionData.sort([{column:2},{column:0}])

	return consecutivePromotionData
}

function getSectionPositiveRateData(data,minimumSections) {

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
			sortKey2 = SORT_KEY_OFFSET - (numberOfPositiveScores + numberOfNegativeScores)

			if(numberOfPositiveScores + numberOfNegativeScores >= minimumSections) {
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
	sortKey2 = SORT_KEY_OFFSET - (numberOfPositiveScores + numberOfNegativeScores)

	if(numberOfPositiveScores+numberOfNegativeScores >= minimumSections) {
		sectionPositiveRateData.addRows([
			[previousName,sectionPositiveRate,sortKey1,sortKey2]
		])			
	}

	sectionPositiveRateData.sort([{column:2},{column:3},{column:0}])

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
				let sortKey = SORT_KEY_OFFSET - sectionScore // sort key for descening order
				sectionHighScoreData.addRows([
					[name,sectionScore,sortKey]
				])
			}
		}
	}

	sectionHighScoreData.sort([{column:2},{column:0}])

	return sectionHighScoreData
}

function getSeasonPositiveRateData(data,minimumSeasons) {

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
			sortKey2 = SORT_KEY_OFFSET - (numberOfPositiveScores + numberOfNegativeScores)

			if(numberOfPositiveScores+numberOfNegativeScores >= minimumSeasons) {
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
	if(numberOfPositiveScores+numberOfNegativeScores >= minimumSeasons) {
		seasonPositiveRateData.addRows([
			[previousName,seasonPositiveRate,sortKey1,sortKey2]
		])			
	}

	seasonPositiveRateData.sort([{column:2},{column:3},{column:0}])

	return seasonPositiveRateData
}

function getTotalScorePerSeasonData(data,minimumSeasons) {

	let totalScorePerSeasonData = new google.visualization.DataTable()
	totalScorePerSeasonData.addColumn('string','名前')
	totalScorePerSeasonData.addColumn('number','通算得点/期')
	totalScorePerSeasonData.addColumn('number','ソートキー')

	let	totalScorePerSeason = 0
	let sortKey = 0

	for(let i = 0; i < data.getNumberOfRows(); i++) {

		let name = data.getValue(i,0)
		let totalScore = data.getValue(i,1)
		let seasons = data.getValue(i,2)

		if((totalScore > 0) && (seasons >= minimumSeasons)) {
			totalScorePerSeason = totalScore / seasons
			sortKey = SORT_KEY_OFFSET - totalScorePerSeason // sort key for descening order

			totalScorePerSeasonData.addRows([
				[name,totalScorePerSeason,sortKey]
			])
		}
	}

	totalScorePerSeasonData.sort([{column:2},{column:0}])

	return totalScorePerSeasonData
}

function getChartData(sheet,division,data) {

	data = getAggregatedData(sheet,division,data)

	let chartData = new google.visualization.DataTable()
	chartData.addColumn('number','順位')
	chartData.addColumn('string','名前')
	chartData.addColumn('string',division)

	const numberOfDecimalDigits = getNumberOfDecimalDigits(division)

	let previousScore
	let previousRank

	for(let i = 0; i < data.getNumberOfRows(); i++) {

		let name = data.getValue(i,0)
		let currentScore = data.getValue(i,1).toFixed(numberOfDecimalDigits)
		let currentRank = i + 1
		let rank = getRank(previousScore,currentScore,previousRank,currentRank)

		chartData.addRows([
			[
				rank,
				name,
				currentScore
			]			
		])

		if(previousRank != rank) {
			previousRank = currentRank
		}
		previousScore = currentScore
	}

	chartData = reduceChartData(sheet,division,chartData)

	return chartData
}

function getNumberOfDecimalDigits(division) {

	let numberOfDecimalDigits = 1

	if((division == '期単位浮き率') || (division == '節単位浮き率')) {
		numberOfDecimalDigits = 3
	}
	else if((division == '連続昇級回数') || (division == '期連続浮き回数')) {
		numberOfDecimalDigits = 0
	}

	return numberOfDecimalDigits
}

function getQueryString(division) {

	let queryString

	if(division == '通算得点') {
		queryString = 'SELECT A,SUM(H) WHERE V = "Y" AND H IS NOT NULL GROUP BY A ORDER BY SUM(H) DESC'
	}
	else if(division == '通算得点/期') {
		queryString = 'SELECT A,SUM(H),COUNT(H) WHERE V = "Y" AND H IS NOT NULL GROUP BY A'
	}
	else if(division == '期最高得点') {
		queryString = 'SELECT A,H WHERE V = "Y" AND H IS NOT NULL ORDER BY H DESC'
	}
	else if(division == '期単位浮き率') {
		queryString = 'SELECT A,H WHERE V = "Y" AND H IS NOT NULL ORDER BY A,H'
	}
	else if(division == '期連続浮き回数') {
		queryString = 'SELECT A,B,C,H WHERE V = "Y" AND H IS NOT NULL ORDER BY A,B,C'
	}
	else if(division == '節最高得点') {
		queryString = 'SELECT A,I,J,K,L,M,N,O,P,Q,R,S,T,U WHERE V = "Y"'
	}
	else if(division == '節単位浮き率') {
		queryString = 'SELECT A,I,J,K,L,M,N,O,P,Q,R,S,T,U WHERE V = "Y" ORDER BY A'
	}
	else if(division == '連続昇級回数') {
		queryString = 'SELECT A,B,C,G WHERE V = "Y" ORDER BY A,B,C'
	}

	return queryString
}

function getSearchMap(params) {

	let searchMap = new Map()

	let sheet = params.get('sheet')
	let division = params.get('division')
	let name = params.get('name')

	if(!sheet) {
		sheet = '鳳凰'
	}

	if(!division) {
		division = '通算得点'
	}

	if(!name) {
		name = ''
	}

	searchMap['sheet'] = sheet
	searchMap['division'] = division
	searchMap['name'] = name

	return searchMap
}

function getAggregatedData(sheet,division,data) {

	let minimumSeasons = getMinimumSeasons(sheet)
	let minimumSections = getMinimumSections(sheet)

	if(division == '通算得点/期') {
		data = getTotalScorePerSeasonData(data,minimumSeasons)
	}
	else if(division == '期単位浮き率') {
		data = getSeasonPositiveRateData(data,minimumSeasons)
	}
	else if(division == '期連続浮き回数') {
		data = getConsecutivePositiveSeasonData(data,sheet)
	}
	else if(division == '節最高得点') {
		data = getSectionHighScoreData(data)			
	}
	else if(division == '節単位浮き率') {
		data = getSectionPositiveRateData(data,minimumSections)	
	}
	else if(division == '連続昇級回数') {
		data = getConsecutivePromotionData(data)
	}

	return data
}

function getRank(previousScore,currentScore,previousRank,currentRank) {

	let rank = currentRank

	if(previousScore == currentScore) {
		rank = previousRank
	}

	return rank
}

function reduceChartData(sheet,division,chartData) {

	let limit = DEFAULT_RANK_LIMIT

	// TODO: Limit以下に同スコアがいる場合の考慮
	if(sheet == '鳳凰') {
		if(division == '節単位浮き率') {
			limit = 50
		}
	}
	else if(sheet == '桜花') {
		if(division == '通算得点') {
			limit = 50
		}		
		else if(division == '通算得点/期') {
			limit = 30
		}
		else if(division == '期単位浮き率') {
			limit = 20
		}
		else if(division == '節単位浮き率') {
			limit = 20
		}
	}
	else if(sheet == 'JWRC') {
		if(division == '通算得点') {
			limit = 50
		}
		else if(division == '通算得点/期') {
			limit = 30
		}
		else if(division == '期単位浮き率') {
			limit = 22
		}
		else if(division == '節単位浮き率') {
			limit = 20
		}
	}
	else if(sheet == '特昇') {
		if(division == '通算得点') {
			limit = 50
		}
		else if(division == '期単位浮き率') {
			limit = 11
		}
		else if(division == '節単位浮き率') {
			limit = 10
		}
	}

	if(chartData.getNumberOfRows() > limit) {
		chartData.removeRows(limit,chartData.getNumberOfRows() - limit)
	}

	return chartData
}

function getStringFilter(containerId,filterColumnIndex,matchType,label,defaultValue) {

	const stringFilter = new google.visualization.ControlWrapper({
		controlType: 'StringFilter',
		containerId: containerId,
		options: {
			filterColumnIndex: filterColumnIndex,
			matchType: matchType,
			ui: {
				label: label
			}
		},
		state: {
			value: defaultValue
		}
	})

	return stringFilter
}

function getTable(containerId,allowHtml,width,height) {

	const table = new google.visualization.ChartWrapper({
		chartType: 'Table',
		containerId: containerId,
		options: {
			allowHtml: allowHtml,
			width: width,
			height: height
		}
	})

	return table
}

function getMinimumSeasons(sheet) {

	let minimumSeasons = 5

	if(sheet == '鳳凰') {
		minimumSeasons = 10
	}

	return minimumSeasons
}

function getMinimumSections(sheet) {

	let minimumSections = 25

	if(sheet == '鳳凰') {
		minimumSections = 50
	}

	return minimumSections
}
