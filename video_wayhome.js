const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1y8xBxGpIt-C23cwG7MDjDkebMlpnBufa4_IzYAo2QyQ/edit?sheet=帰り道&headers=1'

const params = (new URL(document.location)).searchParams
let search_name = params.get('name')

if(!search_name) {
	search_name = ''
}

const queryStatement = 'SELECT A,B,C,D,E WHERE F = "Y"'

google.charts.load('current', {'packages':['table','controls']})
google.charts.setOnLoadCallback(drawDashboard)

function drawDashboard() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery(queryStatement)
	query.send(handleQueryResponse)

	let interviewee		// A 出演者
	let publishedDate	// B 公開日
	let title			// C タイトル
	let url				// D URL
	let imageUrl		// E 画像URL

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

			interviewee = data.getValue(i,0)
			publishedDate = data.getValue(i,1)
			title = data.getValue(i,2)
			url = data.getValue(i,3)
			imageUrl = data.getValue(i,4)

			let formattedImage = getFormattedImage(title,url,imageUrl)
			let formattedInfo = getFormattedInfo(interviewee,publishedDate,title)

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
					label: '',
					placeholder: '概要'
				}
			},
			state: {
				value: search_name
			}
		})

		let dynamicHeight = window.innerHeight + "px"

		const table = new google.visualization.ChartWrapper({
			chartType: 'Table',
			containerId: 'table_div',
			options : {
				allowHtml: true,
				width: '100%',
				height: dynamicHeight,
				page: 'enable',
				pageSize: 50
			}
		})

		const view = new google.visualization.DataView(chartData)

		dashboard.bind([infoFilter],table)
		dashboard.draw(view)
	}
}

function getFormattedImage(title,url,imageUrl) {

	let formattedImage
	const linkIcon = 'img/125_arr_hoso.png'

	formattedImage = '<a href="' + url + '" target="_blank"><img alt="' + title + '" class="rectangle" loading="lazy" src="' + imageUrl + '" onError="this.onerror=null;this.src=\'' + linkIcon + '\'" /></a>'

	return formattedImage
}

function getFormattedInfo(interviewee,publishedDate,title) {

	let formattedInfo

	formattedInfo = publishedDate + '<br>' + interviewee + '<br>' + title

	return formattedInfo
}
