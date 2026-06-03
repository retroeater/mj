const params = (new URL(document.location)).searchParams

const search_place = getSearchParam(params, 'place')
const search_name = getSearchParam(params, 'name')
const search_league = getSearchParam(params, 'league')
const search_ouka = getSearchParam(params, 'ouka')

const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=プロ&headers=1'

google.charts.load('current', {'packages':['table','controls']});
google.charts.setOnLoadCallback(drawDashboard)

function drawDashboard() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery('SELECT A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X WHERE Y = "Y" ORDER BY B ASC')
	query.send(handleQueryResponse)

	function handleQueryResponse(response) {
		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const chartData = new google.visualization.DataTable();
		const columns = [
			'所属<br>出身地',
			'名前',
			'龍龍',
			'X',
			'note',
			'YouTube',
			'鳳凰<br>出場',
			'鳳凰<br>43前',
			'鳳凰<br>最高',
			'桜花<br>出場',
			'桜花<br>20期',
			'桜花<br>最高',
			'最強<br>出場',
			'決勝<br>進出',
			'放送<br>対局'
		]
		columns.forEach(col => chartData.addColumn('string', col))

		const data = response.getDataTable()
		const rows = []
		
		for (let i = 0; i < data.getNumberOfRows(); i++) {

			let name = data.getValue(i,0)
			let sortKey = data.getValue(i,1)
			let lastNameEn = data.getValue(i,2)
			let firstNameEn = data.getValue(i,3)
			let office = data.getValue(i,4)
			let hometown = data.getValue(i,5)
			let ron2Id = data.getValue(i,6)
			let ron2ImageUrl = data.getValue(i,7)
			let xId = data.getValue(i,8)
			let xImageUrl = data.getValue(i,9)
			let noteId = data.getValue(i,10)
			let noteImageUrl = data.getValue(i,11)
			let youTubeId = data.getValue(i,12)
			let youTubeImageUrl = data.getValue(i,13)
			let hououSeasons = data.getValue(i,14)
			let hououLatestLeague = data.getValue(i,15)
			let hououHighestLeague = data.getValue(i,16)
			let oukaSeasons = data.getValue(i,17)
			let oukaLatestLeague = data.getValue(i,18)
			let oukaHighestLeague = data.getValue(i,19)
			let saikyoGames = data.getValue(i,20)
			let numberOfFinals = data.getValue(i,21)
			let numberOfLives = data.getValue(i,22)

			const row = [
				getPlaces(office, hometown),
				getName(name, sortKey, lastNameEn, firstNameEn),
				ron2Id ? getRon2(ron2Id, ron2ImageUrl) : '',
				xId ? getX(xId, xImageUrl) : '',
				noteId ? getNote(noteId, noteImageUrl) : '',
				youTubeId ? getYouTube(youTubeId, youTubeImageUrl) : '',
				hououSeasons ? getHououSeasons(name, hououSeasons) : '',
				hououLatestLeague,
				hououHighestLeague ? getHououHighestLeague(name, hououHighestLeague) : '',
				oukaSeasons ? getOukaSeasons(name, oukaSeasons) : '',
				oukaLatestLeague,
				oukaHighestLeague ? getOukaHighestLeague(name, oukaHighestLeague) : '',
				saikyoGames ? getSaikyoGames(name, saikyoGames) : '',
				numberOfFinals ? getFinals(name, numberOfFinals) : '',
				numberOfLives ? getLives(name, numberOfLives) : ''
			]
			rows.push(row)
		}
		
		chartData.addRows(rows)

		const dashboard = new google.visualization.Dashboard(document.getElementById('dashboard_div'))

		const placeFilter = new google.visualization.ControlWrapper({
			controlType: 'StringFilter',
			containerId: 'place_filter_div',
			options: {
				filterColumnIndex: 0,
				matchType: 'any',
				ui: {
					label: '',
					placeholder: '所属/出身地'
				}
			},
			state: {
					value: search_place
			}
		})

		const nameFilter = new google.visualization.ControlWrapper({
			controlType: 'StringFilter',
			containerId: 'name_filter_div',
			options: {
				filterColumnIndex: 1,
				matchType: 'any',
				ui: {
					label: '',
					placeholder: '名前/Name'
				}
			},
			state: {
					value: search_name
			}
		})
		
		const leagueFilter = new google.visualization.ControlWrapper({
			controlType: 'StringFilter',
			containerId: 'league_filter_div',
			options: {
				filterColumnIndex: 7,
				matchType: 'any',
				ui: {
					label: '',
					placeholder: '鳳凰43前'
				}
			},
			state: {
				value: search_league
			}
		})

		const oukaFilter = new google.visualization.ControlWrapper({
			controlType: 'StringFilter',
			containerId: 'ouka_filter_div',
			options: {
				filterColumnIndex: 10,
				matchType: 'any',
				ui: {
					label: '',
					placeholder: '桜花20期'
				}
			},
			state: {
				value: search_ouka
			}
		})

		let dynamicHeight = window.innerHeight + "px"

		const table = new google.visualization.ChartWrapper({
			chartType: 'Table',
			containerId: 'myTable',
			options : {
				allowHtml: true,
				cssClassNames: {
					tableCell: 'mj-pros'
				},
				width: '100%',
				height: dynamicHeight
			}
		})

		const view = new google.visualization.DataView(chartData)

		dashboard.bind([placeFilter,nameFilter,leagueFilter,oukaFilter], table)
		dashboard.draw(view)
	}
}

