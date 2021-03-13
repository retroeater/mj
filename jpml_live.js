const params = (new URL(document.location)).searchParams
let search_name = params.get('name')
let search_status = params.get('status')

if(search_name == 'null') {
	search_name = ''
}

if(search_status == 'ALL') {
	search_status = ''
}
else {
	search_status = '未放送'
}

const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=live&headers=1'

google.charts.load('current', {'packages':['table','controls']})
google.charts.setOnLoadCallback(drawDashboard)

function drawDashboard() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery('SELECT A,B,C,D,F,G,H,I,J,K WHERE L = "Y"')
	query.send(handleQueryResponse)
		/*
		0	A	対局者
		1	B	実況
		2	C	解説
		3	D	カテゴリ
		-	E	原題
		4	F	タイトル
		5	G	放送URL
		6	H	放送日
		7	I	開始時刻
		8	J	状況
		9	K	登録日
		-	L	表示
	*/

	function handleQueryResponse(response) {
		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const data = response.getDataTable()

		for(let i = 0; i < data.getNumberOfRows(); i++) {

				// 名前フォーマット
				let formattedName = getFormattedName(data,i)

				// タイトルフォーマット
				let formattedTitle = getFormattedTitle(data,i)

				// 放送日フォーマット
				let formattedAirDate = getFormattedAirDate(data,i)

				// 登録日フォーマット
				let formattedRegistrationDate = getFormattedRegistrationDate(data,i)

				data.setValue(i, 0, formattedName)
				data.setValue(i, 4, formattedTitle)
				data.setValue(i, 6, formattedAirDate)
				data.setValue(i, 9, formattedRegistrationDate)
		}

		const dashboard = new google.visualization.Dashboard(document.getElementById('dashboard_div'))

		const nameFilter = new google.visualization.ControlWrapper({
			controlType: 'StringFilter',
			containerId: 'name_filter_div',
			options: {
				filterColumnIndex: 0,
				matchType: 'any'
			},
			state: {
				value: search_name
			}
		})

		const categoryFilter = new google.visualization.ControlWrapper({
			controlType: 'CategoryFilter',
			containerId: 'category_filter_div',
			options: {
				filterColumnIndex: 1,
				ui: {
					caption: 'カテゴリを絞り込む',
					sortValues: true
				}
			}
		})

		const statusFilter = new google.visualization.ControlWrapper({
			controlType: 'StringFilter',
			containerId: 'status_filter_div',
			options: {
				filterColumnIndex: 5,
				matchType: 'any'
			},
			state: {
				value: search_status
			}
		})

		const table = new google.visualization.ChartWrapper({
					'chartType': 'Table',
					containerId: 'table_div',
			options : {
				allowHtml: true,
				width: '100%',
				height: '100%',
				page: 'enable',
				pageSize: 200,
				showRowNumber: true
			}
		})

		// 必要列のみ表示
		const view = new google.visualization.DataView(data)
		view.setColumns([0,3,4,6,7,8,9])

		dashboard.bind([nameFilter,categoryFilter,statusFilter], table)
		dashboard.draw(view)
	}
}

function getFormattedDate(date) {
	
	let formattedDate = ""

	formattedDate = '<span style="white-space: nowrap">' + date + '</span>' 

	return formattedDate
}

function getFormattedName(data,row_index) {

	let player      = data.getValue(row_index,0)
	let commentator = data.getValue(row_index,1)
	let analyst     = data.getValue(row_index,2)

	let formattedName = ""

	formattedName = player + '<br>（実況：' + commentator + '、解説：' + analyst + '）' 

	return formattedName
}

function getFormattedAirDate(data,rowIndex) {
	
	let airDate = data.getValue(rowIndex,6)

	let formattedAirDate = ""

	formattedAirDate = getFormattedDate(airDate)

	return formattedAirDate
}

function getFormattedRegistrationDate(data,rowIndex) {
	
	let registrationDate = data.getValue(rowIndex,9)

	let formattedRegistrationDate = ""

	if(registrationDate) {
		formattedRegistrationDate = getFormattedDate(registrationDate)
	}		

	return formattedRegistrationDate
}

function getFormattedTitle(data,rowIndex) {

	const title = data.getValue(rowIndex,4)
	const url = data.getValue(rowIndex,5)

	let formattedTitle = ""

		imageFile = ""

	formattedTitle = '<span class="' + title + '"><a href="' + url + '" target="_blank"><img alt="' + title + '" src="img/125_arr_hoso.png" height="45" width="45" /></a> ' + title + '</span>'

	return formattedTitle
}
