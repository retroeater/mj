const params = (new URL(document.location)).searchParams
const search_name = params.get('name')

if(search_name == 'null') {
	search_name = ''
}

const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=articles&headers=1'

google.charts.load('current', {'packages':['table','controls']})
google.charts.setOnLoadCallback(drawDashboard)

function drawDashboard() {

	console.log('name :', search_name)

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery('SELECT A,B,C,D,E,F,H,I,J,K WHERE L = "Y"')
	query.send(handleQueryResponse)
		/*
		0	A	名前
		1	B	聞き手
		2	C	カテゴリ
		3	D	タイトル
		4	E	URL
		5	F	公開日
		-	G	原題
		6	H	出典
		7	I	出典URL
		8	J	種別
		9	K	登録日
		-	H	表示
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

				// 公開日フォーマット
				let formattedPublishedDate = getFormattedPublishedDate(data,i)

				// 出典フォーマット
				let formattedSource = getFormattedSource(data,i)

				// 公開日フォーマット
				let formattedRegistrationDate = getFormattedRegistrationDate(data,i)

				data.setValue(i, 0, formattedName)
				data.setValue(i, 3, formattedTitle)
				data.setValue(i, 5, formattedPublishedDate)
				data.setValue(i, 6, formattedSource)
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
					sortValues: false
				}
			},
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
				showRowNumber: true,
				sortColumn: 3,
				sortAscending: false
			}
		})

		// 必要列のみ表示
		const view = new google.visualization.DataView(data)
		view.setColumns([0,2,3,5,6,9])

		dashboard.bind([nameFilter,categoryFilter], table)
		dashboard.draw(view)
	}
}

function getFormattedDate(date) {
	
	let formattedDate = ""

	formattedDate = '<span style="white-space: nowrap">' + date + '</span>' 

	return formattedDate
}

function getFormattedName(data,row_index) {

	let author      = data.getValue(row_index,0)
	let interviewer = data.getValue(row_index,1)

	let formattedName = author

	if(interviewer) {
		formattedName += ' （聞き手：' + interviewer + '）'
	}

	return formattedName
}

function getFormattedPublishedDate(data,rowIndex) {
	
	let publishedDate = data.getValue(rowIndex,5)

	let formattedPublishedDate = ""

	formattedPublishedDate = getFormattedDate(publishedDate)

	return formattedPublishedDate
}

function getFormattedRegistrationDate(data,rowIndex) {
	
	let registrationDate = data.getValue(rowIndex,9)

	let formattedRegistrationDate = ""

	if(registrationDate) {
		formattedRegistrationDate = getFormattedDate(registrationDate)
	}		

	return formattedRegistrationDate
}

function getFormattedSource(data,rowIndex) {

	const source = data.getValue(rowIndex,6)
	const url = data.getValue(rowIndex,7)

	let sortKey = ""
	let formattedSource = ""

	sortKey = source
	formattedSource = '<span class="' + source + '">' + '<a href="' + url + '" target="_blank">' + source + '</a></span>'

	return formattedSource
}

function getFormattedTitle(data,rowIndex) {

	const title = data.getValue(rowIndex,3)
	const url = data.getValue(rowIndex,4)
	const type = data.getValue(rowIndex,8)

	let sortKey = ""
	let formattedTitle = ""
	let imageFile = ""

	if(type == "動画") {
		imageFile = "youtube_social_square_white.png"
	}
	else {
		imageFile = "125_arr_hoso.png"
	}

	formattedTitle = '<span class="' + title + '"><a href="' + url + '" target="_blank"><img alt="' + type + '" src="img/' + imageFile + '" height="45" width="45" /></a> ' + title + '</span>'

	return formattedTitle
}
