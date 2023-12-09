const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=タイトル&headers=1'

const params = (new URL(document.location)).searchParams
let search_name = params.get('name')

if(!search_name) {
	search_name = ''
}

const queryStatement = 'SELECT A,B,C,D,E,F,G,H WHERE H = "Y"'

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
	let season			// F 期
	let publishedDate	// G 日付
	let isVisible		// H 表示

	function handleQueryResponse(response) {

		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const chartData = new google.visualization.DataTable()
		chartData.addColumn('string','画像')
		chartData.addColumn('string','名前')
		chartData.addColumn('number','順位')
		chartData.addColumn('string','タイトル')
		chartData.addColumn('number','期')
		chartData.addColumn('string','日付')

		const data = response.getDataTable()

		for(let i = 0; i < data.getNumberOfRows(); i++) {

			name = data.getValue(i,0)
			profileUrl = data.getValue(i,1)
			imageUrl = data.getValue(i,2)
			rank = data.getValue(i,3)
			title = data.getValue(i,4)
			season = data.getValue(i,5)
			publishedDate = data.getValue(i,6)
//			isVisible = data.getValue(i,7)

			let formattedImage = getFormattedImage(name,profileUrl,imageUrl)

			chartData.addRows([
				[
					formattedImage,
					name,
					rank,
					title,
					season,
					publishedDate
				]			
			])
		}

		const dashboard = new google.visualization.Dashboard(document.getElementById('dashboard_div'))

		const nameFilter = new google.visualization.ControlWrapper({
			controlType: 'StringFilter',
			containerId: 'name_filter_div',
			options: {
				filterColumnIndex: 1,
				matchType: 'any',
				ui: {
					label: '',
					placeholder: '名前'
				}
			},
			state: {
				value: search_name
			}
		})

		const titleFilter = new google.visualization.ControlWrapper({
			controlType: 'StringFilter',
			containerId: 'title_filter_div',
			options: {
				filterColumnIndex: 3,
				matchType: 'any',
				ui: {
					label: '',
					placeholder: 'タイトル'
				}
			},
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

		dashboard.bind([nameFilter,titleFilter], table)
		dashboard.draw(view)
	}
}

function getFormattedImage(name,profileUrl,imageUrl) {

	let formattedImage
	let image

	const linkIcon = 'img/125_arr_hoso.png'
	const emptyIcon = 'img/empty.png'

	if(profileUrl) {
		if(imageUrl) {
			image = imageUrl
		}
		else {
			image = linkIcon
		}
		formattedImage = '<a href="' + profileUrl + '" target="_blank" "><img alt="' + name + '" class="rectangle" loading="lazy" src="' + image + '" onError="this.onerror=null;this.src=\'' + linkIcon +'\'" /></a>'
	}
	else {
		image = emptyIcon
		formattedImage = '<img alt="' + name + '" class="rectangle" loading="lazy" src="' + image + '" onError="this.onerror=null;this.src=\'' + emptyIcon +'\'" />'
	}
/*
	if(!imageUrl) {
		imageUrl = linkIcon
	}

	if(profileUrl) {
		formattedImage = '<a href="' + profileUrl + '" target="_blank" "><img alt="' + name + '" class="rectangle" loading="lazy" src="' + imageUrl + '" onError="this.onerror=null;this.src=\'' + linkIcon +'\'" /></a>'
	}
*/
	return formattedImage
}
