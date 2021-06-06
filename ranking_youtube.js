const params = (new URL(document.location)).searchParams
let division = params.get('division')

let sortColumn

if(division == '再生回数') {
	sortColumn = 'H'
}
else if(division == '登録者数') {
	sortColumn = 'G'
}
else {
	division = '動画本数'
	sortColumn = 'F'
}

const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=youtube&headers=1'

const queryStatement = 'SELECT A,B,C,D,E,F,G,H,I WHERE I = "Y" ORDER BY ' + sortColumn + ' DESC LIMIT 10'

google.charts.load('current', {'packages':['table']})
google.charts.setOnLoadCallback(drawTable)

function drawTable() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery(queryStatement)
	query.send(handleQueryResponse)

	let name			// A 名前
	let channelId		// B チャンネルID
	let channelName		// C チャンネル名
	let channelUrl		// D チャンネルURL
	let channelImage	// E チャンネル画像URL
	let videoCount		// F 動画本数
	let subscriberCount	// G 登録者数
	let viewCount		// H 再生回数

	function handleQueryResponse(response) {

		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const chartData = new google.visualization.DataTable()
		chartData.addColumn('string','チャンネル')
		chartData.addColumn('string','概要（' + division + '順）')

		const data = response.getDataTable()

		for(let i = 0; i < data.getNumberOfRows(); i++) {

			name = data.getValue(i,0)
			channelId = data.getValue(i,1)
			channelName = data.getValue(i,2)
			channelUrl = data.getValue(i,3)
			channelImageUrl = data.getValue(i,4)
			videoCount = data.getValue(i,5).toLocaleString()
			subscriberCount = data.getValue(i,6).toLocaleString()
			viewCount = data.getValue(i,7).toLocaleString()

			let formattedChannel = getFormattedChannel(channelName,channelUrl,channelImageUrl)
			let formattedInfo = getFormattedInfo(name,viewCount,subscriberCount,videoCount)

			chartData.addRows([
				[
					formattedChannel,
					formattedInfo
				]			
			])
		}

		const table = new google.visualization.Table(document.getElementById('table_div'))

		const view = new google.visualization.DataView(chartData)

		const options = {
			allowHtml: true,
			width: '100%',
			height: '100%',
			showRowNumber: false
		}

		table.draw(view, options)
	}
}

function getFormattedChannel(channelName,channelUrl,channelImageUrl) {

	let formattedChannel

	formattedChannel = '<a href="' + channelUrl + '" target="_blank" "><img alt="' + channelName + '" class="thumbnails" loading="lazy" src="' + channelImageUrl + '" onError="this.onerror=null;this.src=\'img/125_arr_hoso.png\'" /></a>'

	return formattedChannel
}

function getFormattedInfo(name,viewCount,subscriberCount,videoCount) {

	let formattedInfo

	formattedInfo = name + '<br>動画本数：' + videoCount + '<br>登録者数：' + subscriberCount + '<br>再生回数：' + viewCount

	return formattedInfo
}
