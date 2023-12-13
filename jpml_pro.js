const params = (new URL(document.location)).searchParams
let search_name = params.get('name')

if(search_name == 'null') {
	search_name = '平野良栄'
}

const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=SDP&headers=1'

google.charts.load('current', {'packages':['table','controls']});
google.charts.setOnLoadCallback(drawDashboard)

function drawDashboard() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery('SELECT A,B,C,D,E,F,G,H,I,J,K,L,M,N WHERE N = "Y" AND A ="' + search_name + '"')
	query.send(handleQueryResponse)

	let name				// A 名前
	let imageUrl			// B 龍龍写真
	let fullNameJaKana		// C ふりがな
	let birthday			// D 誕生日
	let birthplaceJa		// E 出身地
	let proClass			// F 期・入会年
	let dan					// G 段位
	let hououLatestLeague	// H 鳳凰戦
	let oukaLatestLeague	// I 女流桜花
	let twitterId			// J Twitter
	let instagramId			// K Instagram
	let youTubeId			// L YouTube
	let blogUrl				// M Blog
	let isVisible			// N 表示

	function handleQueryResponse(response) {
		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const chartData = new google.visualization.DataTable()
		chartData.addColumn('string',search_name)

		const data = response.getDataTable()

		for(let i = 0; i < data.getNumberOfRows(); i++) {

			name = data.getValue(i,0)
			imageUrl = data.getValue(i,1)
			fullNameJaKana = data.getValue(i,2)
			birthday = data.getValue(i,3)
			birthplaceJa = data.getValue(i,4)
			proClass = data.getValue(i,5)
			dan = data.getValue(i,6)
			hououLatestLeague = data.getValue(i,7)
			oukaLatestLeague = data.getValue(i,8)
			twitterId = data.getValue(i,9)
			instagramId = data.getValue(i,10)
			youTubeId = data.getValue(i,11)
			blogUrl = data.getValue(i,12)

			let profile

			profile = '<p><img src="' + imageUrl + '" alt="' + name + '" title="' + name + '" width="100%" /></p>'

			if(fullNameJaKana) {
				profile += name + '（' + fullNameJaKana + '）<br />'
			}

			if(dan) {
				let formattedDanJa = getFormattedDanJa(dan)
				profile += formattedDanJa + '<br />'
			}

			if(birthplaceJa) {
				profile += birthplaceJa + '<br />'
			}

			if(birthday) {
				profile += birthday + '<br />'
			}

			if(hououLatestLeague) {
				profile += hououLatestLeague + '<br />'
			}

			if(oukaLatestLeague) {
				profile += oukaLatestLeague + '<br />'
			}

			chartData.addRows([
				[
					profile
				]			
			])
		}

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
			}
		})

		const view = new google.visualization.DataView(chartData)

		dashboard.bind([nameFilter], table)
		dashboard.draw(view)
	}
}

const spreadsheet_url_titles = 'https://docs.google.com/spreadsheets/d/1WxXJJ2vQPfjNsMYT9zBE2UU1Xo7T-PkhWYE6dtWtk50/edit?sheet=タイトル&headers=1'

const queryStatement = 'SELECT A,B,C,D,E,F,G WHERE G = "Y" AND A = "' + search_name + '"'

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

		const table = new google.visualization.Table(document.getElementById('myTable2'));

		const options = {
			allowHtml: true,
			width: '100%',
			height: '100%'
		}

		const view = new google.visualization.DataView(data)

		table.draw(view, options);
	}
}

function getFormattedDanJa(dan) {

	let formattedDanJa

	switch(dan) {
		case 1:
			formattedDanJa = '初段'
			break
		case 2:
			formattedDanJa = 'ニ段'
			break
		case 3:
			formattedDanJa = '三段'
			break
		case 4:
			formattedDanJa = '四段'
			break
		case 5:
			formattedDanJa = '五段'
			break
		case 6:
			formattedDanJa = '六段'
			break
		case 7:
			formattedDanJa = '七段'
			break
		case 8:
			formattedDanJa = '八段'
			break
		case 9:
			formattedDanJa = '九段'
			break
		default:
			break
	}	

	return formattedDanJa
}

function getFormattedArticles(name,numberOfArticles) {

	let sortKey
	let formattedArticles

	if(numberOfArticles != 0) {
		sortKey = ('0000' + numberOfArticles).slice(-4)
		formattedArticles = '<span class="' + sortKey + '">' + '<a href="./jpml_articles.html?name=' + name + '" target="_blank">' + numberOfArticles + '件</a></span>'
	}

	return formattedArticles
}

