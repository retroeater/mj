const params = (new URL(document.location)).searchParams
const search_name = params.get('name')
const search_joined = params.get('joined')
const search_league = params.get('league')

if(search_name == 'null') {
	search_name = ''
}

if(search_joined == 'null') {
	search_joined = ''
}

if(search_league == 'null') {
	search_league = ''
}

const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=jpml_pros&headers=1'

google.charts.load('current', {'packages':['table','controls']});
google.charts.setOnLoadCallback(drawDashboard)

function drawDashboard() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery('SELECT A,B,C,D,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,AA,AB WHERE Y = "Y"')
	query.send(handleQueryResponse)
	/*
		0	A	主キー
		1	B	ソートキー
		2	C	姓
		3	D	名
		4	G	Last Name
		5	H	First Name
		6	I	期
		7	J	入会年
		8	K	出身地
		9	L	Birthplace
		10	M	誕生日
		11	N	ロン2
		12	O	Twitter
		13	P	Instagram
		14	Q	YouTube
		15	R	Wikipedia
		16	S	Blog
		17	T	38期前期リーグ
		18	U	最高到達リーグ
		19	V	決勝戦進出数
		20	W	記事数
		21	X	最終更新日
		-	Y	表示
		22	AA	放送対局
		23	AB	段位
		24	-	決勝戦リンク付
		25	-	記事リンク付
		26	-	放送対局リンク付
	*/

	function handleQueryResponse(response) {
		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const data = response.getDataTable()

		data.addColumn('string', '決勝進出<br>Fonals')
		data.addColumn('string', '関連記事<br>Articles')
		data.addColumn('string', '放送対局<br>Live')

		for(let i = 0; i < data.getNumberOfRows(); i++) {

			// ロン2フォーマット
			let formattedRon2 = getFormattedRon2(data,i)

			// 名前フォーマット
			let formattedName = getFormattedName(data,i)

			// Twitterフォーマット
			let formattedTwitter = getFormattedTwitter(data,i)

			// Instagramフォーマット
			let formattedInstagram = getFormattedInstagram(data,i)

			// YouTubeフォーマット
			let formattedYouTube = getFormattedYouTube(data,i)

			// Wikiperiaフォーマット
			let formattedWikipedia = getFormattedWikipedia(data,i)

			// Blogフォーマット
			let formattedBlog = getFormattedBlog(data,i)

			// 期フォーマット
			let formattedClass = getFormattedClass(data,i)

			// 出身地フォーマット
			let formattedBirthplace = getFormattedBirthplace(data,i)

			// 直近リーグフォーマット
			let formattedLatestLeague = getFormattedLatestLeague(data,i)

			// 最高到達リーグフォーマット
			let formattedHighestLeague = getFormattedHighestLeague(data,i)

			// 決勝進出フォーマット
			let formattedFinals = getFormattedFinals(data,i)

			// 関連記事フォーマット
			let formattedArticles = getFormattedArticles(data,i)

			// 放送対局フォーマット
			let formattedLives = getFormattedLives(data,i)

			data.setValue(i, 2, formattedRon2 + formattedName)
			data.setValue(i, 6, formattedClass)
			data.setValue(i, 8, formattedBirthplace)
			data.setValue(i, 12, formattedTwitter)
			data.setValue(i, 13, formattedInstagram)
			data.setValue(i, 14, formattedYouTube)
			data.setValue(i, 15, formattedWikipedia)
			data.setValue(i, 16, formattedBlog)
			data.setValue(i, 17, formattedLatestLeague)
			data.setValue(i, 18, formattedHighestLeague)
			data.setValue(i, 24, formattedFinals)
			data.setValue(i, 25, formattedArticles)
			data.setValue(i, 26, formattedLives)
		}

		data.setColumnLabel(2, '名前<br>Name')
		data.setColumnLabel(6, '期<br>Joined')
		data.setColumnLabel(8, '出身地<br>Birthplace')
		data.setColumnLabel(10, '誕生日<br>Birthday')
		data.setColumnLabel(12, 'Twitter')
		data.setColumnLabel(13, 'Instagram')
		data.setColumnLabel(14, 'YouTube')
		data.setColumnLabel(15, 'Wikipedia')
		data.setColumnLabel(16, 'Blog')
		data.setColumnLabel(17, '38期前期<br>2021/04')
		data.setColumnLabel(18, '最高到達<br>Highest')
		data.setColumnLabel(21, '最終更新日<br>Updated')
		data.setColumnLabel(23, '段位<br>Dan')
		data.setColumnLabel(24, '決勝進出<br>Finals')
		data.setColumnLabel(25, '関連記事<br>Articles')
		data.setColumnLabel(26, '放送対局<br>Live')

		const dashboard = new google.visualization.Dashboard(document.getElementById('dashboard_div'))

		const nameFilter = new google.visualization.ControlWrapper({
			controlType: 'StringFilter',
			containerId: 'name_filter_div',
			options: {
				filterColumnIndex: 0,
				matchType: 'any',
				ui: {
					label: ' 名前/Name:'
				},
				state: {
					value: search_name
				}
			}
		})

		const classFilter = new google.visualization.ControlWrapper({
			controlType: 'StringFilter',
			containerId: 'class_filter_div',
			options: {
				filterColumnIndex: 6,
				matchType: 'any',
				ui: {
					label: ' 期/Joined:'
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
				filterColumnIndex: 9,
				matchType: 'any',
				ui: {
					label: ' 38期前期:'
				}
			},
			state: {
				value: search_league
			}
		})

		const table = new google.visualization.ChartWrapper({
			'chartType': 'Table',
			containerId: 'myTable',
			options : {
				allowHtml: true,
				width: '100%',
				height: '100%',
				sortColumn: 0
			},
			state: {
				value: search_joined
			}			
		})

		// 必要列のみ表示
		const view = new google.visualization.DataView(data)
		view.setColumns([2,12,13,14,15,16,6,23,8,10,17,18,24,25,26,21])

		dashboard.bind([nameFilter,classFilter,leagueFilter], table)
		dashboard.draw(view)
	}
}

