const params = (new URL(document.location)).searchParams
let search_name = params.get('name')
let search_joined = params.get('joined')
let search_league = params.get('league')
let search_ouka = params.get('ouka')

if(search_name == 'null') {
	search_name = ''
}

if(search_joined == 'null') {
	search_joined = ''
}

if(search_league == 'null') {
	search_league = ''
}

if(search_ouka == 'null') {
	search_ouka = ''
}

const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=pro&headers=1'

google.charts.load('current', {'packages':['table','controls']});
google.charts.setOnLoadCallback(drawDashboard)

function drawDashboard() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery('SELECT A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,AA,AB,AC,AD,AE,AF,AG,AH,AI,AJ,AK,AL,AM,AN,AO,AP,AQ,AR,AS WHERE Y = "Y"')
	query.send(handleQueryResponse)

	function handleQueryResponse(response) {
		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const chartData = new google.visualization.DataTable()
		chartData.addColumn('string','名前')
		chartData.addColumn('string','ロン2')
		chartData.addColumn('string','Twitter')
		chartData.addColumn('string','Instagram')
		chartData.addColumn('string','YouTube')
		chartData.addColumn('string','ブログ')
		chartData.addColumn('string','雀士<br>名鑑')
		chartData.addColumn('string','Wikipedia')
		chartData.addColumn('string','期<br>入会')
		chartData.addColumn('string','段位')
		chartData.addColumn('string','出身地')
		chartData.addColumn('string','誕生日')
		chartData.addColumn('string','鳳凰<br>出場')
		chartData.addColumn('string','鳳凰<br>39前')
		chartData.addColumn('string','鳳凰<br>最高')
		chartData.addColumn('string','桜花<br>出場')
		chartData.addColumn('string','桜花<br>16期')
		chartData.addColumn('string','桜花<br>最高')
		chartData.addColumn('string','JWRC<br>出場')
		chartData.addColumn('string','特昇<br>出場')
		chartData.addColumn('string','最強<br>出場')
		chartData.addColumn('string','決勝<br>進出')
		chartData.addColumn('string','関連<br>記事')
		chartData.addColumn('string','関連<br>動画')
		chartData.addColumn('string','放送<br>対局')
		chartData.addColumn('string','ロン2<br>平順')
//		chartData.addColumn('string','最終更新')

		const data = response.getDataTable()

		let	name					// A 名前
		let sortKey					// B ソートキー
		let lastNameJaKanji			// C 姓
		let firstNameJaKanji		// D 名
		let lastNameJaKana			// E 姓
		let firstNameJaKana			// F 名
		let lastNameEn				// G Last Name
		let firstNameEn				// H First Name
		let proClass				// I 期
		let joined					// J Joined
		let birthplaceJa			// K 出身地
		let birthplaceEn			// L Birthplace
		let birthday				// M 誕生日
		let ron2Id					// N ロン2
		let twitterId				// O Twitter
		let intagramId				// P Instagram
		let youtubeId				// Q YouTube
		let wikipediaId				// R Wikipedia
		let blogUrl					// S Blog
		let hououLatestLeague		// T 鳳凰戦38期後期リーグ
		let hououHighestLeague		// U 鳳凰戦最高到達リーグ
		let numberOfFinals			// V 決勝進出
		let numberOfArticles		// W 関連記事
		let lastUpdated				// X 最終更新
		let isVisible				// Y 表示
		let remarks					// Z 備考
		let numberOfLives			// AA 放送対局
		let saikyoGames				// AB 最強出場
		let oukaLatestLeague		// AC 15期桜花
		let oukaHighestLeague		// AD 桜花最高
		let danEn					// AE Dan
		let twitterImageUrl			// AF Twitter画像
		let blogImageUrl			// AG Blog画像
		let youTubeImageUrl			// AH YouTube画像
		let hououSeasons			// AI 鳳凰戦出場回数
		let oukaSeasons				// AJ 女流桜花出場回数
		let ron2ImageUrl			// AK ロン2画像
		let numberOfVideos			// AL 関連動画
		let tenhouId				// AM 天鳳ID
		let instgramImageUrl		// AN Instagram画像
		let ron2AveragePlacement	// AO ロン2平均順位
		let jpmlWrcSeasons			// AP JPML WRC出場回数
		let tokushoSeasons			// AQ 特昇出場回数
		let kinmaDirectoryUrl		// AR 雀士名鑑
		let kinmaDirectoryImageUrl	// AS 雀士名鑑画像


		for(let i = 0; i < data.getNumberOfRows(); i++) {

			name = data.getValue(i,0)
			sortKey = data.getValue(i,1)
//			lastNameJaKanji = data.getValue(i,2)
//			firstNameJaKanji = data.getValue(i,3)
//			lastNameJaKana = data.getValue(i,4)
//			firstNameJaKana = data.getValue(i,5)
			lastNameEn = data.getValue(i,6)
			firstNameEn = data.getValue(i,7)
			proClass = data.getValue(i,8)
			joined = data.getValue(i,9)
			birthplaceJa = data.getValue(i,10)
			birthplaceEn = data.getValue(i,11)
			birthday = data.getValue(i,12)
			ron2Id = data.getValue(i,13)
			twitterId = data.getValue(i,14)
			instagramId = data.getValue(i,15)
			youTubeId = data.getValue(i,16)
			wikipediaId = data.getValue(i,17)
			blogUrl = data.getValue(i,18)
			hououLatestLeague = data.getValue(i,19)
			hououHighestLeague = data.getValue(i,20)
			numberOfFinals = data.getValue(i,21)
			numberOfArticles = data.getValue(i,22)
//			lastUpdated = data.getValue(i,23)
//			isVisible = data.getValue(i,24)
//			remarks = data.getValue(i,25)
			numberOfLives = data.getValue(i,26)
			saikyoGames = data.getValue(i,27)
			oukaLatestLeague = data.getValue(i,28)
			oukaHighestLeague = data.getValue(i,29)
			danEn = data.getValue(i,30)
			twitterImageUrl = data.getValue(i,31)
			blogImageUrl = data.getValue(i,32)
			youTubeImageUrl = data.getValue(i,33)
			hououSeasons = data.getValue(i,34)
			oukaSeasons = data.getValue(i,35)
			ron2ImageUrl = data.getValue(i,36)
			numberOfVideos = data.getValue(i,37)
//			tenhouId = data.getValue(i,38)
//			instagramImageUrl = data.getValue(i,39)
			ron2AveragePlacement = data.getValue(i,40)
			jpmlWrcSeasons = data.getValue(i,41)
			tokushoSeasons = data.getValue(i,42)
			kinmaDirectoryUrl = data.getValue(i,43)
			kinmaDirectoryImageUrl = data.getValue(i,44)

			let formattedName = getFormattedName(name,sortKey,lastNameEn,firstNameEn)
			let formattedRon2 = getFormattedRon2(ron2Id,ron2ImageUrl)
			let formattedTwitter = getFormattedTwitter(twitterId,twitterImageUrl)
			let formattedInstagram = getFormattedInstagram(instagramId)
			let formattedYouTube = getFormattedYouTube(youTubeId,youTubeImageUrl)
			let formattedBlog = getFormattedBlog(blogUrl,blogImageUrl)
			let formattedKinmaDirectory = getFormattedKinmaDirectory(kinmaDirectoryUrl,kinmaDirectoryImageUrl)
			let formattedWikipedia = getFormattedWikipedia(wikipediaId)
			let formattedProClass = getFormattedProClass(proClass,joined)
			let formattedDan = getFormattedDan(danEn)			
			let formattedBirthplace = getFormattedBirthplace(birthplaceJa,birthplaceEn)
			let formattedHououSeasons = getFormattedHououSeasons(name,hououSeasons)
			let formattedHououHighestLeague = getFormattedHououHighestLeague(name,hououHighestLeague)
			let formattedOukaSeasons = getFormattedOukaSeasons(name,oukaSeasons)
			let formattedOukaHighestLeague = getFormattedOukaHighestLeague(name,oukaHighestLeague)
			let formattedJpmlWrcSeasons = getFormattedJpmlWrcSeasons(name,jpmlWrcSeasons)
			let formattedTokushoSeasons = getFormattedTokushoSeasons(name,tokushoSeasons)
			let formattedSaikyoGames = getFormattedSaikyoGames(name,saikyoGames)
			let formattedFinals = getFormattedFinals(name,numberOfFinals)
			let formattedArticles = getFormattedArticles(name,numberOfArticles)
			let formattedVideos = getFormattedVideos(name,numberOfVideos)
			let formattedLives = getFormattedLives(name,numberOfLives)
			let formattedRon2AveragePlacement = getFormattedRon2AveragePlacement(name,ron2AveragePlacement)
//			let formattedLastUpdated = getFormattedLastUpdated(lastUpdated)

			chartData.addRows([
				[
					formattedName,
					formattedRon2,
					formattedTwitter,
					formattedInstagram,
					formattedYouTube,
					formattedBlog,
					formattedKinmaDirectory,
					formattedWikipedia,
					formattedProClass,
					formattedDan,
					formattedBirthplace,
					birthday,
					formattedHououSeasons,
					hououLatestLeague,
					formattedHououHighestLeague,
					formattedOukaSeasons,
					oukaLatestLeague,
					formattedOukaHighestLeague,
					formattedJpmlWrcSeasons,
					formattedTokushoSeasons,
					formattedSaikyoGames,
					formattedFinals,
					formattedArticles,
					formattedVideos,
					formattedLives,
					formattedRon2AveragePlacement
//					formattedLastUpdated
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
					label: ' 名前/Name:'
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
					label: ' 期/入会年:'
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
					label: ' 39期前期:'
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
					label: '桜花16期:'
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
	const directoryIcon = 'img/125_arr_hoso.png'

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
		ron2ImageUrl = 'img/125_arr_hoso.png'
	}

	if(ron2Id) {
		formattedRon2 = '<a href="http://www.ron2.jp/pro_profile.html?id=' + ron2Id + '" target="_blank"><img alt="ロン2" class="pros" loading="lazy" src="' + ron2ImageUrl + '" onError="this.onerror=null;this.src=\'img/125_arr_hoso.png\'" /></a>'
	}

	return formattedRon2
}

function getFormattedRon2AveragePlacement(name,ron2AveragePlacement) {

	let formattedRon2AveragePlacement

	if(ron2AveragePlacement) {
		ron2AveragePlacement = ron2AveragePlacement.toFixed(2)
		formattedRon2AveragePlacement = '<span class="' + ron2AveragePlacement + '"><a href="ron2_results.html?name=' + name + '" target="_blank">' + ron2AveragePlacement + '</a></span>'
	}

	return formattedRon2AveragePlacement
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

function getFormattedWikipedia(wikipediaId) {

	let formattedWikipedia

	if(wikipediaId) {
		formattedWikipedia = ' <a href="https://ja.wikipedia.org/wiki/' + wikipediaId + '" target="_blank"><img alt="Wikipedia" class="pros" src="img/Wikipedia%27s_W.svg" /></a> '
	}

	return formattedWikipedia	
}

function getFormattedYouTube(youTubeId,youTubeImageUrl) {

	let formattedYouTube
	const youtubeIcon = 'img/youtube.svg'

	if(youTubeId) {
		formattedYouTube = '<a href="http://youtube.com/channel/' + youTubeId + '" target="_blank"><img alt="YouTube" class="pros" loading="lazy" src="' + youTubeImageUrl + '" onError="this.onerror=null;this.src=\'' + youtubeIcon + '\'" /></a>'
	}

	return formattedYouTube	
}
