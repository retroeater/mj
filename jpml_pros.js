const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=jpml_pros'

google.charts.load('current', {'packages':['table','controls']});
google.charts.setOnLoadCallback(drawDashboard)

function drawDashboard() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery('SELECT C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,W,A WHERE V = "Y" ORDER BY B ASC')
	query.send(handleQueryResponse)
	/*
		0	C	姓
		1	D	名
		2	E	せい
		3	F	めい
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
		17	T	37期後期リーグ
		18	U	最高到達リーグ
		-	V	表示
		19	W	記事数
		20	A	主キー
	*/

	function handleQueryResponse(response) {
		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const data = response.getDataTable()

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
				
				// 関連記事フォーマット
				let formattedArticles = getFormattedArticles(data,i)

				data.setValue(i, 0, formattedRon2 + formattedName)
				data.setValue(i, 6, formattedClass)
				data.setValue(i, 8, formattedBirthplace)
				data.setValue(i, 12, formattedTwitter)
				data.setValue(i, 13, formattedInstagram)
				data.setValue(i, 14, formattedYouTube)
				data.setValue(i, 15, formattedWikipedia)
				data.setValue(i, 16, formattedBlog)
				data.setValue(i, 17, formattedLatestLeague)
				data.setValue(i, 18, formattedHighestLeague)
				data.setValue(i, 19, formattedArticles)
		}

		data.setColumnLabel(0, '名前<br>Name')
		data.setColumnLabel(6, '期<br>Joined')
		data.setColumnLabel(8, '出身地<br>Birthplace')
		data.setColumnLabel(10, '誕生日<br>Birthday')
		data.setColumnLabel(12, 'Twitter')
		data.setColumnLabel(13, 'Instagram')
		data.setColumnLabel(14, 'YouTube')
		data.setColumnLabel(15, 'Wikipedia')
		data.setColumnLabel(16, 'Blog')
		data.setColumnLabel(17, '37期後期<br>2021/01')
		data.setColumnLabel(18, '最高到達<br>Highest')
		data.setColumnLabel(19, '関連記事<br>Articles')

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
			}
		})

		const table = new google.visualization.ChartWrapper({
			'chartType': 'Table',
			containerId: 'myTable',
			options : {
				allowHtml: true,
				width: '100%',
				height: '100%'
			}
		})

		// 必要列のみ表示
		const view = new google.visualization.DataView(data)
		view.setColumns([0,12,13,14,15,16,6,8,10,17,18,19])

		dashboard.bind([nameFilter], table)
		dashboard.draw(view)
	}
}

function getFormattedArticles(data,row_index) {

	const name = data.getValue(row_index,20)
	const number_of_articles = data.getValue(row_index,19)

	let formattedArticles = ""

	if(number_of_articles != "0件") {
		formattedArticles = number_of_articles + ' <a href="./jpml_articles.html?name=' + name + '" target="_blank"><img alt="記事・動画" src="img/note_hoso.png" height="32" width="32" /></a>'
	}

	return formattedArticles
}

function getFormattedBirthplace(data,row_index) {

	const birthplace_ja = data.getValue(row_index,8)
	const birthplace_en = data.getValue(row_index,9)

	let formattedBirthplace = ""

	if(birthplace_ja) {
		formattedBirthplace = birthplace_ja + '<br>' + birthplace_en
	}

	return formattedBirthplace
}

function getFormattedBlog(data,row_index) {

	const blog_url = data.getValue(row_index,16)

	let formattedBlog = ""

	if(blog_url) {
		formattedBlog = '<a href="' + blog_url + '" target="_blank"><img alt="Blog" src="img/797_me_h.png" height="32" width="32" /></a>'
	}

	return formattedBlog
}

function getFormattedClass(data,row_index) {

	const class_ja = data.getValue(row_index,6)
	const class_en = data.getValue(row_index,7)

	let formattedClass = ""

	if(class_ja) {
		formattedClass += class_ja + '期<br>' + class_en
	}

	return formattedClass
}

