let search_name = ''

const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=books&headers=1'

google.charts.load('current', {'packages':['table','controls']});
google.charts.setOnLoadCallback(drawDashboard)

function drawDashboard() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery('SELECT A,B,C,D,E,F,G,H,I,J,K,L,M WHERE N = "Y"')
	query.send(handleQueryResponse)
	/*
		0	A	著者名
		1	B	著者名かな
		2	C	所属団体
		3	D	所属団体かな
		4	E	ASIN
		5	F	商品URL
		6	G	商品画像URL
		7	H	書籍名
		8	I	出版日
		9	J	Kindle ASIN
		10	K	Kindle URL
		11	L	Unlimited
		12	M	登録日
		-	N	表示
	*/
	function handleQueryResponse(response) {
		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const data = response.getDataTable()

//		const table = new google.visualization.Table(document.getElementById('myTable'));

		for(let i = 0; i < data.getNumberOfRows(); i++) {

				// 著者フォーマット
				let formattedAuthor = getFormattedAuthor(data,i)

				// 商品画像フォーマット
				let formattedProductImage = getFormattedProductImage(data,i)

				// 書籍名フォーマット
				let formattedTitle = getFormattedTitle(data,i)

				data.setValue(i, 0, formattedAuthor)
				data.setValue(i, 5, formattedProductImage)
				data.setValue(i, 7, formattedTitle)
		}

		data.setColumnLabel(0, '著者')
		data.setColumnLabel(5, 'Amazon')
		data.setColumnLabel(7, 'タイトル')
		data.setColumnLabel(8, '出版日')

		const dashboard = new google.visualization.Dashboard(document.getElementById('dashboard_div'))

		const nameFilter = new google.visualization.ControlWrapper({
			controlType: 'StringFilter',
			containerId: 'name_filter_div',
			options: {
				filterColumnIndex: 0,
				matchType: 'any',
				ui: {
					label: ' 著者:'
				}
			},
			state: {
					value: search_name
			}
		})

		const table = new google.visualization.ChartWrapper({
			'chartType': 'Table',
			containerId: 'myTable',
			options : {
				allowHtml: true,
				width: '100%',
				height: '100%',
				sortColumn: 3,
				sortAscending: false				
			}
		})

		// 必要列のみ表示
		const view = new google.visualization.DataView(data)
		view.setColumns([0,5,7,8])

		dashboard.bind([nameFilter], table)
		dashboard.draw(view)
	}
}

function getFormattedAuthor(data,rowIndex) {

	const author           = data.getValue(rowIndex,0)
	const authorKana       = data.getValue(rowIndex,1)

	let formattedAuthor = ""

	formattedAuthor = '<span class="' + authorKana + '">' + author + '</span>'

	return formattedAuthor
}

function getFormattedProductImage(data,rowIndex) {

	const productUrl   = data.getValue(rowIndex,5)
	const productImage = data.getValue(rowIndex,6)
	const title        = data.getValue(rowIndex,7)

	let formattedProductImage = ""

	formattedProductImage = '<a href="' + productUrl + '" target="_blank"><img alt="' + title + '" src="' + productImage + '" /></a>'

	return formattedProductImage
}

function getFormattedTitle(data,rowIndex) {

	const title       = data.getValue(rowIndex,7)
	const kindleUrl   = data.getValue(rowIndex,10)
	const isUnlimited = data.getValue(rowIndex,11)

	let formattedTitle = ""

	formattedTitle = title

	if(isUnlimited) {
		formattedTitle += '<br><a href="' + kindleUrl + '/" target="_blank"><img alt="kindle unlimited" height="18" src="img/ku-logo-orange-black._CB485944605_.png"></a>'
	}

	return formattedTitle
}