function getExternalLink(url, imgUrl, altText, altImgUrl) {
    return `<a href="${url}" target="_blank"><img alt="${altText}" class="pros" loading="lazy" src="${imgUrl}" onError="this.onerror=null;this.src='${altImgUrl}'" /></a>`
}

function getFinals(name, numberOfFinals) {
	return getInternalLink(getSortKey(numberOfFinals), './jpml_titles.html', 'name', name, numberOfFinals, '回')
}

function getHououHighestLeague(name, hououHighestLeague) {
	const sortKey = hououHighestLeague === "鳳凰位" ? "00" : hououHighestLeague
	return getInternalLink(getSortKey(sortKey), './houou_leagues.html', 'name', name, hououHighestLeague, '')
}

function getHououSeasons(name, hououSeasons) {
	return getInternalLink(getSortKey(hououSeasons), './houou_results.html', 'name', name, hououSeasons, '回')
}

function getInternalLink(sortKey, baseUrl, paramName, param, value, unit) {
	return `<span class="${sortKey}"><a href="${baseUrl}?${paramName}=${param}" target="_blank">${value}${unit}</a></span>`
}

function getLives(name, numberOfLives) {
	return getInternalLink(getSortKey(numberOfLives), './video_live.html', 'name', name, numberOfLives, '件')
}

function getName(name, sortKey, lastNameEn, firstNameEn) {

	if(!lastNameEn) {
		lastNameEn = ''
	}

	if(!firstNameEn) {
		firstNameEn = ''
	}

	return `<span class="${sortKey}">${name}<br />${lastNameEn} ${firstNameEn}<br /></span>`
}

function getNote(noteId, noteImageUrl) {
	return getExternalLink('https://note.com/' + noteId, noteImageUrl, 'note', 'img/note.svg')
}

function getOukaHighestLeague(name, oukaHighestLeague) {
	const sortKey = oukaHighestLeague === "桜花" ? "00" : oukaHighestLeague
	return getInternalLink(getSortKey(sortKey), './ouka_leagues.html', 'name', name, oukaHighestLeague, '')
}

function getOukaSeasons(name, oukaSeasons) {
	return getInternalLink(getSortKey(oukaSeasons), './ouka_results.html', 'name', name, oukaSeasons, '回')
}

function getPlaces(office, hometown) {

		if(!hometown) {
		hometown = ''
	}

	return `<span>${office}<br />${hometown}<br /></span>`
}

function getRon2(ron2Id, ron2ImageUrl) {
	return getExternalLink('https://ron2.jp/pro/' + ron2Id, ron2ImageUrl, '龍龍', 'img/box-arrow-up-right.svg')
}

function getSaikyoGames(name, saikyoGames) {
	return getInternalLink(getSortKey(saikyoGames), './saikyo_results.html', 'tag', name, saikyoGames, '回')
}

function getSearchParam(params, paramName) {

	let param = params.get(paramName)

	if(param == 'null') {
		param = ''
	}

	return param
}

function getSortKey(key) {
	return ('00000' + key).slice(-5)
}

function getX(xId, xImageUrl) {
	return getExternalLink('https://x.com/' + xId, xImageUrl, 'X', 'img/x.png')
}

function getYouTube(youTubeId, youTubeImageUrl) {
	return getExternalLink('https://youtube.com/channel/' + youTubeId, youTubeImageUrl, 'YouTube', 'img/youtube.svg')
}
