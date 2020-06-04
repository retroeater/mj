jQuery(function($){
	$.extend( $.fn.dataTable.defaults, { 
		language: { url: "https://cdn.datatables.net/plug-ins/1.10.21/i18n/Japanese.json" } 
    })
	$('#jpml').DataTable( {
		ajax: "https://retroeater.github.io/mj/en/jpml.json",
		columns: [
			{ data: "league_36_2", className: "dt-body-center", render: function(data,type,row,meta) {
					if(data) {
						if(row.rank_36_2) {
							return data + ' ' + row.rank_36_2
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
			{ data: "name_last_en", className: "dt-body-left", render: function(data,type,row,meta) {
				var name = ""

				// Instagram
				if(row.instagram_id) {
					name += '<a href="https://instagram.com/' + row.instagram_id + '" target="_blank"><img alt="Instagram" src="img/Instagram_AppIcon_Aug2017.png" height="29" width="29"><\/a> '
				}
				else {
					name += '<img alt="" src="img/empty.png" height="29" width="29"> '
				}

				// Twitter
				if(row.twitter_id) {
					name += '<a href="https://twitter.com/' + row.twitter_id + '" target="_blank"><img alt="Twitter" src="img/Twitter_Logo_Blue.png" height="29" width="29"><\/a> '
				}
				else {
					name += '<img alt="" src="img/empty.png" height="29" width="29"> '
				}

				name += data

				// First Name
				if(row.name_first_en) {
					name += ' ' + row.name_first_kanji
				}

				// Ron2 Profile
				if(row.ron2_id) {
					name += ' ' + ' <a href="http://www.ron2.jp/pro_profile.html?id=' + row.ron2_id + '" target="_blank"><img alt="ロン2" src="img/125_arr_hoso.png" height="29" width="29" /><\/a>'
				}
				return name
			}},
			{ data: "class", className: "dt-body-center", render: function(data,type,row,meta) {
					if(data) {
						return data
					}
					else {
						return data
					}
				}
			},
			{ data: "birthplace_en", className: "dt-body-center" },
			{ data: "birthday", className: "dt-body-center"}
		],
		fixedHeader: true,
		info: true,
		lengthMenu: [ [20, 50, 100, -1], [20, 50, 100, "全"] ],
		order: true,
		paging: true,
		searching: true
	} )
})
