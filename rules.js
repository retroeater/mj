jQuery(function($){
	$.extend( $.fn.dataTable.defaults, { 
		language: { url: "Japanese.json" } 
    })
	$('#rules').DataTable( {
		ajax: "https://retroeater.github.io/mj/rules.json",
		columns: [
			{ data: "id", visible: false },
			{ data: "game", className: "dt-body-center" },
			{ data: "hand", className: "dt-body-center" },
			{ data: "category", className: "dt-body-left" },
			{ data: "subcategory", className: "dt-body-left" },
			{ data: "nipponclub", className: "dt-body-center" },
			{ data: "jpml", className: "dt-body-center" },
			{ data: "jpmlwrc", className: "dt-body-center" },
			{ data: "wrc", className: "dt-body-center" },
			{ data: "saikyosen", className: "dt-body-center" },
			{ data: "mleague", className: "dt-body-center" }
		],
		fixedHeader: true,
		info: false,
		order: [ [ 0, "asc" ] ],
		paging: false,
		searching: true,
		sort: false
	})
})
