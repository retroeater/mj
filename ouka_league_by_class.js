const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=pro&headers=1'

google.charts.load('current', {'packages':['corechart']})
google.charts.setOnLoadCallback(drawChart)

const queryStatement = 'SELECT I,AC,COUNT(I) WHERE Y = "Y" AND I > 0 AND AC <> "" GROUP BY I,AC'

function drawChart() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery(queryStatement)
	query.send(handleQueryResponse)

	function handleQueryResponse(response) {

		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		let chartData = new google.visualization.DataTable()
		chartData.addColumn('string','ID')
		chartData.addColumn('number','期')
		chartData.addColumn('number','リーグID')
		chartData.addColumn('string','リーグ')
		chartData.addColumn('number','人数')

		const data = response.getDataTable()

		let id
		let proClass
		let leagueId
		let league
		let numberOfPeople

		for(let i = 0; i < data.getNumberOfRows(); i++) {

			idString = String(data.getValue(i,2))
			proClass = data.getValue(i,0)
			league = data.getValue(i,1)
			leagueId = getLeagueId(league)
			numberOfPeople = data.getValue(i,2)

			chartData.addRows([
				[
					idString,
					proClass,
					leagueId,
					league,
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
				direction: -1,
				minValue:  0,
				maxValue: 38,
				textPosition: 'bottom',
				ticks: [{v:1,f:'1期'},{v:2,f:'2期'},{v:3,f:'3期'},{v:4,f:'4期'},{v:5,f:'5期'},{v:6,f:'6期'},{v:7,f:'7期'},{v:8,f:'8期'},{v:9,f:'9期'},{v:10,f:'10期'},{v:11,f:'11期'},{v:12,f:'12期'},{v:13,f:'13期'},{v:14,f:'14期'},{v:15,f:'15期'},{v:16,f:'16期'},{v:17,f:'17期'},{v:18,f:'18期'},{v:19,f:'19期'},{v:20,f:'20期'},{v:21,f:'21期'},{v:22,f:'22期'},{v:23,f:'23期'},{v:24,f:'24期'},{v:25,f:'25期'},{v:26,f:'26期'},{v:27,f:'27期'},{v:28,f:'28期'},{v:29,f:'29期'},{v:30,f:'30期'},{v:31,f:'31期'},{v:32,f:'32期'},{v:33,f:'33期'},{v:34,f:'34期'},{v:35,f:'35期'},{v:36,f:'36期'},{v:37,f:'37期'}]
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
			title: 'リーグ✕期（16期時点）',
			titlePosition: 'in',
			tooltip: {
				trigger:  'none'
			}
        }

        const chart = new google.visualization.BubbleChart(document.getElementById('myChart'))

		google.visualization.events.addListener(chart,'select',function() {

			let selection = chart.getSelection()

			if(selection.length > 0) {

				let proClass = data.getValue(selection[0].row,0)
				let league = data.getValue(selection[0].row,1)
				let joined = proClass + 1984

				let url = './jpml_pros.html?joined=' + joined + '&ouka=' + league

				window.open(url, '_blank')
			}
		})

        chart.draw(chartData, options)
	}
}

function getLeagueId(league) {

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
