const params = (new URL(document.location)).searchParams
let division = params.get('division')

if(!division) {
	division = 'フォロワー数'
}

let sortColumn

switch(division) {
	default: // フォロワー数
		sortColumn = 'D'
		break
}

const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1cMwbIfme5evsxU8LHFkEOPrmuo2wjWMdmUp5XPJOUo4/edit?sheet=TW&headers=1'

const queryStatement = 'SELECT A,B,C,D WHERE E = "Y" ORDER BY ' + sortColumn + ' DESC LIMIT 100'

google.charts.load('current', {'packages':['table']})
google.charts.setOnLoadCallback(drawTable)

function drawTable() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery(queryStatement)
	query.send(handleQueryResponse)

	let name				// A 名前
	let twitterId			// B アカウント名
	let imageUrl			// C 画像URL
	let followerCount		// D フォロワー数

	function handleQueryResponse(response) {

		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const chartData = new google.visualization.DataTable()
		chartData.addColumn('string','アカウント')
		chartData.addColumn('string','概要（' + division + '順）')

		const data = response.getDataTable()

		for(let i = 0; i < data.getNumberOfRows(); i++) {

			name = data.getValue(i,0)
			twitterId = data.getValue(i,1)
			imageUrl = data.getValue(i,2)
			followerCount = data.getValue(i,3)

			let formattedName = getFormattedName(name,twitterId,imageUrl)
			let formattedInfo = getFormattedInfo(name,twitterId,followerCount)

			chartData.addRows([
				[
					formattedName,
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

function getFormattedInfo(name,twitterId,followerCount) {

	let formattedInfo

	formattedInfo = name + '<br>' + '@' + twitterId + '<br>フォロワー数：' + followerCount.toLocaleString()

	return formattedInfo
}

function getFormattedName(name,twitterId,imageUrl) {

	let formattedName
	const twitterIcon = 'img/twitter.svg'

	formattedName = '<a href="https://twitter.com/' + twitterId + '" target="_blank" "><img alt="' + twitterId + '" class="thumbnails" loading="lazy" src="' + imageUrl + '" onError="this.onerror=null;this.src=\'' + twitterIcon + '\'" /></a>'

	return formattedName
}
