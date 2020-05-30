jQuery(function($){
	$.extend( $.fn.dataTable.defaults, { 
		language: { url: "https://retroeater.github.io/mj/Japanese.json" } 
    });
	$('#books').DataTable( {
		ajax: "https://retroeater.github.io/mj/books.json",
		columns: [
			{ data: "author_kanji", className: "dt-body-left", render: function(data,type,row,meta) {
				return data + ' （' + row.author_kana + '）'
				}
			},
			{ data: "publication_date", className: "dt-body-center" },
			{ data: "book_title", className: "dt-body-left", render: function(data,type,row,meta) {
				return data + ' <a href="https://www.amazon.co.jp/dp/' + row.amazon_id + '/" target="_blank"><img alt="Amazon" src="125_arr_hoso.png" height="24" width="24" /></a>'
				}
			},
		],
		fixedHeader: true,
		info: true,
		lengthMenu: [ [20, -1], [20, "全"] ],
		order: [ [ 1, "desc" ] ],
		paging: true,
		searching: true
	} )
})
