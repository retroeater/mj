const params = (new URL(document.location)).searchParams
let search_name = params.get('name')
let search_class = params.get('class')

if(search_name == 'null') {
	search_name = ''
}

if(!search_class) {
	search_class = ''
}

const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=houou&headers=1'

google.charts.load('current', {'packages':['table','controls']});
google.charts.setOnLoadCallback(drawDashboard)

function drawDashboard() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery('SELECT A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V WHERE V = "Y"')
	query.send(handleQueryResponse)

	function handleQueryResponse(response) {
		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const chartData = new google.visualization.DataTable()
		chartData.addColumn('string','名前')
		chartData.addColumn('string','期')
		chartData.addColumn('string','リーグ')
		chartData.addColumn('number','順位')
		chartData.addColumn('number','合計')
		chartData.addColumn('number','第1節')
		chartData.addColumn('number','第2節')
		chartData.addColumn('number','第3節')
		chartData.addColumn('number','第4節')
		chartData.addColumn('number','第5節')
		chartData.addColumn('number','第6節')
		chartData.addColumn('number','第7節')
		chartData.addColumn('number','第8節')
		chartData.addColumn('number','第9節')
		chartData.addColumn('number','第10節')
		chartData.addColumn('number','第11節')
		chartData.addColumn('number','第12節')
		chartData.addColumn('number','第13節')

		const data = response.getDataTable()

		let	key			// A キー
		let name		// B 名前
		let season		// C 期
		let half		// D 前後期
		let league		// E リーグ
		let leagueId	// F リーグキー
		let rank		// G 順位
		let pointTotal	// H 合計
		let point01		// I 第1節
		let point02		// J 第2節
		let point03		// K 第3節
		let point04		// L 第4節
		let point05		// M 第5節
		let point06		// N 第6節
		let point07		// O 第7節
		let point08		// P 第8節
		let point09		// Q 第9節
		let point10		// R 第10節
		let point11		// S 第11節
		let point12		// T 第12節
		let point13		// U 第13節

		for(let i = 0; i < data.getNumberOfRows(); i++) {

			key = data.getValue(i,0)
			name = data.getValue(i,1)
			season = data.getValue(i,2)
			half = data.getValue(i,3)
			league = data.getValue(i,4)
			leagueId = data.getValue(i,5)
			rank = data.getValue(i,6)
			pointTotal = data.getValue(i,7)
			point01 = data.getValue(i,8)
			point02 = data.getValue(i,9)
			point03 = data.getValue(i,10)
			point04 = data.getValue(i,11)
			point05 = data.getValue(i,12)
			point06 = data.getValue(i,13)
			point07 = data.getValue(i,14)
			point08 = data.getValue(i,15)
			point09 = data.getValue(i,16)
			point10 = data.getValue(i,17)
			point11 = data.getValue(i,18)
			point12 = data.getValue(i,19)
			point13 = data.getValue(i,20)

			let formattedClass =getFormattedClass(season,half)

			chartData.addRows([
				[
					name,
					formattedClass,
					league,
					rank,
					pointTotal,
					point01,
					point02,
					point03,
					point04,
					point05,
					point06,
					point07,
					point08,
					point09,
					point10,
					point11,
					point12,
					point13
				]			
			])
		}

		const dashboard = new google.visualization.Dashboard(document.getElementById('dashboard_div'))

		const nameFilter = new google.visualization.ControlWrapper({
			controlType: 'StringFilter',
			containerId: 'name_filter_div',
			options: {
				filterColumnIndex: 0,
				matchType: 'any',
				ui: {
					label: ' 名前:'
				}
			},
			state: {
					value: search_name
			}
		})

		const classFilter = new google.visualization.ControlWrapper({
			controlType: 'StringFilter',
			containerId: 'class_filter_div',
			options: {
				filterColumnIndex: 1,
				matchType: 'any',
				ui: {
					label: ' 期:'
				}
			},
			state: {
				value: search_class
			}
		})

		const leagueFilter = new google.visualization.ControlWrapper({
			controlType: 'CategoryFilter',
			containerId: 'league_filter_div',
			options: {
				filterColumnIndex: 2,
				matchType: 'any',
				ui: {
					label: ' リーグ:'
				}
			}
		})

		const table = new google.visualization.ChartWrapper({
			'chartType': 'Table',
			containerId: 'myTable',
			options : {
				allowHtml: true,
				page: 'enable',
				pageSize: 500,
				width: '100%',
				height: '100%'
			}
		})

		const view = new google.visualization.DataView(chartData)

		dashboard.bind([nameFilter,classFilter,leagueFilter], table)
		dashboard.draw(view)
	}
}

function getFormattedClass(season,half) {

	let formattedClass

	formattedClass = season + '期' + half + '期'

	return formattedClass
}