function getFormattedBirthplace(birthplaceJa,birthplaceEn) {

	let formattedBirthplace

	if(birthplaceJa) {
		formattedBirthplace = '<span class="' + birthplaceEn + '">' + birthplaceJa + '<br>' + birthplaceEn + '</span>'
	}

	return formattedBirthplace
}

function getFormattedBlog(blogUrl,blogImageUrl) {

	let formattedBlog
	const blogIcon = 'img/journal-text.svg'

	if(blogUrl) {
		formattedBlog = '<a href="' + blogUrl + '" target="_blank"><img alt="Blog" class="pros" loading="lazy" src="' + blogImageUrl + '" onError="this.onerror=null;this.src=\'' + blogIcon + '\'" /></a>'
	}

	return formattedBlog
}

function getFormattedDan(danEn) {

	let danJa
	let formattedDan

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

	if(danEn) {
		formattedDan = '<span class="' + danEn + '">' + danJa + '</span>'
	}

	return formattedDan
}

function getFormattedFinals(name,numberOfFinals) {

	let sortKey
	let formattedFinals

	if(numberOfFinals != 0) {
		sortKey = ('0000' + numberOfFinals).slice(-4)
		formattedFinals = '<span class="' + sortKey + '">' + '<a href="./jpml_titles.html?name=' + name + '" target="_blank">' + numberOfFinals + '回</a></span>'
	}

	return formattedFinals
}

function getFormattedHououHighestLeague(name,hououHighestLeague) {

	let sortKey
	let formattedHououHighestLeague

	if(hououHighestLeague == "鳳凰位") {
		sortKey = "00"
	}
	else {
		sortKey = hououHighestLeague
	}

	if(hououHighestLeague) {
		formattedHououHighestLeague = '<span class="' + sortKey + '">' + '<a href="./houou_leagues.html?name=' + name + '" target="_blank">' + hououHighestLeague + '</a></span>'
	}

	return formattedHououHighestLeague
}

function getFormattedHououSeasons(name,hououSeasons) {

	let sortKey
	let formattedHououSeasons

	if(hououSeasons) {
		sortKey = ('0000' + hououSeasons).slice(-4)
		formattedHououSeasons = '<span class="' + sortKey + '">' + '<a href="./houou_results.html?name=' + name + '" target="_blank">' + hououSeasons + '回</a></span>'
	}

	return formattedHououSeasons
}

function getFormattedInstagram(instagramId) {

	let formattedInstagram
	const instagramIcon = 'img/instagram.svg'

	if(instagramId) {
		formattedInstagram = ' <a href="http://instgram.com/' + instagramId + '" target="_blank"><img alt="Instagram" class="pros" src="' + instagramIcon + '" /></a> '
	}

	return formattedInstagram
}

function getFormattedJpmlWrcSeasons(name,jpmlWrcSeasons) {

	let sortKey
	let formattedJpmlWrcSeasons

	if(jpmlWrcSeasons) {
		sortKey = ('0000' + jpmlWrcSeasons).slice(-4)
		formattedJpmlWrcSeasons = '<span class="' + sortKey + '">' + '<a href="./wrc_results.html?name=' + name + '" target="_blank">' + jpmlWrcSeasons + '回</a></span>'
	}

	return formattedJpmlWrcSeasons
}

function getFormattedKinmaDirectory(kinmaDirectoryUrl,kinmaDirectoryImageUrl) {

	let formattedKinmaDirectory
	const directoryIcon = 'img/box-arrow-up-right.svg'

	if(kinmaDirectoryUrl) {
		formattedKinmaDirectory = '<a href="' + kinmaDirectoryUrl + '" target="_blank"><img alt="雀士名鑑" class="pros" loading="lazy" src="' + kinmaDirectoryImageUrl + '" onError="this.onerror=null;this.src=\'' + directoryIcon + '\'" /></a>'
	}

	return formattedKinmaDirectory
}

function getFormattedLastUpdated(lastUpdated) {

	let formattedLastUpdated

	if(lastUpdated) {
		formattedLastUpdated = lastUpdated.getFullYear() + '-' + ('00' + (lastUpdated.getMonth()+1)).slice(-2) + '-' + ('00' + lastUpdated.getDate()).slice(-2)
	}

	return formattedLastUpdated
}

function getFormattedLives(name,numberOfLives) {

	let sortKey
	let formattedLives

	if(numberOfLives != 0) {
		sortKey = ('0000' + numberOfLives).slice(-4)
		formattedLives = '<span class="' + sortKey + '">' + '<a href="./video_live.html?name=' + name + '" target="_blank">' + numberOfLives + '件</a></span>'
	}

	return formattedLives
}

