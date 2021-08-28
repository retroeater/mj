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
				maxValue: 13,
				textPosition: 'bottom',
				ticks: [{v:1,f:'E'},{v:2,f:'D3'},{v:3,f:'D2'},{v:4,f:'D1'},{v:5,f:'C3'},{v:6,f:'C2'},{v:7,f:'C1'},{v:8,f:'B2'},{v:9,f:'B1'},{v:10,f:'A2'},{v:11,f:'A1'},{v:12,f:'鳳凰位'}]
			},
			vAxis: {
				minValue: 0,
				maxValue: 6,
				textPosition: 'left',
				ticks: [{v:1,f:'C2'},{v:2,f:'C1'},{v:3,f:'B'},{v:4,f:'A'},{v:5,f:'桜花'}]
			},
			sizeAxis:  {
				maxSize: 50,
				minSize: 10
			},
			title: '第16期女流桜花✕第38期前期鳳凰リーグ',
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

	let leagueId = ""
	
	switch(league) {
	case "鳳凰位":
		leagueId = 12
		break
	case "A1":
		leagueId = 11
		break
	case "A2":
		leagueId = 10
		break
	case "B1":
		leagueId = 9
		break
	case "B2":
		leagueId = 8
		break
	case "C1":
		leagueId = 7
		break
	case "C2":
		leagueId = 6
		break
	case "C3":
		leagueId = 5
		break
	case "D1":
		leagueId = 4
		break
	case "D2":
		leagueId = 3
		break
	case "D3":
		leagueId = 2
		break
	case "E":
		leagueId = 1
		break
	}

	return leagueId
}

function getOukaLeagueId(league) {

	let leagueId = ""
	
	switch(league) {
	case "桜花":
		leagueId = 5
		break
	case "A":
		leagueId = 4
		break
	case "B":
		leagueId = 3
		break
	case "C1":
		leagueId = 2
		break
	case "C2":
		leagueId = 1
		break
	}

	return leagueId
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
