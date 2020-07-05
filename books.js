const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1CJkczeq8nMbxFaf9ZezVakxekPsQ-VFK9pU9ZrEsshg/edit#gid=0'

google.charts.load('current', {'packages':['table']});
google.charts.setOnLoadCallback(drawTable);

function drawTable() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery('SELECT A,B,C,D,E,F,G,H')
	query.send(handleQueryResponse)

	function handleQueryResponse(response) {
		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const data = response.getDataTable()

		const table = new google.visualization.Table(document.getElementById('myTable'));

		// 著者名フォーマット
		const authorFormatter = new google.visualization.PatternFormat('{0} （{1}）<br>{2}')
		authorFormatter.format(data,[0,1,2],0)

		// 商品画像フォーマット
		const imageFormatter = new google.visualization.PatternFormat('<a href="https://www.amazon.co.jp/dp/{0}/" target="_blank"><img alt="{1}" src="{2}" /></a>')
		imageFormatter.format(data,[3,5,4],3)

		// 書籍名フォーマット
		const titleFormatter = new google.visualization.PatternFormat('{0}<br>{1}')
		titleFormatter.format(data,[5,6],5)

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
