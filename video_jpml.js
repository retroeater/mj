const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=video&headers=1'

const params = (new URL(document.location)).searchParams
let search_name = params.get('name')

if(!search_name) {
	search_name = ''
}

const queryStatement = 'SELECT A,B,C,D,E,F,G,H,I,J WHERE J = "Y"'

google.charts.load('current', {'packages':['table','controls']})
google.charts.setOnLoadCallback(drawDashboard)

function drawDashboard() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery(queryStatement)
	query.send(handleQueryResponse)

	let name			// A 名前
	let channelName		// B 出典
	let channelUrl		// C 出典URL
	let channelImageUrl	// D 出典画像URL
	let originalTitle	// E 原題
	let title			// F タイトル
	let url				// G URL
	let imageUrl		// H 画像URL
	let publishedDate	// I 公開日
	let isVisible		// J 表示

	function handleQueryResponse(response) {

		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const chartData = new google.visualization.DataTable()
		chartData.addColumn('string','動画')
		chartData.addColumn('string','概要')
		
		const data = response.getDataTable()

		for(let i = 0; i < data.getNumberOfRows(); i++) {

			name = data.getValue(i,0)
			channelName = data.getValue(i,1)
			channelUrl = data.getValue(i,2)
			channelImageUrl = data.getValue(i,3)
//			originalTitle = data.getValue(i,4)
			title = data.getValue(i,5)
			url = data.getValue(i,6)
			imageUrl = data.getValue(i,7)
			publishedDate = data.getValue(i,8)
//			isVisible = data.getValue(i,9)

			let formattedTitle = getFormattedTitle(name,channelName,title,publishedDate)
			let formattedImage = getFormattedImage(title,url,imageUrl)

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

function getFormattedImage(title,url,imageUrl) {

	let formattedImage
	const linkIcon = 'img/125_arr_hoso.png'

	formattedImage = '<a href="' + url + '" target="_blank" "><img alt="' + title + '" class="videos" loading="lazy" src="' + imageUrl + '" onError="this.onerror=null;this.src=\'' + linkIcon + '\'" /></a>'

	return formattedImage
}

function getFormattedTitle(name,channelName,title,publishedDate) {

	let formattedTitle

	formattedTitle = publishedDate + '<br>' + title + '<br>' + channelName + '<br>' + name

	return formattedTitle
}
