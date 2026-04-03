const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1y8xBxGpIt-C23cwG7MDjDkebMlpnBufa4_IzYAo2QyQ/edit?sheet=Ampai&headers=1'

const params = (new URL(document.location)).searchParams
let search_name = params.get('name')
let search_tag = params.get('tag')

let queryStatement = 'SELECT A,B,C'

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

	let playerName	// A 選手名
	let league		// B リーグ
	let ampaiUrl	// C Ampai URL

	function handleQueryResponse(response) {

		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const chartData = new google.visualization.DataTable()
		chartData.addColumn('string','名前')
		chartData.addColumn('string','リーグ')
		
		const data = response.getDataTable()

		for(let i = 0; i < data.getNumberOfRows(); i++) {

			playerName = data.getValue(i,0)
			league = data.getValue(i,1)
			ampaiUrl = data.getValue(i,2)

			let formattedLeague = getFormattedLeague(league,ampaiUrl)

			chartData.addRows([
				[
					playerName,
					formattedLeague
				]			
			])
		}

		const dashboard = new google.visualization.Dashboard(document.getElementById('dashboard_div'))

		const infoFilter = new google.visualization.ControlWrapper({
			controlType: 'StringFilter',
			containerId: 'info_filter_div',
			options: {
				filterColumnIndex: 0,
				matchType: 'any',
				ui: {
					label: '',
					placeholder: 'Search'
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
				pageSize: 200
			}
		})

		const view = new google.visualization.DataView(chartData)

		dashboard.bind([infoFilter], table)
		dashboard.draw(view)
	}
}

function getFormattedLeague(league,ampaiUrl) {

	let formattedLeague

	formattedLeague = '<a href="' + ampaiUrl + '" target="_blank">' + league + '</a>'

	return formattedLeague
}
