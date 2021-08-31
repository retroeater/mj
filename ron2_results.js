const params = (new URL(document.location)).searchParams
let search_date = params.get('date')

if(!search_date) {
	search_date = '2021-09-01'
}

const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=ron2&headers=1'

const queryStatement = 'SELECT P,Q,R,S,T,U,V,W,X,Y,Z WHERE AI = "Y" AND O = "' + search_date + '"' 

google.charts.load('current', {'packages':['table']});
google.charts.setOnLoadCallback(drawTable);

function drawTable() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery(queryStatement)
	query.send(handleQueryResponse)

	let id
	let name
	let lastUpdatedDate
	let riichiRate
	let callingRate
	let winningRate
	let averageWinningPoint
	let dealinRate
	let averageDealinPoint
	let averagePlacement
	let firstOrSecondRate

	function handleQueryResponse(response) {

		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const chartData = new google.visualization.DataTable()
//		chartData.addColumn('number','ID')
		chartData.addColumn('string',search_date+'時点')
		chartData.addColumn('string','平均順位')
		chartData.addColumn('string','連対率')
		chartData.addColumn('string','和了率')
		chartData.addColumn('string','平均和了点')
		chartData.addColumn('string','放銃率')
		chartData.addColumn('string','平均放銃点')
		chartData.addColumn('string','リーチ率')
		chartData.addColumn('string','副露率')
		chartData.addColumn('string','最終対戦日')
		
		const data = response.getDataTable()

		for(let i = 0; i < data.getNumberOfRows(); i++) {

//			id = data.getValue(i,0)
			name = data.getValue(i,1)
			lastUpdatedDate = data.getValue(i,2)
			riichiRate = data.getValue(i,3).toFixed(2)
			callingRate = data.getValue(i,4).toFixed(2)
			winningRate = data.getValue(i,5).toFixed(2)
			averageWinningPoint = data.getValue(i,6).toLocaleString()
			dealinRate = data.getValue(i,7).toFixed(2)
			averageDealinPoint = data.getValue(i,8).toLocaleString()
			averagePlacement = data.getValue(i,9).toFixed(2)
			firstOrSecondRate = data.getValue(i,10).toFixed(2)

			chartData.addRows([
				[
					name,
					averagePlacement,
					firstOrSecondRate,
					winningRate,
					averageWinningPoint,
					dealinRate,
					averageDealinPoint,
					riichiRate,
					callingRate,
					lastUpdatedDate
				]			
			])
		}

		const table = new google.visualization.Table(document.getElementById('myTable'));

		const view = new google.visualization.DataView(chartData)

		const options = {
			allowHtml: true,
			width: '100%',
			height: '100%',
			showRowNumber: false,
			sortColumn: 1,
			sortAscending: true
		}

		table.draw(view, options);
	}
}
