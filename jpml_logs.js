const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1y8xBxGpIt-C23cwG7MDjDkebMlpnBufa4_IzYAo2QyQ/edit?sheet=ログ&headers=1'

const params = (new URL(document.location)).searchParams
let search_name = params.get('name')
let search_tag = params.get('tag')

let queryStatement = 'SELECT B,C,D,E,F,G,H,I,J,K WHERE K = "Y"'

if(search_name) {
	queryStatement += ' AND A = "' + search_name + '"'
}

if(!search_tag) {
	search_tag = ''
}

//const queryStatement = 'SELECT B,C,D,E,F,G,H,I,J,K WHERE K = "Y"'

google.charts.load('current', {'packages':['table','controls']})
google.charts.setOnLoadCallback(drawDashboard)

function drawDashboard() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery(queryStatement)
	query.send(handleQueryResponse)

	let twitterUrl		// A Twitter URL
	let twitterImageUrl	// B Twitter 画像URL
	let twitterDate		// C 日付
	let restaurantName	// D 店名
	let menuName		// E メニュー
//	let stationName		// F 駅
//	let categoryName	// G カテゴリ
	let tags			// H タグ
	let restaurantUrl	// I 店URL
//	let isVisible		// J 表示

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

			twitterUrl = data.getValue(i,0)
			twitterImageUrl = data.getValue(i,1)
			twitterDate = data.getValue(i,2)
			restaurantName = data.getValue(i,3)
			menuName = data.getValue(i,4)
//			stationName = data.getValue(i,5)
//			categoryName = data.getValue(i,6)
			tags = data.getValue(i,7)
			restaurantUrl = data.getValue(i,8)
//			isVisible = data.getValue(i,9)

			let formattedTitle = getFormattedTitle(menuName,restaurantName,restaurantUrl,tags,twitterDate)
			let formattedImage = getFormattedImage(restaurantName,twitterUrl,twitterImageUrl)

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

function getFormattedImage(restaurantName,twitterUrl,twitterImageUrl) {

	let formattedImage
	const linkIcon = 'img/125_arr_hoso.png'

	formattedImage = '<a href="' + twitterUrl + '" target="_blank"><img alt="' + restaurantName + '" class="rectangle" loading="lazy" src="' + twitterImageUrl + '" onError="this.onerror=null;this.src=\'' + linkIcon + '\'" /></a>'

	return formattedImage
}

function getFormattedTitle(menuName,restautantName,restaurantUrl,tags,twitterDate) {

	let formattedTitle

	if(restaurantUrl) {
		formattedTitle = twitterDate + '<br>' + menuName + '<br><a href="' + restaurantUrl + '" target="_blank" style="text-decoration: none">' + restautantName + '</a><br>' + tags
	}
	else {
		formattedTitle = twitterDate + '<br>' + menuName + '<br>' + restautantName + '<br>' + tags
	}

	return formattedTitle
}
