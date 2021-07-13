const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=paifu&headers=1'

const params = (new URL(document.location)).searchParams
let search_name = params.get('name')

if(!search_name) {
	search_name = ''
}

const queryStatement = 'SELECT A,B,C,D,E,F,G,H,I,J,K WHERE K = "Y"'

google.charts.load('current', {'packages':['table','controls']})
google.charts.setOnLoadCallback(drawDashboard)

function drawDashboard() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery(queryStatement)
	query.send(handleQueryResponse)

	let name			// A 名前
	let videoUrl		// B 動画URL
	let imageUrl		// C サムネイルURL
	let videoStartTime	// D 動画開始位置
	let game			// E 対局
	let round			// F 場
	let hand			// G 局
	let honba			// H 本場
	let paifuUrl		// H 牌譜URL
	let gameDate		// I 対局日
	let isVisible		// J 表示

	function handleQueryResponse(response) {

		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const chartData = new google.visualization.DataTable()
		chartData.addColumn('string','動画')
		chartData.addColumn('string','牌譜')
		
		const data = response.getDataTable()

		for(let i = 0; i < data.getNumberOfRows(); i++) {

			name = data.getValue(i,0)
			videoUrl = data.getValue(i,1)
			imageUrl = data.getValue(i,2)
			videoStartTime = data.getValue(i,3)
			game = data.getValue(i,4)
			round = data.getValue(i,5)
			hand = data.getValue(i,6)
			honba = data.getValue(i,7)
			paifuUrl = data.getValue(i,8)
			gameDate = data.getValue(i,9)
//			isVisible = data.getValue(i,10)

			let fullHandName = getFullHandName(round,hand,honba)
			let formattedImage = getFormattedImage(videoUrl,imageUrl,videoStartTime,game,fullHandName)
			let formattedTitle = getFormattedTitle(name,game,paifuUrl,gameDate,fullHandName)

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
					label: '検索:'
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

function getFormattedImage(videoUrl,imageUrl,videoStartTime,game,fullHandName) {

	let formattedImage
	const linkIcon = 'img/125_arr_hoso.png'

	formattedImage = '<a href="' + videoUrl + '&t=' + videoStartTime + 's" target="_blank" "><img alt="' + game + ' ' + fullHandName + '" class="videos" loading="lazy" src="' + imageUrl + '" onError="this.onerror=null;this.src=\'' + linkIcon + '\'" /></a>'

	return formattedImage
}

function getFormattedTitle(name,game,paifuUrl,gameDate,fullHandName) {

	let formattedTitle

	formattedTitle = gameDate + '<br>' + game + '<br>' + '<a href="' + paifuUrl + '" target="_blank">'+ fullHandName + '</a><br>' + name

	return formattedTitle
}

function getFullHandName(round,hand,honba) {

	let fullHandName

	fullHandName = round + hand + '局' + honba + '本場'

	return fullHandName
}
