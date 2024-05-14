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

		const chartData = new google.visualization.DataTable()
		chartData.addColumn('string','名前')
		chartData.addColumn('string','龍龍')
		chartData.addColumn('string','Twitter')
		chartData.addColumn('string','Instagram')
		chartData.addColumn('string','YouTube')
		chartData.addColumn('string','ブログ')
		chartData.addColumn('string','雀士<br>名鑑')
		chartData.addColumn('string','Mリーグ')
		chartData.addColumn('string','期<br>入会')
		chartData.addColumn('string','段位')
//		chartData.addColumn('string','出身地')
		chartData.addColumn('string','誕生日<br>出身地')
		chartData.addColumn('string','鳳凰<br>出場')
		chartData.addColumn('string','鳳凰<br>41前')
		chartData.addColumn('string','鳳凰<br>最高')
		chartData.addColumn('string','桜花<br>出場')
		chartData.addColumn('string','桜花<br>19期')
		chartData.addColumn('string','桜花<br>最高')
		chartData.addColumn('string','JWRC<br>出場')
		chartData.addColumn('string','特昇<br>出場')
		chartData.addColumn('string','最強<br>出場')
		chartData.addColumn('string','決勝<br>進出')
		chartData.addColumn('string','関連<br>記事')
//		chartData.addColumn('string','関連<br>動画')
		chartData.addColumn('string','放送<br>対局')

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
			let tokushoSeasons = data.getValue(i,42)
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
				tokushoSeasons ? getTokushoSeasons(name, tokushoSeasons) : '',
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
				filterColumnIndex: 13,
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
				filterColumnIndex: 16,
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

	let sortKey = ('0000' + numberOfArticles).slice(-4)

	return '<span class="' + sortKey + '">' + '<a href="./jpml_articles.html?name=' + name + '" target="_blank">' + numberOfArticles + '件</a></span>'
}

function getBirthInfo(birthday, birthplaceJa) {

	if(!birthday) {
		birthday = ''
	}

	if(!birthplaceJa) {
		birthplaceJa = ''
	}

	return '<span class="' + birthday + '">' + birthday + '<br>' + birthplaceJa + '<br></span>'
}

function getBlog(blogUrl, blogImageUrl) {
	return getExternalLink(blogUrl, blogImageUrl, 'Blog', 'img/journal-text.svg')
}

function getDan(danEn) {

	let danJa

	switch(danEn) {
		case 1:
			danJa = '初段'
			break
		case 2:
			danJa = 'ニ段'
			break
		case 3:
			danJa = '三段'
			break
		case 4:
			danJa = '四段'
			break
		case 5:
			danJa = '五段'
			break
		case 6:
			danJa = '六段'
			break
		case 7:
			danJa = '七段'
			break
		case 8:
			danJa = '八段'
			break
		case 9:
			danJa = '九段'
			break
		default:
			break
	}

	return '<span class="' + danEn + '">' + danJa + '</span>'
}

function getFinals(name, numberOfFinals) {

	let sortKey = ('0000' + numberOfFinals).slice(-4)

	return '<span class="' + sortKey + '">' + '<a href="./jpml_titles.html?name=' + name + '" target="_blank">' + numberOfFinals + '回</a></span>'
}

function getHououHighestLeague(name, hououHighestLeague) {

	let sortKey

	if(hououHighestLeague == "鳳凰位") {
		sortKey = "00"
	}
	else {
		sortKey = hououHighestLeague
	}

	return '<span class="' + sortKey + '">' + '<a href="./houou_leagues.html?name=' + name + '" target="_blank">' + hououHighestLeague + '</a></span>'
}

function getHououSeasons(name, hououSeasons) {

	let sortKey = ('0000' + hououSeasons).slice(-4)

	return '<span class="' + sortKey + '">' + '<a href="./houou_results.html?name=' + name + '" target="_blank">' + hououSeasons + '回</a></span>'
}

function getInstagram(instagramId) {
	return getExternalLink('http://instagram.com/' + instagramId, 'img/instagram.svg', 'Instagram', 'img/instagram.svg')
}

function getJpmlWrcSeasons(name, jpmlWrcSeasons) {

	let sortKey = ('0000' + jpmlWrcSeasons).slice(-4)

	return '<span class="' + sortKey + '">' + '<a href="./wrc_results.html?name=' + name + '" target="_blank">' + jpmlWrcSeasons + '回</a></span>'
}

function getKinmaDirectory(kinmaDirectoryUrl, kinmaDirectoryImageUrl) {
	return getExternalLink(kinmaDirectoryUrl, kinmaDirectoryImageUrl, '雀士名鑑', 'img/box-arrow-up-right.svg')
}

function getLives(name, numberOfLives) {

	let sortKey = ('0000' + numberOfLives).slice(-4)

	return '<span class="' + sortKey + '">' + '<a href="./video_live.html?name=' + name + '" target="_blank">' + numberOfLives + '件</a></span>'
}

function getName(name, sortKey, lastNameEn = '', firstNameEn = '') {
	return '<span class="' + sortKey + '">' + name + '<br>' + lastNameEn + ' ' + firstNameEn + '</span>'
}

function getOukaHighestLeague(name, oukaHighestLeague) {

	let sortKey

	if(oukaHighestLeague == "桜花") {
		sortKey = "00"
	}
	else {
		sortKey = oukaHighestLeague
	}

	return '<span class="' + sortKey + '">' + '<a href="./ouka_leagues.html?name=' + name + '" target="_blank">' + oukaHighestLeague + '</a></span>'
}

function getOukaSeasons(name, oukaSeasons) {

	let sortKey = ('0000' + oukaSeasons).slice(-4)

	return '<span class="' + sortKey + '">' + '<a href="./ouka_results.html?name=' + name + '" target="_blank">' + oukaSeasons + '回</a></span>'
}

function getProClass(proClass, joined) {
	return '<span class="' + joined + '">' + proClass + '期<br>' + joined + '</span>'
}

function getRon2(ron2Id, ron2ImageUrl) {
	return getExternalLink('https://ron2.jp/pro/' + ron2Id, ron2ImageUrl, '龍龍', 'img/box-arrow-up-right.svg')
}

function getSaikyoGames(name, saikyoGames) {

	let sortKey = ('0000' + saikyoGames).slice(-4)

	return '<span class="' + sortKey + '">' + '<a href="./saikyo_results.html?name=' + name + '" target="_blank">' + saikyoGames + '回</a></span>'
}

function getTokushoSeasons(name, tokushoSeasons) {

	let sortKey = ('0000' + tokushoSeasons).slice(-4)

	return '<span class="' + sortKey + '">' + '<a href="./tokusho_results.html?name=' + name + '" target="_blank">' + tokushoSeasons + '回</a></span>'
}

function getTwitter(twitterId, twitterImageUrl) {
	return getExternalLink('http://twitter.com/' + twitterId, twitterImageUrl, 'Twitter', 'img/twitter.svg')
}

function getYouTube(youTubeId, youTubeImageUrl) {
	return getExternalLink('http://youtube.com/channel/' + youTubeId, youTubeImageUrl, 'YouTube', 'img/youtube.svg')
}

function getExternalLink(url, imgUrl, altText, altImgUrl) {
    return `<a href="${url}" target="_blank"><img alt="${altText}" class="pros" loading="lazy" src="${imgUrl}" onError="this.onerror=null;this.src='${altImgUrl}'" /></a>`
}

function getSearchParam(params, paramName) {

	let param = params.get(paramName)

	if(param == 'null') {
		param = ''
	}

	return param
}
