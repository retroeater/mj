const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=最強戦&headers=1'

const params = (new URL(document.location)).searchParams
let search_name = params.get('name')
let search_tag = params.get('tag')

let queryStatement = 'SELECT A,B,C,D,E,F,G,H,I,J WHERE K = "Y"'

if(search_name) {
	queryStatement += ' AND A = "' + search_name + '"'
}

if(!search_tag) {
	search_tag = ''
}

google.charts.load('current', {'packages':['table','controls']})
google.charts.setOnLoadCallback(drawDashboard)

function drawDashboard() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery(queryStatement)
	query.send(handleQueryResponse)

	let gameDate		// A 対局日
	let fiscalYear		// B fiscalYear
	let gameName		// C 対局
	let gameStage		// D ステージ
	let gameTable		// E 卓
	let playerRank		// F 順位
	let playerResult	// G 結果
	let playerName		// H 名前
	let playerTwitterId	// I Twitter ID
	let playerImageUrl	// J 画像URL
//	let isVisible		// K 表示

	function handleQueryResponse(response) {

		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const chartData = new google.visualization.DataTable()
		chartData.addColumn('string','写真')
		chartData.addColumn('string','概要')
		
		const data = response.getDataTable()

		for(let i = 0; i < data.getNumberOfRows(); i++) {

			gameDate = data.getValue(i,0)
			fiscalYear = data.getValue(i,1)
			gameName = data.getValue(i,2)
			gameStage = data.getValue(i,3)
			gameTable = data.getValue(i,4)
			playerRank = data.getValue(i,5)
			playerResult = data.getValue(i,6)
			playerName = data.getValue(i,7)
			playerTwitterId = data.getValue(i,8)
			playerImageUrl = data.getValue(i,9)
//			isVisible = data.getValue(i,10)

			let formattedTitle = getFormattedTitle(gameDate,fiscalYear,gameName,gameStage,gameTable,playerRank,playerResult,playerName)
			let formattedImage = getFormattedImage(playerName,playerTwitterId,playerImageUrl)

			chartData.addRows([
				[
					formattedImage,
					formattedTitle
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
					label: '',
					placeholder: '概要'
				}
			},
			state: {
				value: search_tag
			}
		})

		const table = new google.visualization.ChartWrapper({
			chartType: 'Table',
			containerId: 'table_div',
			options : {
				allowHtml: true,
				width: '100%',
				height: '100%',
				page: 'enable',
				pageSize: 100
			}
		})

		const view = new google.visualization.DataView(chartData)

		dashboard.bind([infoFilter], table)
		dashboard.draw(view)
	}
}

function getFormattedImage(playerName,playerTwitterId,playerImageUrl) {

	let formattedImage
	const twitterIcon = 'img/twitter.svg'

	if(playerTwitterId) {
		formattedImage = '<a href="https://twitter.com/' + playerTwitterId + '" target="_blank"><img alt="' + playerName + '" class="rectangle" loading="lazy" src="' + playerImageUrl + '" onError="this.onerror=null;this.src=\'' + twitterIcon + '\'" /></a>'
	}
	else if(playerImageUrl) {
		formattedImage = '<img alt="' + playerName + '" class="rectangle" loading="lazy" src="' + playerImageUrl + '" onError="this.onerror=null;this.src=\'\';" />'
	}

	return formattedImage
}

function getFormattedTitle(gameDate,fiscalYear,gameName,gameStage,gameTable,playerRank,playerResult,playerName) {

	let formattedTitle
	let gameTitle

	if(gameDate) {
		gameTitle = gameDate + '<br>' + '麻雀最強戦' + fiscalYear
	}
	else {
		gameTitle = '麻雀最強戦' + fiscalYear
	}

	if(gameTable === '-') {
		gameName += ' ' + gameStage
	}
	else {
		gameName += ' ' + gameStage + ' ' + gameTable + '卓'
	}

	if(playerResult) {
		if(playerRank) {
			playerResult = '<br>' + playerRank + '位' + playerResult
		}
		else {
			playerResult = '<br>'
		}
	}
	else {
		playerResult = ''
	}

	formattedTitle = gameTitle + '<br>' + gameName + '<br>' + playerName + playerResult

	return formattedTitle
}
