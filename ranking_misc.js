const params = (new URL(document.location)).searchParams
let search_division = params.get('division')

if(!search_division) {
	search_division = '出身地'
}

const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=rankings&headers=1'

const queryStatement = 'SELECT A,B,C,D,E WHERE E = "Y" AND A ="【その他】' + search_division + '"'

google.charts.load('current', {'packages':['table']})
google.charts.setOnLoadCallback(drawTable)

function drawTable() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery(queryStatement)
	query.send(handleQueryResponse)

	let division	// A 部門
	let rank		// B 順位
	let name		// C 名前
	let score		// D スコア
	let isVisible	// E 表示

	function handleQueryResponse(response) {

		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const chartData = new google.visualization.DataTable()
		chartData.addColumn('number','順位')
		chartData.addColumn('string','名前')
		chartData.addColumn('number',search_division)
		
		const data = response.getDataTable()

		for(let i = 0; i < data.getNumberOfRows(); i++) {

			division = data.getValue(i,0)
			rank = data.getValue(i,1)
			name = data.getValue(i,2)
			score = data.getValue(i,3)
//			isVisible = data.getValue(i,4)

			chartData.addRows([
				[
					rank,
					name,
					score
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
