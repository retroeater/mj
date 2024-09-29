const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=タイトル&headers=1'

const params = (new URL(document.location)).searchParams
let search_name = params.get('name')
let search_tag = params.get('tag')

let queryStatement = 'SELECT A,B,C,D,E,F WHERE G = "Y"'

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

	let name			// A 名前
	let profileUrl		// B プロフィールURL
	let imageUrl		// C 画像URL
	let rank			// D 順位
	let title			// E タイトル
	let publishedDate	// F 日付
//	let isVisible		// G 表示

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

			name = data.getValue(i,0)
			profileUrl = data.getValue(i,1)
			imageUrl = data.getValue(i,2)
			rank = data.getValue(i,3)
			title = data.getValue(i,4)
			publishedDate = data.getValue(i,5)

			let formattedImage = getFormattedImage(name,profileUrl,imageUrl)
			let formattedTitle = getFormattedTitle(publishedDate,title,rank,name)

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

function getFormattedImage(name,profileUrl,imageUrl) {

	let formattedImage
	const linkIcon = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_200x200.png'

	if(imageUrl) {
		formattedImage = '<img alt="' + name + '" class="rectangle" loading="lazy" src="' + imageUrl + '" onError="this.onerror=null;this.src=\'' + linkIcon + '\'" />'
	}
	else {
		formattedImage = '<img alt="' + name + '" class="rectangle" loading="lazy" src="' + linkIcon + '" onError="this.onerror=null;this.src=\'' + linkIcon + '\'" />'
	}

		if(profileUrl) {
			formattedImage = '<a href="' + profileUrl + '" target="_blank">' + formattedImage + '</a>'
		}

	return formattedImage
}

function getFormattedTitle(publishedDate,title,rank,name) {

	let formattedTitle = ""

	if(publishedDate) {
		formattedTitle = publishedDate + '<br>'
	}

	formattedTitle = formattedTitle + title + '<br>' + name + '<br>' + rank + '位'

	return formattedTitle
}