function getFormattedArticles(data,rowIndex) {

	const name = data.getValue(rowIndex,0)
	const numberOfArticles = data.getValue(rowIndex,20)

	let sortKey = ""
	let formattedArticles = ""

	if(numberOfArticles != 0) {
		sortKey = ('0000' + numberOfArticles).slice(-4)
		formattedArticles = '<span class="' + sortKey + '">' + '<a href="./jpml_articles.html?name=' + name + '" target="_blank">' + numberOfArticles + '件</a></span>'
	}

	return formattedArticles
}

function getFormattedBirthplace(data,rowIndex) {

	const birthplaceJa = data.getValue(rowIndex,8)
	const birthplaceEn = data.getValue(rowIndex,9)

	let formattedBirthplace = ""

	if(birthplaceJa) {
		formattedBirthplace = '<span class="' + birthplaceEn + '">' + birthplaceJa + '<br>' + birthplaceEn + '</span>'
	}

	return formattedBirthplace
}

function getFormattedBlog(data,rowIndex) {

	const blogUrl = data.getValue(rowIndex,16)

	let formattedBlog = ""

	if(blogUrl) {
		formattedBlog = '<a href="' + blogUrl + '" target="_blank"><img alt="Blog" src="img/797_me_h.png" height="32" width="32" /></a>'
	}

	return formattedBlog
}

function getFormattedClass(data,rowIndex) {

	const classJa = data.getValue(rowIndex,6)
	const classEn = data.getValue(rowIndex,7)

	let formattedClass = ""

	if(classJa) {
		formattedClass = '<span class="' + classEn + '">' + classJa + '期<br>' + classEn + '</span>'
	}

	return formattedClass
}

function getFormattedFinals(data,rowIndex) {

	const name = data.getValue(rowIndex,0)
	const numberOfFinals = data.getValue(rowIndex,19)

	let sortKey = ""
	let formattedFinals = ""

	if(numberOfFinals != 0) {
		sortKey = ('0000' + numberOfFinals).slice(-4)
		formattedFinals = '<span class="' + sortKey + '">' + '<a href="./jpml_titles.html?name=' + name + '" target="_blank">' + numberOfFinals + '回</a></span>'
	}

	return formattedFinals	
}

function getFormattedLives(data,rowIndex) {

	const name = data.getValue(rowIndex,0)
	const numberOfLives = data.getValue(rowIndex,22)

	let sortKey = ""
	let formattedLives = ""

	if(numberOfLives != 0) {
		sortKey = ('0000' + numberOfLives).slice(-4)
		formattedLives = '<span class="' + sortKey + '">' + '<a href="./jpml_live.html?name=' + name + '&status=ALL" target="_blank">' + numberOfLives + '件</a></span>'
	}

	return formattedLives
}

