const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1emupETQw_cM0VtDxm4NAYDBlq8NVbk47O_ENMn5XXn8/edit?sheet=総合成績&headers=1'

const queryStatement = 'SELECT A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q'

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

		// 必要列のみ表示
		const view = new google.visualization.DataView(data)
		view.setColumns([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16])

		const options = {
			allowHtml: true,
			width: '100%',
			height: '100%',
			showRowNumber: false
		}

		table.draw(view, options);
	}
}

const spreadsheet_url_rank = 'https://docs.google.com/spreadsheets/d/1emupETQw_cM0VtDxm4NAYDBlq8NVbk47O_ENMn5XXn8/edit?sheet=順位推移&headers=1'

const rankQueryStatement = 'SELECT A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q'

google.charts.load('current', {'packages':['corechart']})
google.charts.setOnLoadCallback(drawChart)

function drawChart() {

	const query = new google.visualization.Query(spreadsheet_url_rank)
	query.setQuery(rankQueryStatement)
	query.send(handleQueryResponse)

	function handleQueryResponse(response) {
		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}
		
		const data = response.getDataTable()
		
        const options = {
			chartArea: {
				left: 50,
				top: 20,
				width: '100%',
				height: '80%'
			},
			legend: {
				position: 'bottom'
			},
			title: '第38期A2リーグ',
			titlePosition: 'in'
        }

        const chart = new google.visualization.LineChart(document.getElementById('myChart'))

        chart.draw(data, options)
	}
}

(function(){
    let requestId;
    window.addEventListener('resize', function(){
        cancelAnimationFrame(requestId);
        requestId = requestAnimationFrame(function(){
            drawChart();
        })
    })
})()
