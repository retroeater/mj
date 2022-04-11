const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=Mつく&headers=1'

const params = (new URL(document.location)).searchParams
let search_name = params.get('name')

if(!search_name) {
	search_name = ''
}

const queryStatement = 'SELECT A,B,C,D,E,F,G,H,I,J,K,L,M,N,O WHERE O = "Y"'

google.charts.load('current', {'packages':['table','controls']})
google.charts.setOnLoadCallback(drawDashboard)

function drawDashboard() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery(queryStatement)
	query.send(handleQueryResponse)

	let name			// A 名前
	let org				// B 団体
	let publishedDate	// C 公開日
	let url				// D URL
	let imageUrl		// E 画像URL
	let teamName		// F チーム名
	let name1			// G 名前1
	let org1			// H 団体1
	let name2			// I 名前2
	let org2			// J 団体2
	let name3			// K 名前3
	let org3			// L 団体3
	let name4			// M 名前4
	let org4			// N 団体4
	let isVisible		// O 表示

	function handleQueryResponse(response) {

		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const chartData = new google.visualization.DataTable()
		chartData.addColumn('string','動画')
		chartData.addColumn('string','概要')
		chartData.addColumn('string','選手')

		const data = response.getDataTable()

		for(let i = 0; i < data.getNumberOfRows(); i++) {

			name = data.getValue(i,0)
			org = data.getValue(i,1)
			publishedDate = data.getValue(i,2)
			url = data.getValue(i,3)
			imageUrl = data.getValue(i,4)
			teamName = data.getValue(i,5)
			name1 = data.getValue(i,6)
			org1 = data.getValue(i,7)
			name2 = data.getValue(i,8)
			org2 = data.getValue(i,9)
			name3 = data.getValue(i,10)
			org3 = data.getValue(i,11)
			name4 = data.getValue(i,12)
			org4 = data.getValue(i,13)
//			isVisible = data.getValue(i,14)

			let formattedImage = getFormattedImage(name,url,imageUrl)
			let formattedInfo = getFormattedInfo(name,org,publishedDate,teamName)
			let formattedMembers = getFormattedMembers(name1,org1,name2,org2,name3,org3,name4,org4)

			chartData.addRows([
				[
					formattedImage,
					formattedInfo,
					formattedMembers
				]			
			])
		}

		const dashboard = new google.visualization.Dashboard(document.getElementById('dashboard_div'))

		const memberFilter = new google.visualization.ControlWrapper({
			controlType: 'StringFilter',
			containerId: 'member_filter_div',
			options: {
				filterColumnIndex: 2,
				matchType: 'any',
				ui: {
					label: '',
					placeholder: '選手'
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

function getFormattedInfo(name,org,publishedDate,teamName) {

	let formattedInfo

	formattedInfo = publishedDate + '<br>' + name

	if(org) {
		formattedInfo += '（' + org + '）'
	}

	if(teamName) {
		formattedInfo += '<br>' + teamName
	}

	return formattedInfo
}

function getFormattedMembers(name1,org1,name2,org2,name3,org3,name4,org4) {

	let formattedMembers

	formattedMembers = name1 + '（' + org1 + '）<br>' + name2 + '（' + org2 + '）<br>' + name3 + '（' + org3 + '）'

	if(name4) {
		formattedMembers += '<br>' + name4 + '（' + org4 + '）'
	}

	return formattedMembers
}
