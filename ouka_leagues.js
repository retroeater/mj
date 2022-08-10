const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=桜花&headers=1'

const params = (new URL(document.location)).searchParams
let search_name = params.get('name')

if(!search_name) {
	search_name = '魚谷侑未'
}

//const queryStatement = 'SELECT A,B,C,D,E,F WHERE F > 0'
const queryStatement = 'SELECT A,B,C,D,E,F'

google.charts.load('current', {'packages':['corechart']})
google.charts.setOnLoadCallback(drawChart)

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

		let leagues_01 = ['1',0,0,0,0,null]
		let leagues_02 = ['2',0,0,0,0,null]
		let leagues_03 = ['3',0,0,0,0,null]
		let leagues_04 = ['4',0,0,0,0,null]
		let leagues_05 = ['5',0,0,0,0,null]
		let leagues_06 = ['6',0,0,0,0,null]
		let leagues_07 = ['7',0,0,0,0,null]
		let leagues_08 = ['8',0,0,0,0,null]
		let leagues_09 = ['9',0,0,0,0,null]
		let leagues_10 = ['10',0,0,0,0,null]
		let leagues_11 = ['11',0,0,0,0,null]
		let leagues_12 = ['12',0,0,0,0,null]
		let leagues_13 = ['13',0,0,0,0,null]
		let leagues_14 = ['14',0,0,0,0,null]
		let leagues_15 = ['15',0,0,0,0,null]
		let leagues_16 = ['16',0,0,0,0,null]
		let leagues_17 = ['17',0,0,0,0,null]

		for(let i = 0; i < data.getNumberOfRows(); i++) {

			let name = data.getValue(i,0)
			let class_year = data.getValue(i,1)
			let league = data.getValue(i,3)
			let league_index = data.getValue(i,4)

			if(league != "桜花") {

				switch(class_year) {
					case 1:
						leagues_01[league_index]++
						break
					case 2:
						leagues_02[league_index]++
						break
					case 3:
						leagues_03[league_index]++
						break
					case 4:
						leagues_04[league_index]++
						break
					case 5:
						leagues_05[league_index]++
						break
					case 6:
						leagues_06[league_index]++
						break
					case 7:
						leagues_07[league_index]++
						break
					case 8:
						leagues_08[league_index]++
						break
					case 9:
						leagues_09[league_index]++
						break
					case 10:
						leagues_10[league_index]++
						break
					case 11:
						leagues_11[league_index]++
						break
					case 12:
						leagues_12[league_index]++
						break
					case 13:
						leagues_13[league_index]++
						break
					case 14:
						leagues_14[league_index]++
						break
					case 15:
						leagues_15[league_index]++
						break
					case 16:
						leagues_16[league_index]++
						break
					case 17:
						leagues_17[league_index]++
						break
				}
			}
		}

		let chartData = new google.visualization.DataTable()
		chartData.addColumn('string','期')
		chartData.addColumn('number','A')
		chartData.addColumn('number','B')
		chartData.addColumn('number','C1')
		chartData.addColumn('number','C2')
		chartData.addColumn('number',search_name)

		chartData.addRows([
			leagues_01,
			leagues_02,
			leagues_03,
			leagues_04,
			leagues_05,
			leagues_06,
			leagues_07,
			leagues_08,
			leagues_09,
			leagues_10,
			leagues_11,
			leagues_12,
			leagues_13,
			leagues_14,
			leagues_15,
			leagues_16,
			leagues_17
		])

		let leagueRanks = getLeagueRanks(data,chartData,search_name)

		for(let i = 0; i < leagueRanks.length; i++) {

			let my_class_year = leagueRanks[i][0]
			let my_rank = leagueRanks[i][1]

			for(let j = 0; j < chartData.getNumberOfRows(); j++) {

				let class_year = chartData.getValue(j,0)

				if(my_class_year == class_year) {
					chartData.setValue(j,5,my_rank)
				}
			}	
		}

        const options = {
			animation: {
				duration: 1000,
				easing: 'out',
				startup: true
			},
//			axisTitlePosition: 'out',
			chartArea: {
				left: 20,
				top: 20,
				width: '100%',
				height: '80%'
			},
			colors: [
				'#FFCCCC', // A
				'#FFEECC', // B
				'#EEFFDD', // C1
				'#CCEEFF', // C2
				'#0000CC'  // 名前
			],
			curveType: 'function',
			interpolateNulls: true,
			isStacked: true,
			legend: {
				position: 'bottom'
			},
			seriesType: 'bars',
			series: {
				4: {
					type:'line'
				}
			},
			vAxis: {
				direction: -1,
				textPosition: 'none'
			}
        }

        const chart = new google.visualization.ColumnChart(document.getElementById('myChart'))

        chart.draw(chartData, options)
	}
}

function getLeagueRanks(data,chartData,search_name) {

	let leagueRanks = []
	
	for(let i = 0; i < data.getNumberOfRows(); i++) {

		let name = data.getValue(i,0)
		let class_year = data.getValue(i,1)
		let league = data.getValue(i,3)
		let rank = data.getValue(i,5)

		if(search_name == name) {

			let numberOfPeopleInUpperLeagues = getNumberOfPeopleInUpperLeagues(chartData,class_year,league)
			let leagueRank = numberOfPeopleInUpperLeagues + rank

			leagueRanks.push([class_year,leagueRank])
		}	
	}

	return leagueRanks
}

function getNumberOfPeopleInUpperLeagues(chartData,my_class_year,my_league) {

	let numberOfPeopleInUpperLeagues = 0

	for(let i = 0; i < chartData.getNumberOfRows(); i++) {
		
		let class_year = chartData.getValue(i,0)
		let a = chartData.getValue(i,1)
		let b = chartData.getValue(i,2)
		let c1 = chartData.getValue(i,3)
		let c2 = chartData.getValue(i,4)

		if(my_class_year == class_year) {
		
			switch(my_league) {
				case "A":
					break
				case "B":
					numberOfPeopleInUpperLeagues = a
					break
				case "C1":
					numberOfPeopleInUpperLeagues = a+b
					break
				case "C2":
					numberOfPeopleInUpperLeagues = a+b+c1
					break
			}
		}
	}

	return numberOfPeopleInUpperLeagues
}

(function() {
    let requestId
    window.addEventListener('resize', function() {
        cancelAnimationFrame(requestId)
        requestId = requestAnimationFrame(function() {
            drawChart()
        })
    })
})()
