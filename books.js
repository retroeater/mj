const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=books&headers=1'

const params = (new URL(document.location)).searchParams
let search_name = params.get('name')

if(!search_name) {
	search_name = ''
}

const queryStatement = 'SELECT A,B,C,D,E,F,G,H,I,J,K,L,M,N WHERE N = "Y"'

google.charts.load('current', {'packages':['table','controls']});
google.charts.setOnLoadCallback(drawDashboard)

function drawDashboard() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery(queryStatement)
	query.send(handleQueryResponse)

	let name			// A 著者名
	let nameKana		// B 著者名かな
	let org				// C 所属団体
	let orgKana			// D 所属団体かな
	let asin			// E ASIN
	let url				// F 商品URL
	let imageUrl		// G 商品画像URL
	let title			// H 書籍名
	let publishedDate	// I 出版日
	let asinKindle		// J Kindle ASIN
	let kindleUrl		// K Kindle URL
	let isUnlimited		// L Unlimited
	let registeredDate	// M 登録日
	let isVisible		// N 表示

	function handleQueryResponse(response) {

		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const chartData = new google.visualization.DataTable()
		chartData.addColumn('string','書籍')
		chartData.addColumn('string','概要')

		const data = response.getDataTable()

		for(let i = 0; i < data.getNumberOfRows(); i++) {

			name = data.getValue(i,0)
//			nameKana = data.getValue(i,1)
//			org = data.getValue(i,2)
//			orgKana = data.getValue(i,3)
//			asin = data.getValue(i,4)
			url = data.getValue(i,5)
			imageUrl = data.getValue(i,6)
			title = data.getValue(i,7)
			publishedDate = data.getValue(i,8)
//			asinKindle = data.getValue(i,9)
			kindleUrl = data.getValue(i,10)
			isUnlimited = data.getValue(i,11)
//			registeredDate = data.getValue(i,12)
//			isVisible = data.getValue(i,13)

			let formattedInfo =getFormattedInfo(name,title,publishedDate,kindleUrl,isUnlimited)
			let formattedImage = getFormattedImage(url,imageUrl,title)

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
					label: '検索:'
				}
			},
			state: {
				value: search_name
			}
		})

		const table = new google.visualization.ChartWrapper({
			chartType: 'Table',
			containerId: 'myTable',
			options : {
				allowHtml: true,
				width: '100%',
				height: '100%',
				sortColumn: 1,
				sortAscending: false				
			}
		})

		const view = new google.visualization.DataView(chartData)

		dashboard.bind([infoFilter], table)
		dashboard.draw(view)
	}
}

function getFormattedImage(url,imageUrl,title) {

	let formattedImage
	const linkIcon = 'img/125_arr_hoso.png'

	formattedImage = '<a href="' + url + '" target="_blank"><img alt="' + title + '" height="75" src="' + imageUrl + '" onError="this.onerror=null;this.src=\'' + linkIcon +'\'" /></a>'

	return formattedImage
}

function getFormattedInfo(name,title,publishedDate,kindleUrl,isUnlimited) {

	let formattedInfo
	let formattedPublishedDate

	formattedPublsihedDate = getFormattedPublishedDate(publishedDate)
	formattedInfo = formattedPublsihedDate + '<br>' + title + '<br>' + name

	if(isUnlimited) {
		formattedInfo += '<br><a href="' + kindleUrl + '/" target="_blank"><img alt="kindle unlimited" height="18" src="img/ku-logo-orange-black._CB485944605_.png"></a>'
	}

	return formattedInfo
}

function getFormattedPublishedDate(publishedDate) {

	let formattedPublishedDate

	if(publishedDate) {
		formattedPublishedDate = publishedDate.getFullYear() + '-' + ('00' + (publishedDate.getMonth()+1)).slice(-2) + '-' + ('00' + publishedDate.getDate()).slice(-2)
	}

	return formattedPublishedDate
}