function getFormattedName(name,sortKey,lastNameEn,firstNameEn) {

	let formattedName = name

	// nullを空文字列に変換
	if(!lastNameEn)  {lastNameEn = ""}
	if(!firstNameEn) {firstNameEn = ""}

	formattedName = '<span class="' + sortKey + '">' + name + '<br>' + lastNameEn + ' ' + firstNameEn + '</span>'

	return formattedName
}

function getFormattedOukaHighestLeague(name,oukaHighestLeague) {

	let sortKey
	let formattedOukaHighestLeague

	if(oukaHighestLeague == "桜花") {
		sortKey = "00"
	}
	else {
		sortKey = oukaHighestLeague
	}

	if(oukaHighestLeague) {
		formattedOukaHighestLeague = '<span class="' + sortKey + '">' + '<a href="./ouka_leagues.html?name=' + name + '" target="_blank">' + oukaHighestLeague + '</a></span>'
	}

	return formattedOukaHighestLeague
}

function getFormattedOukaSeasons(name,oukaSeasons) {

	let sortKey
	let formattedOukaSeasons

	if(oukaSeasons) {
		sortKey = ('0000' + oukaSeasons).slice(-4)
		formattedOukaSeasons = '<span class="' + sortKey + '">' + '<a href="./ouka_results.html?name=' + name + '" target="_blank">' + oukaSeasons + '回</a></span>'
	}

	return formattedOukaSeasons
}

function getFormattedProClass(proClass,joined) {

	let formattedProClass

	if(proClass) {
		formattedProClass = '<span class="' + joined + '">' + proClass + '期<br>' + joined + '</span>'
	}

	return formattedProClass
}

function getFormattedRon2(ron2Id,ron2ImageUrl) {

	let formattedRon2

	if(!ron2ImageUrl) {
		ron2ImageUrl = 'img/box-arrow-up-right.svg'
	}

	if(ron2Id) {
		formattedRon2 = '<a href="https://ron2.jp/pro/' + ron2Id + '/" target="_blank"><img alt="龍龍" class="pros" loading="lazy" src="' + ron2ImageUrl + '" onError="this.onerror=null;this.src=\'img/box-arrow-up-right.svg\'" /></a>'
	}

	return formattedRon2
}

function getFormattedSaikyoGames(name,saikyoGames) {

	let sortKey
	let formattedSaikyoGames

	if(saikyoGames) {
		sortKey = ('0000' + saikyoGames).slice(-4)
		formattedSaikyoGames = '<span class="' + sortKey + '">' + '<a href="./saikyo_results.html?name=' + name + '" target="_blank">' + saikyoGames + '回</a></span>'
	}

	return formattedSaikyoGames
}

function getFormattedTokushoSeasons(name,tokushoSeasons) {

	let sortKey
	let formattedTokushoSeasons

	if(tokushoSeasons) {
		sortKey = ('0000' + tokushoSeasons).slice(-4)
		formattedTokushoSeasons = '<span class="' + sortKey + '">' + '<a href="./tokusho_results.html?name=' + name + '" target="_blank">' + tokushoSeasons + '回</a></span>'
	}

	return formattedTokushoSeasons
}

function getFormattedTwitter(twitterId,twitterImageUrl) {

	let formattedTwitter
	const twitterIcon = 'img/twitter.svg'

	if(twitterId) {
		formattedTwitter = ' <a href="http://twitter.com/' + twitterId + '" target="_blank"><img alt="Twitter" class="pros" loading="lazy" src="' + twitterImageUrl + '" onError="this.onerror=null;this.src=\'' + twitterIcon + '\'" /></a>'
	}

	return formattedTwitter	
}

function getFormattedVideos(name,numberOfVideos) {

	let sortKey
	let formattedVideos

	if(numberOfVideos != 0) {
		sortKey = ('0000' + numberOfVideos).slice(-4)
		formattedVideos = '<span class="' + sortKey + '">' + '<a href="./video_jpml.html?name=' + name + '" target="_blank">' + numberOfVideos + '件</a></span>'
	}

	return formattedVideos
}

function getFormattedYouTube(youTubeId,youTubeImageUrl) {

	let formattedYouTube
	const youtubeIcon = 'img/youtube.svg'

	if(youTubeId) {
		formattedYouTube = '<a href="http://youtube.com/channel/' + youTubeId + '" target="_blank"><img alt="YouTube" class="pros" loading="lazy" src="' + youTubeImageUrl + '" onError="this.onerror=null;this.src=\'' + youtubeIcon + '\'" /></a>'
	}

	return formattedYouTube	
}
