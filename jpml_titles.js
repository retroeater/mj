const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=title&headers=1'

const params = (new URL(document.location)).searchParams
let search_name = params.get('name')

if(!search_name) {
	search_name = ''
}

const queryStatement = 'SELECT A,B,C,D,E,F WHERE G = "Y"'

google.charts.load('current', {'packages':['table','controls']})
google.charts.setOnLoadCallback(drawDashboard)

function drawDashboard() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery(queryStatement)
	query.send(handleQueryResponse)

	function handleQueryResponse(response) {

		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const data = response.getDataTable()

		const dashboard = new google.visualization.Dashboard(document.getElementById('dashboard_div'))

		const nameFilter = new google.visualization.ControlWrapper({
			controlType: 'StringFilter',
			containerId: 'name_filter_div',
			options: {
				filterColumnIndex: 0,
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
				filterColumnIndex: 2,
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
				showRowNumber: true
			}
		})

		// 必要列のみ表示
		const view = new google.visualization.DataView(data)
		view.setColumns([0,1,2,3,4,5])

		dashboard.bind([nameFilter,titleFilter], table)
		dashboard.draw(view)
	}
}
