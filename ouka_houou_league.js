const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=pro&headers=1'

google.charts.load('current', {'packages':['corechart']})
google.charts.setOnLoadCallback(drawChart)

const queryStatement = 'SELECT T,AC,COUNT(T) WHERE Y = "Y" AND T <> "" AND AC <> "" GROUP BY T,AC'

function drawChart() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery(queryStatement)
	query.send(handleQueryResponse)

	function handleQueryResponse(response) {

		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const data = response.getDataTable()

		let chartData = new google.visualization.DataTable()
		chartData.addColumn('string','ID')
		chartData.addColumn('number','鳳凰リーグID')
		chartData.addColumn('number','桜花リーグID')
		chartData.addColumn('string','桜花リーグ')
		chartData.addColumn('number','人数')

		let id
		let hououLeague
		let hououLeagueId
		let oukaLeague
		let oukaLeagueId
		let numberOfPeople

		for(let i = 0; i < data.getNumberOfRows(); i++) {

			idString = String(data.getValue(i,2))
			hououLeague = data.getValue(i,0)
			hououLeagueId = getHououLeagueId(hououLeague)
			oukaLeague = data.getValue(i,1)
			oukaLeagueId = getOukaLeagueId(oukaLeague)
			numberOfPeople = data.getValue(i,2)

			chartData.addRows([
				[
					idString,
					hououLeagueId,
					oukaLeagueId,
					oukaLeague,
					numberOfPeople
				]
			])
		}

		const options = {
			bubble: {
				opacity: 0.8,
				stroke: '#fff',
				textStyle: {
						fontSize: 11
					}
			},
			chartArea: {
				left: 100,
				top: 20,
				width: '100%',
				height: '80%'
			},
			hAxis: {
				direction: 1,
				minValue:  0,
				maxValue: 15,
				textPosition: 'bottom',
				ticks: [{v:1,f:'E3'},{v:2,f:'E2'},{v:3,f:'E1'},{v:4,f:'D3'},{v:5,f:'D2'},{v:6,f:'D1'},{v:7,f:'C3'},{v:8,f:'C2'},{v:9,f:'C1'},{v:10,f:'B2'},{v:11,f:'B1'},{v:12,f:'A2'},{v:13,f:'A1'},{v:14,f:'鳳凰位'}]
			},
			vAxis: {
				minValue: 0,
				maxValue: 7,
				textPosition: 'left',
				ticks: [{v:1,f:'C3'},{v:2,f:'C2'},{v:3,f:'C1'},{v:4,f:'B'},{v:5,f:'A'},{v:6,f:'桜花'}]
			},
			sizeAxis:  {
				maxSize: 50,
				minSize: 10
			},
			title: '第19期女流桜花✕第41期後期鳳凰リーグ',
			titlePosition: 'in',
			tooltip: {
				trigger:  'none'
			}
        }

        const chart = new google.visualization.BubbleChart(document.getElementById('myChart'))

		google.visualization.events.addListener(chart,'select',function() {

			let selection = chart.getSelection()

			if(selection.length > 0) {

				let hououLeague = data.getValue(selection[0].row,0)
				let oukaLeague = data.getValue(selection[0].row,1)

				let url = './jpml_pros.html?league=' + hououLeague + '&ouka=' + oukaLeague

				window.open(url, '_blank')
			}
		})

        chart.draw(chartData, options)
	}
}

function getHououLeagueId(league) {

	const leagueMap = {
		'鳳凰位': 14,
		'A1': 13,
		'A2': 12,
		'B1': 11,
		'B2': 10,
		'C1': 9,
		'C2': 8,
		'C3': 7,
		'D1': 6,
		'D2': 5,
        'D3': 4,
		'E1': 3,
		'E2': 2,
		'E3': 1
    }

	return leagueMap[league] || 0
}

function getOukaLeagueId(league) {

	const leagueMap = {
		'桜花': 6,
		'A': 5,
		'B': 4,
		'C1': 3,
		'C2': 2,
		'C3': 1
    }

	return leagueMap[league] || 0
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
