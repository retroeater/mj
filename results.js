jQuery(function($){
	$.extend( $.fn.dataTable.defaults, { 
		language: { url: "https://retroeater.github.io/mj/Japanese.json" } 
    })
	$('#result_summary').DataTable( {
		ajax: "https://retroeater.github.io/mj/results_summary.json",
		columns: [
			{ data: "year", className: "dt-body-center" },
			{ data: "score", className: "dt-body-right", render: function(data,type,row,meta) { 
					if(row.score >= 0) {
						return '+' + data.toFixed(1)
					} else {
						return '▲' + (Math.abs(data)).toFixed(1)
					}
				}
			},
			{ data: "average_rank", className: "dt-body-center", render: function(data,type,row,meta) {
					return data.toFixed(2)
				}
			},
			{ data: "1st_ratio", className: "dt-body-center", render: function(data,type,row,meta) {
					return data.toFixed(3)
				}
			},
			{ data: "non_4th_ratio", className: "dt-body-center", render: function(data,type,row,meta) {
					return data.toFixed(3)
				}
			},			
			{ data: "number_of_games", className: "dt-body-right" }
		],
		info: false,
		order: [ [ 0, "desc" ] ],
		paging: false,
		searching: false
	})
	$("#result_details").dataTable( {
		ajax: "https://retroeater.github.io/mj/results_details.json",
		columns: [
			{ data: "date", className: "dt-body-center" },
			{ data: "game_id", visible: false },
			{ data: "organization", className: "dt-body-left" },
			{ data: "title", className: "dt-body-left", visible: false },
			{ data: "game", className: "dt-body-left", render: function(data,type,row,meta) {
					if(row.twitter_url) {
						return data + ' <a href="' + row.twitter_url + '" target="_blank"><img src="img/Twitter_Logo_Blue.png" class="twitter" height="24" width="24"><\/a>'
					} else {
						return data
					}
				}
			},
			{ data: "players", className: "dt-body-left" },
			{ data: "ranks", className: "dt-body-left" },
			{ data: "score", className: "dt-body-right", render: function(data,type,row,meta) {
					if(row.score >= 0) {
						return '+' + data.toFixed(1)
					} else {
						return '▲' + (Math.abs(data)).toFixed(1)
					}
				}
			},
			{ data: "result", className: "dt-body-center" }
		],
		fixedHeader: true,
		lengthMenu: [ [20, 50, -1], [20, 50, "全"] ],
		order: [ [ 1, "desc" ] ]
	})
})