function getFormattedName(data,rowIndex) {

	let lastNameJpKanji = data.getValue(rowIndex,2)
	let firstNameJpKanji = data.getValue(rowIndex,3)
	let lastNameEn = data.getValue(rowIndex,4)
	let firstNameEn = data.getValue(rowIndex,5)

	// nullを空文字列に変換
	if(!firstNameJpKanji) {firstNameJpKanji = ""}
	if(!lastNameEn)        {lastNameEn = ""}
	if(!firstNameEn)       {firstNameEn = ""}

	let formattedName = lastNameJpKanji + firstNameJpKanji + '<br><img alt="" src="img/empty.png" height="32" width="32" /> ' + lastNameEn + ' ' + firstNameEn

	return formattedName
}

function getFormattedLatestLeague(data,rowIndex) {

	const latestLeague = data.getValue(rowIndex,17)

	let sortKey = ""
	let formattedLatestLeague = ""

	if(latestLeague == "鳳凰位") {
		sortKey = "0"
		formattedLatestLeague = latestLeague
	}
	else if(latestLeague) {
		sortKey = latestLeague
		formattedLatestLeague = latestLeague
	}
	else {
		sortKey = "ZZ"
		formattedLatestLeague = ""
	}

	formattedLatestLeague = '<span class="' + sortKey + '">' + formattedLatestLeague + '</span>'

	return formattedLatestLeague
}

function getFormattedHighestLeague(data,rowIndex) {

	const name = data.getValue(rowIndex,0)
	const highestLeague  = data.getValue(rowIndex,18)

	let sortKey = ""
	let formattedHighestLeague = ""

	if(highestLeague == "鳳凰位") {
		sortKey = "00"
	}
	else {
		sortKey = highestLeague
	}

	if(highestLeague) {
		formattedHighestLeague = '<span class="' + sortKey + '">' + '<a href="./jpml_leagues.html?name=' + name + '" target="_blank">' + highestLeague + '</a></span>'
	}

	return formattedHighestLeague
}

function getFormattedRon2(data,rowIndex) {

	const lastNameEn = data.getValue(rowIndex,4)
	const firstNameEn = data.getValue(rowIndex,5)
	const ron2Id = data.getValue(rowIndex,11)

	let sortKey = ""
	let formattedRon2 = ""

	sortKey = lastNameEn + ' ' + firstNameEn

	if(ron2Id) {
		formattedRon2 = '<span class="' + sortKey + '">' + '<a href="http://www.ron2.jp/pro_profile.html?id=' + ron2Id + '" target="_blank"><img alt="ロン2" src="img/125_arr_hoso.png" height="32" width="32" /></a></span> '
	}
	else {
		formattedRon2 = '<span class="' + sortKey + '">' + '<img alt="" src="img/empty.png" height="29" width="29" /></span> '
	}

	return formattedRon2
}

function getFormattedTwitter(data,rowIndex) {
	
	const twitterId = data.getValue(rowIndex,12)

	let formattedTwitter = ""
	
	if(twitterId) {
		formattedTwitter += ' <a href="http://twitter.com/' + twitterId + '" target="_blank"><img alt="Twitter" src="img/Twitter_Logo_Blue.svg" height="48" width="48" /></a> '
	}
	
	return formattedTwitter	
}

function getFormattedInstagram(data,rowIndex) {
	
	const instagramId = data.getValue(rowIndex,13)

	let formattedInstagram = ""
	
	if(instagramId) {
		formattedInstagram += ' <a href="http://instgram.com/' + instagramId + '" target="_blank"><img alt="Instagram" src="img/glyph-logo_May2016.png" height="29" width="29" /></a> '
	}
	
	return formattedInstagram
}

function getFormattedYouTube(data,rowIndex) {
	
	const youtubeId = data.getValue(rowIndex,14)

	let formattedYouTube = ""
	
	if(youtubeId) {
		formattedYouTube += ' <a href="http://youtube.com/channel/' + youtubeId + '" target="_blank"><img alt="YouTube" src="img/youtube_social_icon_red.png" height="26" width="37" /></a> '
	}
	
	return formattedYouTube	
}

function getFormattedWikipedia(data,rowIndex) {
	
	const wikiId = data.getValue(rowIndex,15)

	let formattedWikipedia = ""
	
	if(wikiId) {
		formattedWikipedia += ' <a href="https://ja.wikipedia.org/wiki/' + wikiId + '" target="_blank"><img alt="Wiki" src="img/Wikipedia%27s_W.svg" height="36" width="36" /></a> '
	}
	
	return formattedWikipedia	
}
