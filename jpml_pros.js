const params = (new URL(document.location)).searchParams

const search_name = getSearchParam(params, 'name')
const search_joined = getSearchParam(params, 'joined')
const search_league = getSearchParam(params, 'league')
const search_ouka = getSearchParam(params, 'ouka')

const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=pro&headers=1'

google.charts.load('current', {'packages':['table','controls']});
google.charts.setOnLoadCallback(drawDashboard)

function drawDashboard() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery('SELECT A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,AA,AB,AC,AD,AE,AF,AG,AH,AI,AJ,AK,AL,AM,AN,AO,AP,AQ,AR,AS,AT,AU WHERE Y = "Y"')
	query.send(handleQueryResponse)

	function handleQueryResponse(response) {
		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const chartData = new google.visualization.DataTable();
		const columns = [
			'名前',
			'龍龍',
			'Twitter',
			'Instagram',
			'YouTube',
			'ブログ',
			'雀士<br>名鑑',
			'Mリーグ',
			'期<br>入会',
			'段位',
			'誕生日<br>出身地',
			'鳳凰<br>出場',
			'鳳凰<br>41前',
			'鳳凰<br>最高',
			'桜花<br>出場',
			'桜花<br>19期',
			'桜花<br>最高',
			'JWRC<br>出場',
//			'特昇<br>出場',
			'最強<br>出場',
			'決勝<br>進出',
			'関連<br>記事',
			'放送<br>対局'
		]
		columns.forEach(col => chartData.addColumn('string', col))

		const data = response.getDataTable()
		const rows = []
		
		for (let i = 0; i < data.getNumberOfRows(); i++) {

			let name = data.getValue(i,0)
			let sortKey = data.getValue(i,1)
//			let lastNameJaKanji = data.getValue(i,2)
//			let firstNameJaKanji = data.getValue(i,3)
//			let lastNameJaKana = data.getValue(i,4)
//			let firstNameJaKana = data.getValue(i,5)
			let lastNameEn = data.getValue(i,6)
			let firstNameEn = data.getValue(i,7)
			let proClass = data.getValue(i,8)
			let joined = data.getValue(i,9)
			let birthplaceJa = data.getValue(i,10)
//			let birthplaceEn = data.getValue(i,11)
			let birthday = data.getValue(i,12)
			let ron2Id = data.getValue(i,13)
			let twitterId = data.getValue(i,14)
			let instagramId = data.getValue(i,15)
			let youTubeId = data.getValue(i,16)
			let blogUrl = data.getValue(i,18)
			let hououLatestLeague = data.getValue(i,19)
			let hououHighestLeague = data.getValue(i,20)
			let numberOfFinals = data.getValue(i,21)
			let numberOfArticles = data.getValue(i,22)
//			let lastUpdated = data.getValue(i,23)
//			let isVisible = data.getValue(i,24)
//			let remarks = data.getValue(i,25)
			let numberOfLives = data.getValue(i,26)
			let saikyoGames = data.getValue(i,27)
			let oukaLatestLeague = data.getValue(i,28)
			let oukaHighestLeague = data.getValue(i,29)
			let danEn = data.getValue(i,30)
			let twitterImageUrl = data.getValue(i,31)
			let blogImageUrl = data.getValue(i,32)
			let youTubeImageUrl = data.getValue(i,33)
			let hououSeasons = data.getValue(i,34)
			let oukaSeasons = data.getValue(i,35)
			let ron2ImageUrl = data.getValue(i,36)
//			let numberOfVideos = data.getValue(i,37)
//			let tenhouId = data.getValue(i,38)
//			let instagramImageUrl = data.getValue(i,39)
//			let ron2AveragePlacement = data.getValue(i,40)
			let jpmlWrcSeasons = data.getValue(i,41)
//			let tokushoSeasons = data.getValue(i,42)
			let kinmaDirectoryUrl = data.getValue(i,43)
			let kinmaDirectoryImageUrl = data.getValue(i,44)
			let mleagueYouTubeId = data.getValue(i,45)
			let mleagueYouTubeImageUrl = data.getValue(i,46)

			const row = [
				getName(name, sortKey, lastNameEn, firstNameEn),
				ron2Id ? getRon2(ron2Id, ron2ImageUrl) : '',
				twitterId ? getTwitter(twitterId, twitterImageUrl) : '',
				instagramId ? getInstagram(instagramId) : '',
				youTubeId ? getYouTube(youTubeId, youTubeImageUrl) : '',
				blogUrl ? getBlog(blogUrl, blogImageUrl) : '',
				kinmaDirectoryUrl ? getKinmaDirectory(kinmaDirectoryUrl, kinmaDirectoryImageUrl) : '',
				mleagueYouTubeId ? getYouTube(mleagueYouTubeId, mleagueYouTubeImageUrl) :'',
				proClass ? getProClass(proClass, joined) : '',
				danEn ? getDan(danEn) : '',
				(birthday) || (birthplaceJa) ? getBirthInfo(birthday, birthplaceJa) : '',
				hououSeasons ? getHououSeasons(name, hououSeasons) : '',
				hououLatestLeague,
				hououHighestLeague ? getHououHighestLeague(name, hououHighestLeague) : '',
				oukaSeasons ? getOukaSeasons(name, oukaSeasons) : '',
				oukaLatestLeague,
				oukaHighestLeague ? getOukaHighestLeague(name, oukaHighestLeague) : '',
				jpmlWrcSeasons ? getJpmlWrcSeasons(name, jpmlWrcSeasons) : '',
//				tokushoSeasons ? getTokushoSeasons(name, tokushoSeasons) : '',
				saikyoGames ? getSaikyoGames(name, saikyoGames) : '',
				numberOfFinals ? getFinals(name, numberOfFinals) : '',
				numberOfArticles ? getArticles(name, numberOfArticles) : '',
				numberOfLives ? getLives(name, numberOfLives) : ''
			]
			rows.push(row)
		}
		
		chartData.addRows(rows)

		const dashboard = new google.visualization.Dashboard(document.getElementById('dashboard_div'))

		const nameFilter = new google.visualization.ControlWrapper({
			controlType: 'StringFilter',
			containerId: 'name_filter_div',
			options: {
				filterColumnIndex: 0,
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

		const classFilter = new google.visualization.ControlWrapper({
			controlType: 'StringFilter',
			containerId: 'class_filter_div',
			options: {
				filterColumnIndex: 8,
				matchType: 'any',
				ui: {
					label: '',
					placeholder: '期/入会年'
				}
			},
			state: {
				value: search_joined
			}
		})
		
		const leagueFilter = new google.visualization.ControlWrapper({
			controlType: 'StringFilter',
			containerId: 'league_filter_div',
			options: {
				filterColumnIndex: 12,
				matchType: 'any',
				ui: {
					label: '',
					placeholder: '41期前期'
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
				filterColumnIndex: 15,
				matchType: 'any',
				ui: {
					label: '',
					placeholder: '桜花19期'
				}
			},
			state: {
				value: search_ouka
			}
		})

		const table = new google.visualization.ChartWrapper({
			chartType: 'Table',
			containerId: 'myTable',
			options : {
				allowHtml: true,
				cssClassNames: {
					tableCell: 'mj-pros'
				},
				width: '100%',
				height: '100%'
			},
			state: {
				value: search_joined
			}			
		})

		const view = new google.visualization.DataView(chartData)

		dashboard.bind([nameFilter,classFilter,leagueFilter,oukaFilter], table)
		dashboard.draw(view)
	}
}

function getArticles(name, numberOfArticles) {
	return getInternalLink(getSortKey(numberOfArticles), './jpml_articles.html', 'name', name, numberOfArticles, '件')
}

function getBirthInfo(birthday, birthplaceJa) {

	if(!birthday) {
		birthday = ''
	}

	if(!birthplaceJa) {
		birthplaceJa = ''
	}

	return `<span class="${birthday}">${birthday}<br />${birthplaceJa}<br /></span>`
}

function getBlog(blogUrl, blogImageUrl) {
	return getExternalLink(blogUrl, blogImageUrl, 'Blog', 'img/journal-text.svg')
}

function getDan(danEn) {

	const danMap = {
		1: '初段',
		2: 'ニ段',
		3: '三段',
		4: '四段',
		5: '五段',
		6: '六段',
		7: '七段',
		8: '八段',
		9: '九段'
    }

    const danJa = danMap[danEn] || ''

    return `<span class="${danEn}">${danJa}</span>`
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

function getInstagram(instagramId) {
	return getExternalLink('http://instagram.com/' + instagramId, 'img/instagram.svg', 'Instagram', 'img/instagram.svg')
}

function getInternalLink(sortKey, baseUrl, paramName, param, value, unit) {
	return `<span class="${sortKey}"><a href="${baseUrl}?${paramName}=${param}" target="_blank">${value}${unit}</a></span>`
}

function getJpmlWrcSeasons(name, jpmlWrcSeasons) {
	return getInternalLink(getSortKey(jpmlWrcSeasons), './wrc_results.html', 'name', name, jpmlWrcSeasons, '回')
}

function getKinmaDirectory(kinmaDirectoryUrl, kinmaDirectoryImageUrl) {
	return getExternalLink(kinmaDirectoryUrl, kinmaDirectoryImageUrl, '雀士名鑑', 'img/box-arrow-up-right.svg')
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

function getOukaHighestLeague(name, oukaHighestLeague) {
	const sortKey = oukaHighestLeague === "桜花" ? "00" : oukaHighestLeague
	return getInternalLink(getSortKey(sortKey), './ouka_leagues.html', 'name', name, oukaHighestLeague, '')
}

function getOukaSeasons(name, oukaSeasons) {
	return getInternalLink(getSortKey(oukaSeasons), './ouka_results.html', 'name', name, oukaSeasons, '回')
}

function getProClass(proClass, joined) {
	return `<span class="${joined}">${proClass}期<br>${joined}</span>`
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

function getTwitter(twitterId, twitterImageUrl) {
	return getExternalLink('http://twitter.com/' + twitterId, twitterImageUrl, 'Twitter', 'img/twitter.svg')
}

function getYouTube(youTubeId, youTubeImageUrl) {
	return getExternalLink('http://youtube.com/channel/' + youTubeId, youTubeImageUrl, 'YouTube', 'img/youtube.svg')
}
