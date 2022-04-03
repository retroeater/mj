const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1HwzdlLSrQHn_MtJmqIdRCDxPv-nq9Yjj_pmbus7jBwM/edit?sheet=動画&headers=1'

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

	let name			// A 名前
	let publishedDate	// B 公開日
	let url				// C URL
	let imageUrl		// D 画像URL
	let relationships	// E 関係者
	let isVisible		// F 表示

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
			publishedDate = data.getValue(i,1)
			url = data.getValue(i,2)
			imageUrl = data.getValue(i,3)
			relationships = data.getValue(i,4)
//			isVisible = data.getValue(i,5)

			let formattedImage = getFormattedImage(name,url,imageUrl)
			let formattedInfo = getFormattedInfo(name,publishedDate,relationships)

			chartData.addRows([
				[
					formattedImage,
					formattedInfo
				]			
			])
		}

		const dashboard = new google.visualization.Dashboard(document.getElementById('dashboard_div'))

		const memberFilter = new google.visualization.ControlWrapper({
			controlType: 'StringFilter',
			containerId: 'member_filter_div',
			options: {
				filterColumnIndex: 1,
				matchType: 'any',
				ui: {
					label: '概要:'
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

		dashboard.bind([memberFilter], table)
		dashboard.draw(view)
	}
}

function getFormattedImage(name,url,imageUrl) {

	let formattedImage
	const linkIcon = 'img/125_arr_hoso.png'

	formattedImage = '<a href="' + url + '" target="_blank" "><img alt="' + name + '" class="videos" loading="lazy" src="' + imageUrl + '" onError="this.onerror=null;this.src=\'' + linkIcon + '\'" /></a>'

	return formattedImage
}

function getFormattedInfo(name,publishedDate,relationships) {

	let formattedInfo

	formattedInfo = publishedDate + '<br>' + name + '<br>' + relationships

	return formattedInfo
}
