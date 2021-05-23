const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=lives&headers=1'

const params = (new URL(document.location)).searchParams
let search_name = params.get('name')

if(!search_name) {
	search_name = ''
}

const queryStatement = 'SELECT A,B,C,D,E,F,G,H,I WHERE I = "Y"'

google.charts.load('current', {'packages':['table','controls']})
google.charts.setOnLoadCallback(drawDashboard)

function drawDashboard() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery(queryStatement)
	query.send(handleQueryResponse)

	let player			// A 対局者
	let commentator		// B 実況
	let analyst			// C 解説
	let originalTitle	// D 原題
	let title			// E タイトル
	let url				// F URL
	let imageUrl		// G 画像URL
	let publishedDate	// H 公開日
	let isVisible		// I 表示

	function handleQueryResponse(response) {

		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const chartData = new google.visualization.DataTable()
		chartData.addColumn('string','動画')
		chartData.addColumn('string','公開日・タイトル・対局者')

		const data = response.getDataTable()

		for(let i = 0; i < data.getNumberOfRows(); i++) {

			player = data.getValue(i,0)
			commentator = data.getValue(i,1)
			analyst = data.getValue(i,2)
//			originalTitle = data.getValue(i,3)
			title = data.getValue(i,4)
			url = data.getValue(i,5)
			imageUrl = data.getValue(i,6)
			publishedDate = data.getValue(i,7)
//			isVisible = data.getValue(i,8)

			let formattedImage = getFormattedImage(title,url,imageUrl)
			let formattedInfo = getFormattedInfo(player,commentator,analyst,title,publishedDate)

			chartData.addRows([
				[
					formattedImage,
					formattedInfo
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
					label: '検索：'
				}
			},
			state: {
				value: search_name
			}
		})

		const table = new google.visualization.ChartWrapper({
					'chartType': 'Table',
					containerId: 'table_div',
			options : {
				allowHtml: true,
				width: '100%',
				height: '100%',
				page: 'enable',
				pageSize: 200
			}
		})

		const view = new google.visualization.DataView(chartData)

		dashboard.bind([infoFilter],table)
		dashboard.draw(view)
	}
}

function getFormattedImage(title,url,imageUrl) {

	let formattedImage

	if(!imageUrl) {
		imageUrl = './img/125_arr_hoso.png'
	}

	formattedImage = '<a href="' + url + '" target="_blank"><img src="' + imageUrl + '" alt="' + title + '" height="90" width="160" onError="this.onerror=null;this.src=\'img/125_arr_hoso.png\'" /></a>'

	return formattedImage
}

function getFormattedInfo(player,commentator,analyst,title,publishedDate) {

	let formattedInfo

	formattedInfo = publishedDate + '<br>' + title + '<br>' + player + '<br>実況：' + commentator + '、解説：' + analyst

	return formattedInfo
}
