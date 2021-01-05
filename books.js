const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=books'

google.charts.load('current', {'packages':['table']});
google.charts.setOnLoadCallback(drawTable);

function drawTable() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery('SELECT A,B,C,D,E,F,G,H,I')
	query.send(handleQueryResponse)

	function handleQueryResponse(response) {
		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const data = response.getDataTable()

		const table = new google.visualization.Table(document.getElementById('myTable'));

		for(let i = 0; i < data.getNumberOfRows(); i++) {

				// 著者名フォーマット
				let formattedAuthor = getFormattedAuthor(data,i)

				// 商品画像フォーマット
				let formattedProductImage = getFormattedProductImage(data,i)

				// 書籍名フォーマット
				let formattedTitle = getFormattedTitle(data,i)

				// 出版日フォーマット
				let formattedPublishedDate = getFormattedPublishedDate(data,i)

				data.setValue(i, 0, formattedAuthor)
				data.setValue(i, 3, formattedProductImage)
				data.setValue(i, 5, formattedTitle)
				data.setValue(i, 7, formattedPublishedDate)
		}









/*

		// 著者名フォーマット
		const authorFormatter = new google.visualization.PatternFormat('{0} （{1}）<br>{2}')
		authorFormatter.format(data,[0,1,2],0)

		// 商品画像フォーマット
		const imageFormatter = new google.visualization.PatternFormat('<a href="https://www.amazon.co.jp/dp/{0}/" target="_blank"><img alt="{1}" src="{2}" /></a>')
		imageFormatter.format(data,[3,5,4],3)

		// 書籍名フォーマット
		const titleFormatter = new google.visualization.PatternFormat('{0}<br>{1}<br><a href="https://www.amazon.co.jp/dp/{2}"><img alt="kindle unlimited" height="18" src="img/ku-logo-orange-black._CB485944605_.png"></a>')
		titleFormatter.format(data,[5,6,8],5)

*/
		// 必要列のみ表示
		const view = new google.visualization.DataView(data)
		view.setColumns([0,3,5,7])

		const options = {
			allowHtml: true,
			width: '100%',
			height: '100%',
			showRowNumber: true,
			sortColumn: 3,
			sortAscending: false
		}

		table.draw(view, options);
	}
}

function getFormattedAuthor(data,row_index) {

	const author_ja_kanji = data.getValue(row_index,0)
	const author_ja_kana  = data.getValue(row_index,1)
	const author_en       = data.getValue(row_index,2)

	let formattedAuthor = ""

	formattedAuthor = author_ja_kanji + '（' + author_ja_kana + '）<br>' + author_en

	return formattedAuthor
}

function getFormattedProductImage(data,row_index) {

	const product_id    = data.getValue(row_index,3)
	const product_image = data.getValue(row_index,4)
	const title_ja      = data.getValue(row_index,5)

	let formattedProductImage = ""

	formattedProductImage = '<a href="https://www.amazon.co.jp/dp/' + product_id + '" target="_blank"><img alt="' + title_ja + '" src="' + product_image + '" /></a>'

	return formattedProductImage
}

function getFormattedTitle(data,row_index) {

	const title_ja  = data.getValue(row_index,5)
	const title_en  = data.getValue(row_index,6)
	const kindle_id = data.getValue(row_index,8)

	let formattedTitle = ""

	formattedTitle = title_ja + '<br>' + title_en

	if(kindle_id) {
		formattedTitle = formattedTitle + '<br><a href="https://www.amazon.co.jp/dp/' + kindle_id + '/" target="_blank"><img alt="kindle unlimited" height="18" src="img/ku-logo-orange-black._CB485944605_.png"></a>'
	}

	return formattedTitle
}

function getFormattedPublishedDate(data,row_index) {

	const published_date = data.getValue(row_index,7)

	let formattedPublishedDate = ""

	formattedPublishedDate = published_date

	return formattedPublishedDate
}
