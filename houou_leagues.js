const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=鳳凰&headers=1'

const params = (new URL(document.location)).searchParams
let search_name = params.get('name')

if(!search_name) {
	search_name = '佐々木寿人'
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

	let leagues_17_2 = ['17後',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_18_1 = ['18前',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_18_2 = ['18後',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_19_1 = ['19前',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_19_2 = ['19後',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_20_1 = ['20前',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_20_2 = ['20後',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_21_1 = ['21前',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_21_2 = ['21後',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_22_1 = ['22前',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_22_2 = ['22後',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_23_1 = ['23前',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_23_2 = ['23後',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_24_1 = ['24前',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_24_2 = ['24後',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_25_1 = ['25前',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_25_2 = ['25後',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_26_1 = ['26前',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_26_2 = ['26後',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_27_1 = ['27前',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_27_2 = ['27後',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_28_1 = ['28前',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_28_2 = ['28後',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_29_1 = ['29前',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_29_2 = ['29後',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_30_1 = ['30前',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_30_2 = ['30後',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_31_1 = ['31前',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_31_2 = ['31後',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_32_1 = ['32前',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_32_2 = ['32後',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_33_1 = ['33前',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_33_2 = ['33後',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_34_1 = ['34前',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_34_2 = ['34後',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_35_1 = ['35前',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_35_2 = ['35後',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_36_1 = ['36前',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_36_2 = ['36後',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_37_1 = ['37前',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_37_2 = ['37後',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_38_1 = ['38前',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_38_2 = ['38後',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_39_1 = ['39前',0,0,0,0,0,0,0,0,0,0,0,0,null]
	let leagues_39_2 = ['39後',0,0,0,0,0,0,0,0,0,0,0,0,null]

		for(let i = 0; i < data.getNumberOfRows(); i++) {

			let name = data.getValue(i,0)
			let class_year = data.getValue(i,1)
			let class_period = data.getValue(i,2)
			let league = data.getValue(i,3)
			let league_index = data.getValue(i,4)

			let class_year_period = class_year + class_period

			if(league != "鳳凰位") {

				switch(class_year_period) {
					case "17後":
						leagues_17_2[league_index]++
						break
					case "18前":
						leagues_18_1[league_index]++
						break
					case "18後":
						leagues_18_2[league_index]++
						break
					case "19前":
						leagues_19_1[league_index]++
						break
					case "19後":
						leagues_19_2[league_index]++
						break
					case "20前":
						leagues_20_1[league_index]++
						break
					case "20後":
						leagues_20_2[league_index]++
						break
					case "21前":
						leagues_21_1[league_index]++
						break
					case "21後":
						leagues_21_2[league_index]++
						break
					case "22前":
						leagues_22_1[league_index]++
						break
					case "22後":
						leagues_22_2[league_index]++
						break
					case "23前":
						leagues_23_1[league_index]++
						break
					case "23後":
						leagues_23_2[league_index]++
						break
					case "24前":
						leagues_24_1[league_index]++
						break
					case "24後":
						leagues_24_2[league_index]++
						break
					case "25前":
						leagues_25_1[league_index]++
						break
					case "25後":
						leagues_25_2[league_index]++
						break
					case "26前":
						leagues_26_1[league_index]++
						break
					case "26後":
						leagues_26_2[league_index]++
						break
					case "27前":
						leagues_27_1[league_index]++
						break
					case "27後":
						leagues_27_2[league_index]++
						break
					case "28前":
						leagues_28_1[league_index]++
						break
					case "28後":
						leagues_28_2[league_index]++
						break
					case "29前":
						leagues_29_1[league_index]++
						break
					case "29後":
						leagues_29_2[league_index]++
						break
					case "30前":
						leagues_30_1[league_index]++
						break
					case "30後":
						leagues_30_2[league_index]++
						break
					case "31前":
						leagues_31_1[league_index]++
						break
					case "31後":
						leagues_31_2[league_index]++
						break
					case "32前":
						leagues_32_1[league_index]++
						break
					case "32後":
						leagues_32_2[league_index]++
						break
					case "33前":
						leagues_33_1[league_index]++
						break
					case "33後":
						leagues_33_2[league_index]++
						break
					case "34前":
						leagues_34_1[league_index]++
						break
					case "34後":
						leagues_34_2[league_index]++
						break
					case "35前":
						leagues_35_1[league_index]++
						break
					case "35後":
						leagues_35_2[league_index]++
						break
					case "36前":
						leagues_36_1[league_index]++
						break
					case "36後":
						leagues_36_2[league_index]++
						break
					case "37前":
						leagues_37_1[league_index]++
						break
					case "37後":
						leagues_37_2[league_index]++
						break
					case "38前":
						leagues_38_1[league_index]++
						break
					case "38後":
						leagues_38_2[league_index]++
						break
					case "39前":
						leagues_39_1[league_index]++
						break
					case "39後":
						leagues_39_2[league_index]++
						break
					}
			}

			// 前期A1リーグ人数補完
			leagues_18_1[1] = leagues_18_2[1]
			leagues_19_1[1] = leagues_19_2[1]
			leagues_20_1[1] = leagues_20_2[1]
			leagues_21_1[1] = leagues_21_2[1]
			leagues_22_1[1] = leagues_22_2[1]
			leagues_23_1[1] = leagues_23_2[1]
			leagues_24_1[1] = leagues_24_2[1]
			leagues_25_1[1] = leagues_25_2[1]
			leagues_26_1[1] = leagues_26_2[1]
			leagues_27_1[1] = leagues_27_2[1]
			leagues_28_1[1] = leagues_28_2[1]
			leagues_29_1[1] = leagues_29_2[1]
			leagues_30_1[1] = leagues_30_2[1]
			leagues_31_1[1] = leagues_31_2[1]
			leagues_32_1[1] = leagues_32_2[1]
			leagues_33_1[1] = leagues_33_2[1]
			leagues_34_1[1] = leagues_34_2[1]
			leagues_35_1[1] = leagues_35_2[1]
			leagues_36_1[1] = leagues_36_2[1]
			leagues_37_1[1] = leagues_37_2[1]
			leagues_38_1[1] = leagues_38_2[1]

			// 前期A2リーグ人数補完
			leagues_18_1[2] = leagues_18_2[2]
			leagues_19_1[2] = leagues_19_2[2]
			leagues_20_1[2] = leagues_20_2[2]
			leagues_21_1[2] = leagues_21_2[2]
			leagues_22_1[2] = leagues_22_2[2]
			leagues_23_1[2] = leagues_23_2[2]
			leagues_24_1[2] = leagues_24_2[2]
			leagues_25_1[2] = leagues_25_2[2]
			leagues_26_1[2] = leagues_26_2[2]
			leagues_27_1[2] = leagues_27_2[2]
			leagues_28_1[2] = leagues_28_2[2]
			leagues_29_1[2] = leagues_29_2[2]
			leagues_30_1[2] = leagues_30_2[2]
			leagues_31_1[2] = leagues_31_2[2]
			leagues_32_1[2] = leagues_32_2[2]
			leagues_33_1[2] = leagues_33_2[2]
			leagues_34_1[2] = leagues_34_2[2]
			leagues_35_1[2] = leagues_35_2[2]
			leagues_36_1[2] = leagues_36_2[2]
			leagues_37_1[2] = leagues_37_2[2]
			leagues_38_1[2] = leagues_38_2[2]
		}

		let chartData = new google.visualization.DataTable()
		chartData.addColumn('string','期')
		chartData.addColumn('number','A1')
		chartData.addColumn('number','A2')
		chartData.addColumn('number','B1')
		chartData.addColumn('number','B2')
		chartData.addColumn('number','C1')
		chartData.addColumn('number','C2')
		chartData.addColumn('number','C3')
		chartData.addColumn('number','D1')
		chartData.addColumn('number','D2')
		chartData.addColumn('number','D3')
		chartData.addColumn('number','E1')
		chartData.addColumn('number','E2')
		chartData.addColumn('number',search_name)

		chartData.addRows([
			leagues_17_2,
			leagues_18_1,
			leagues_18_2,
			leagues_19_1,
			leagues_19_2,
			leagues_20_1,
			leagues_20_2,
			leagues_21_1,
			leagues_21_2,
			leagues_22_1,
			leagues_22_2,
			leagues_23_1,
			leagues_23_2,
			leagues_24_1,
			leagues_24_2,
			leagues_25_1,
			leagues_25_2,
			leagues_26_1,
			leagues_26_2,
			leagues_27_1,
			leagues_27_2,
			leagues_28_1,
			leagues_28_2,
			leagues_29_1,
			leagues_29_2,
			leagues_30_1,
			leagues_30_2,
			leagues_31_1,
			leagues_31_2,
			leagues_32_1,
			leagues_32_2,
			leagues_33_1,
			leagues_33_2,
			leagues_34_1,
			leagues_34_2,
			leagues_35_1,
			leagues_35_2,
			leagues_36_1,
			leagues_36_2,
			leagues_37_1,
			leagues_37_2,
			leagues_38_1,
			leagues_38_2,
			leagues_39_1
		])

		let leagueRanks = getLeagueRanks(data,chartData,search_name)

		for(let i = 0; i < leagueRanks.length; i++) {

			let my_class_year_period = leagueRanks[i][0]
			let my_rank = leagueRanks[i][1]

			console.log(my_class_year_period + ',' + my_rank)
			
			for(let j = 0; j < chartData.getNumberOfRows(); j++) {

				let class_year_period = chartData.getValue(j,0)

				if(my_class_year_period == class_year_period) {
					chartData.setValue(j,13,my_rank)
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
				'#FFCCCC', // A1
				'#FFDDCC', // A2
				'#FFEECC', // B1
				'#FFFFCC', // B2
				'#EEFFDD', // C1
				'#DDFFEE', // C2
				'#CCFFFF', // C3
				'#CCEEFF', // D1
				'#CCDDFF', // D2
				'#CCCCFF', // D3
				'#CCCCCC', // E1
				'#999999', // E2
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
				12: {
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

(function(){
    let requestId;
    window.addEventListener('resize', function(){
        cancelAnimationFrame(requestId);
        requestId = requestAnimationFrame(function(){
            drawChart();
        })
    })
})()

function getLeagueRanks(data,chartData,search_name) {

	let leagueRanks = []
	
	for(let i = 0; i < data.getNumberOfRows(); i++) {

		let name = data.getValue(i,0)
		let class_year = data.getValue(i,1)
		let class_period = data.getValue(i,2)
		let league = data.getValue(i,3)
		let rank = data.getValue(i,5)

		let class_year_period = class_year + class_period

//		if((search_name == name) && (class_year_period != '38後')) { // 38期後期順位未反映
		if(search_name == name) {

			let numberOfPeopleInUpperLeagues = getNumberOfPeopleInUpperLeagues(chartData,class_year_period,league)
			let leagueRank = numberOfPeopleInUpperLeagues + rank

			leagueRanks.push([class_year_period,leagueRank])
		}	
	}

	return leagueRanks
}

function getNumberOfPeopleInUpperLeagues(chartData,my_class_year_period,my_league) {

	let numberOfPeopleInUpperLeagues = 0

	for(let i = 0; i < chartData.getNumberOfRows(); i++) {
		
		let class_year_period = chartData.getValue(i,0)
		let a1 = chartData.getValue(i,1)
		let a2 = chartData.getValue(i,2)
		let b1 = chartData.getValue(i,3)
		let b2 = chartData.getValue(i,4)
		let c1 = chartData.getValue(i,5)
		let c2 = chartData.getValue(i,6)
		let c3 = chartData.getValue(i,7)
		let d1 = chartData.getValue(i,8)
		let d2 = chartData.getValue(i,9)
		let d3 = chartData.getValue(i,10)
		let e1 = chartData.getValue(i,11)
		let e2 = chartData.getValue(i,12)

		if(my_class_year_period == class_year_period) {
		
			switch(my_league) {
				case "A1":
					break
				case "A2":
					numberOfPeopleInUpperLeagues = a1
					break
				case "B1":
					numberOfPeopleInUpperLeagues = a1+a2
					break
				case "B2":
					numberOfPeopleInUpperLeagues = a1+a2+b1
					break
				case "C1":
					numberOfPeopleInUpperLeagues = a1+a2+b1+b2
					break
				case "C2":
					numberOfPeopleInUpperLeagues = a1+a2+b1+b2+c1
					break
				case "C3":
					numberOfPeopleInUpperLeagues = a1+a2+b1+b2+c1+c2
					break
				case "D1":
					numberOfPeopleInUpperLeagues = a1+a2+b1+b2+c1+c2+c3
					break
				case "D2":
					numberOfPeopleInUpperLeagues = a1+a2+b1+b2+c1+c2+c3+d1
					break
				case "D3":
					numberOfPeopleInUpperLeagues = a1+a2+b1+b2+c1+c2+c3+d1+d2
					break
				case "E1":
					numberOfPeopleInUpperLeagues = a1+a2+b1+b2+c1+c2+c3+d1+d2+d3
					break
				case "E2":
					numberOfPeopleInUpperLeagues = a1+a2+b1+b2+c1+c2+c3+d1+d2+d3+e1
					break
				}
		}
	}

	return numberOfPeopleInUpperLeagues
}
