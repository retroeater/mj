const params = (new URL(document.location)).searchParams
let division = params.get('division')

if(!division) {
	division = '平均順位'
}

const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=ron2&headers=1'

let sortColumn
let sortOrder

switch(division) {
	case '平均順位':
		sortColumn = 'Y'
		sortOrder = 'ASC'
		break
	case '連対率':
		sortColumn = 'Z'
		sortOrder = 'DESC'
		break
	case '和了率':
		sortColumn = 'U'
		sortOrder = 'DESC'
		break
	case '平均和了点':
		sortColumn = 'V'
		sortOrder = 'DESC'
		break
	case '放銃率':
		sortColumn = 'W'
		sortOrder = 'ASC'
		break
	case '平均放銃点':
		sortColumn = 'X'
		sortOrder = 'ASC'
		break
	case '立直率':
		sortColumn = 'S'
		sortOrder = 'DESC'
		break
	case '副露率':
		sortColumn = 'T'
		sortOrder = 'DESC'
		break
	default: // 平均順位
		sortColumn = 'Y'
		sortOrder = 'ASC'
		break
}

let queryStatement = 'SELECT O,P,Q,R,' + sortColumn + ' WHERE AI = "Y" ORDER BY ' + sortColumn + ' ' + sortOrder + ', O DESC, Q ASC LIMIT 100'

console.log(queryStatement)

google.charts.load('current', {'packages':['table']})
google.charts.setOnLoadCallback(drawTable)

function drawTable() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery(queryStatement)
	query.send(handleQueryResponse)

	let asOfDate			// O 日付
	let id					// P ID	
	let name				// Q 名前
	let lastUpdatedDate		// R 最終対戦日
	let value				// S~Z

	function handleQueryResponse(response) {

		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const chartData = new google.visualization.DataTable()
		chartData.addColumn('number','順位')
		chartData.addColumn('string','名前')
		chartData.addColumn('string',division)
		chartData.addColumn('string','時点')

		const data = response.getDataTable()

		for(let i = 0; i < data.getNumberOfRows(); i++) {

			asOfDate = data.getValue(i,0)
//			id = data.getValue(i,1)
			name = data.getValue(i,2)
//			lastUpdatedDate = data.getValue(i,3)
			value = data.getValue(i,4).toFixed(2)

			chartData.addRows([
				[
					i+1,
					name,
					value,
					asOfDate
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
