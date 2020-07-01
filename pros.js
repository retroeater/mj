var spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1z2VHx8tNBi_4T8i8tDCyqv8lkgYD8QdqwGf6WpX9ZdQ/edit#gid=0'

google.charts.load('current', {'packages':['table']});
google.charts.setOnLoadCallback(drawTable);

function drawTable() {
	var query = new google.visualization.Query(spreadsheet_url)
	query.setQuery('SELECT A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S')
	query.send(handleQueryResponse)

	function handleQueryResponse(response) {
		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		var data = response.getDataTable()

		var table = new google.visualization.Table(document.getElementById('myTable'));

		for(let i = 0; i < data.getNumberOfRows(); i++) {

				// リーグ・順位フォーマット
				let formattedRank = getFormattedRank(data,i)

				// 名前フォーマット
				let formattedName = getFormattedName(data,i)

				// 外部リンクフォーマット
				let formattedLinks = getFormattedLinks(data,i)

				// 期フォーマット
				let formattedClass = getFormattedClass(data,i)

				// 出身地フォーマット
				let formattedBirthplace = getFormattedBirthplace(data,i)

				data.setValue(i, 0, formattedName + formattedLinks)
				data.setValue(i, 6, formattedClass)
				data.setValue(i, 8, formattedBirthplace)
				data.setValue(i, 17, formattedRank)
		}

		var options = {
			allowHtml: true,
			width: '100%',
			height: '100%'
		}

		// 必要列のみ表示
		var view = new google.visualization.DataView(data)
		view.setColumns([17,0,6,8,10])

		table.draw(view, options);
	}
}

function getFormattedBirthplace(data,row_index) {

	let birthplace_ja = data.getValue(row_index,8)
	let birthplace_en = data.getValue(row_index,9)

	let formattedBirthplace = ""

	if(birthplace_ja) {
		formattedBirthplace = birthplace_ja + ' / ' + birthplace_en
	}

	return formattedBirthplace
}

function getFormattedClass(data,row_index) {

	let class_ja = data.getValue(row_index,6)
	let class_en = data.getValue(row_index,7)

	let formattedClass = ""

	if(class_ja) {
		formattedClass += class_ja + '期 / ' + class_en
	}

	return formattedClass
}

function getFormattedLinks(data,row_index) {
	
	let ron2_id = data.getValue(row_index,11)
	let twitter_id = data.getValue(row_index,12)
	let instagram_id = data.getValue(row_index,13)
	let youtube_id = data.getValue(row_index,14)
	let wiki_id = data.getValue(row_index,15)

	let formattedLinks = ""
	
	// ロン2
	if(ron2_id) {
		formattedLinks += ' <a href="http://www.ron2.jp/pro_profile.html?id=' + ron2_id + '" target="_blank"><img alt="ロン2" src="img/125_arr_hoso.png" height="29" width="29" /></a> '
	}

	// Twitter
	if(twitter_id) {
		formattedLinks += ' <a href="http://twitter.com/' + twitter_id + '" target="_blank"><img alt="Twitter" src="img/Twitter_Logo_Blue.svg" height="29" width="29" /></a> '
	}

	// Instagram
	if(instagram_id) {
		formattedLinks += ' <a href="http://instgram.com/' + instagram_id + '" target="_blank"><img alt="Instagram" src="img/glyph-logo_May2016.png" height="29" width="29" /></a> '
	}

	// YouTube
	if(youtube_id) {
		formattedLinks += ' <a href="http://youtube.com/channel/' + youtube_id + '" target="_blank"><img alt="YouTube" src="img/youtube_social_icon_red.png" height="20" width="29" /></a> '
	}

	// Wiki
	if(wiki_id) {
		formattedLinks += ' <a href="https://ja.wikipedia.org/wiki/' + wiki_id + '" target="_blank"><img alt="Wiki" src="img/Wikipedia%27s_W.svg" height="29" width="29" /></a> '
	}

	return formattedLinks
}

function getFormattedName(data,row_index) {

	let last_name_jp_kanji = data.getValue(row_index,0)
	let first_name_jp_kanji = data.getValue(row_index,1)
	let last_name_jp_kana = data.getValue(row_index,2)
	let first_name_jp_kana = data.getValue(row_index,3)
	let last_name_en = data.getValue(row_index,4)
	let first_name_en = data.getValue(row_index,5)

	let formattedName = last_name_jp_kanji + ' ' + first_name_jp_kanji

	if(last_name_jp_kana) {
		formattedName += ' （' + last_name_jp_kana + ' ' + first_name_jp_kana + '） ' + first_name_en + ' ' + last_name_en
	}

	return formattedName
}

function getFormattedRank(data,row_index) {
	
	let league = data.getValue(row_index,17)
	let rank = data.getValue(row_index,18)

	let formattedRank = ""
	let ordinalIndicator = ""

	if(league) {
		if(rank) {
			formattedRank = league + 'リーグ ' + rank + '位<br>' + league + ' League ' + rank + getOrdinalIndicator(rank)
		}
		else if(league == '鳳凰位') {
			formattedRank = league + '<br>Champion'
		}
		else {
			formattedRank = league + 'リーグ<br>' + league + ' League' 
		}
	}

	return formattedRank
}

function getOrdinalIndicator(n) {

	let ordinalIndicator = ""
	
	if(n > 3 && n < 21) {
		ordinalIndicator = 'th'
	}
	else {
		switch(n % 10) {
			case 1:
				ordinalIndicator = 'st'
				break
			case 2:
				ordinalIndicator = 'nd'
				break
			case 3:
				ordinalIndicator = 'rd'
				break
			default:
				ordinalIndicator = 'th'
				break
		}
	}

	return ordinalIndicator
}
