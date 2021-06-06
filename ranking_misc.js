const params = (new URL(document.location)).searchParams
let division = params.get('division')

if(!division) {
	division = '出身地'
}

const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=rankings&headers=1'

const queryStatement = 'SELECT A,B,C,D,E WHERE E = "Y" AND A ="【その他】' + division + '"'

google.charts.load('current', {'packages':['table']})
google.charts.setOnLoadCallback(drawTable)

function drawTable() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery(queryStatement)
	query.send(handleQueryResponse)

	let rank		// B 順位
	let name		// C 部門
	let score		// D スコア

	function handleQueryResponse(response) {

		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const chartData = new google.visualization.DataTable()
		chartData.addColumn('number','順位')
		chartData.addColumn('string',division)
		chartData.addColumn('number','人数')
		
		const data = response.getDataTable()

		for(let i = 0; i < data.getNumberOfRows(); i++) {

			rank = data.getValue(i,1)
			name = data.getValue(i,2)
			score = data.getValue(i,3)

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
