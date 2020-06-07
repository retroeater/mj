jQuery(function($){
	$('#jpml').DataTable( {
		ajax: "https://retroeater.github.io/mj/en/jpml.json",
		columns: [
			{ data: "league_36_2", className: "dt-body-center", render: function(data,type,row,meta) {
					if(data) {
						if(row.rank_36_2) {
							return data + ' ' + row.rank_36_2 + '位'
						}
						else {
							return data
						}
					}
					else {
						return null
					}
				}
			},
			{ data: "name_last_ja_kanji", className: "dt-body-left", render: function(data,type,row,meta) {
				var name = ""

				// ロン2プロフィール
				if(row.ron2_id) {
					name += '<a href="http://www.ron2.jp/pro_profile.html?id=' + row.ron2_id + '" target="_blank"><img alt="ロン2" src="img/125_arr_hoso.png" height="29" width="29" /><\/a>'
				}
				else {
					name += '<img alt="" src="img/empty.png" height="29" width="29">'
				}

				// 名前（姓）
				name += ' ' + row.name_last_ja_kanji

				// 名前（名）
				if(row.name_first_ja_kanji) {
					name += ' ' + row.name_first_ja_kanji
				}

				// ふりがな（姓）
				if(row.name_last_ja_kana) {
					name += ' （' + row.name_last_ja_kana

					// ふりがな（名）
					if(row.name_first_ja_kana) {
						name += ' ' + row.name_first_ja_kana
					}
					name += '）'
				}

				// Name (Last)
				if(row.name_last_en) {
					name += ' ' + row.name_last_en

					// Name (First)
					if(row.name_first_en) {
						name += ' ' + row.name_first_en
					}
				}

				// Twitter
				if(row.twitter_id) {
					name += ' <a href="https://twitter.com/' + row.twitter_id + '" target="_blank"><img alt="Twitter" src="img/Twitter_Logo_Blue.png" height="29" width="29"><\/a>'
				}

				// Instagram
				if(row.instagram_id) {
					name += ' <a href="https://instagram.com/' + row.instagram_id + '" target="_blank"><img alt="Instagram" src="img/Instagram_AppIcon_Aug2017.png" height="29" width="29"><\/a>'
				}

				// YouTube
				if(row.youtube_id) {
					name += ' <a href="https://youtube.com/channel/' + row.youtube_id + '" target="_blank"><img alt="YouTube" src="img/youtube_social_icon_red.png" height="20" width="29"><\/a>'
				}

				// Wikipedia
				if(row.wiki_id) {
					name += ' <a href="https://ja.wikipedia.org/wiki/' + row.wiki_id + '" target="_blank"><img alt="Wikipedia" src="img/Wikipedia.svg" height="29" width="29"><\/a>'
				}

				return name
			}},
			{ data: "class", className: "dt-body-center", render: function(data,type,row,meta) {
					if(data) {
						return data + '期' + ' / ' + row.year_joined
					}
					else {
						return data
					}
				}
			},
			{ data: "birthplace_ja", className: "dt-body-center", render: function(data,type,row,meta) {
					return data + ' / ' + row.birthplace_en
				}
			},
			{ data: "birthday", className: "dt-body-center"}
		],
		fixedHeader: true,
		info: true,
		lengthMenu: [ [20, 50, 100, -1], [20, 50, 100, "All"] ],
		order: true,
		paging: true,
		searching: true
	} )
})
