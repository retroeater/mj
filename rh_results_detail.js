const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1WxXJJ2vQPfjNsMYT9zBE2UU1Xo7T-PkhWYE6dtWtk50/edit?sheet=成績詳細&headers=1'

const queryStatement = 'SELECT A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W'

google.charts.load('current', {'packages':['table']});
google.charts.setOnLoadCallback(drawTable);

function drawTable() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery(queryStatement)
	query.send(handleQueryResponse)

	function handleQueryResponse(response) {

		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const data = response.getDataTable()

		const table = new google.visualization.Table(document.getElementById('myTable'));

		// 団体名フォーマット
//		const orgFormatter = new google.visualization.PatternFormat('{0}<br>{1}')
//		orgFormatter.format(data,[2,3],2)

		// タイトル名フォーマット
//		const titleFormatter = new google.visualization.PatternFormat('{0}<br>{1}')
//		titleFormatter.format(data,[4,5],4)

		// 対局名フォーマット
		for(let i = 0; i < data.getNumberOfRows(); i++) {
				let twitter_url = data.getValue(i,21)

				if(twitter_url) {
					data.setValue(i,6, data.getValue(i,6) + ' ' + '<a href="' + twitter_url + '" target="_blank"><img alt="Twitter" src="img/twitter.svg" height="16" width="16"><\/a>')
				}
		}

		// 結果フォーマット
//		const resultFormatter = new google.visualization.PatternFormat('{0}<br>{1}')
//		resultFormatter.format(data,[19,20],19)

		const options = {
			allowHtml: true,
			width: '100%',
			height: '100%'
		}

		// 必要列のみ表示
		const view = new google.visualization.DataView(data)
		view.setColumns([0,2,4,6,8,17,18,19])

		table.draw(view, options);
	}
}