function getFormattedRon2(data,row_index) {

	const ron2_id = data.getValue(row_index,11)

	let formattedRon2 = ""

	if(ron2_id) {
		formattedRon2 += '<a href="http://www.ron2.jp/pro_profile.html?id=' + ron2_id + '" target="_blank"><img alt="ロン2" src="img/125_arr_hoso.png" height="32" width="32" /></a> '
	}
	else {
		formattedRon2 += '<img alt="" src="img/empty.png" height="29" width="29" /> '
	}

	return formattedRon2
}

function getFormattedName(data,row_index) {

	let last_name_jp_kanji = data.getValue(row_index,0)
	let first_name_jp_kanji = data.getValue(row_index,1)
	let last_name_en = data.getValue(row_index,4)
	let first_name_en = data.getValue(row_index,5)

	// nullを空文字列に変換
	if(!first_name_jp_kanji) {first_name_jp_kanji = ""}
	if(!last_name_en)        {last_name_en = ""}
	if(!first_name_en)       {first_name_en = ""}

	let formattedName = last_name_jp_kanji + first_name_jp_kanji + '<br><img alt="" src="img/empty.png" height="32" width="32" /> ' + first_name_en + ' ' + last_name_en

	return formattedName
}

function getFormattedLatestLeague(data,row_index) {

	const latest_league  = data.getValue(row_index,17)

	let formattedLatestLeague = ""

	formattedLatestLeague = getFormattedLeague(latest_league)

	return formattedLatestLeague
}

function getFormattedHighestLeague(data,row_index) {

	const name = data.getValue(row_index,20)
	const highest_league  = data.getValue(row_index,18)

	let formattedHighestLeague = ""

	formattedHighestLeague = getFormattedLeague(highest_league) + ' <a href="./jpml_leagues.html?name=' + name + '" target="_blank"><img alt="リーグ推移" src="img/chart_bar_line_hoso.png" height="32" width="32" /></a>'

	return formattedHighestLeague
}

function getFormattedLeague(league) {

	let formattedLeague = ""

	if(league) {
		formattedLeague = league

		if(league == '鳳凰位') {
			formattedLeague += '<br>Champion'
		}
	}
	
	return formattedLeague
}

function getFormattedTwitter(data,row_index) {
	
	const twitter_id = data.getValue(row_index,12)

	let formattedTwitter = ""
	
	if(twitter_id) {
		formattedTwitter += ' <a href="http://twitter.com/' + twitter_id + '" target="_blank"><img alt="Twitter" src="img/Twitter_Logo_Blue.svg" height="48" width="48" /></a> '
	}
	
	return formattedTwitter	
}

function getFormattedInstagram(data,row_index) {
	
	const instagram_id = data.getValue(row_index,13)

	let formattedInstagram = ""
	
	if(instagram_id) {
		formattedInstagram += ' <a href="http://instgram.com/' + instagram_id + '" target="_blank"><img alt="Instagram" src="img/glyph-logo_May2016.png" height="29" width="29" /></a> '
	}
	
	return formattedInstagram	
}

function getFormattedYouTube(data,row_index) {
	
	const youtube_id = data.getValue(row_index,14)

	let formattedYouTube = ""
	
	if(youtube_id) {
		formattedYouTube += ' <a href="http://youtube.com/channel/' + youtube_id + '" target="_blank"><img alt="YouTube" src="img/youtube_social_icon_red.png" height="26" width="37" /></a> '
	}
	
	return formattedYouTube	
}

function getFormattedWikipedia(data,row_index) {
	
	const wiki_id = data.getValue(row_index,15)

	let formattedWikipedia = ""
	
	if(wiki_id) {
		formattedWikipedia += ' <a href="https://ja.wikipedia.org/wiki/' + wiki_id + '" target="_blank"><img alt="Wiki" src="img/Wikipedia%27s_W.svg" height="36" width="36" /></a> '
	}
	
	return formattedWikipedia	
}
