google.charts.load('current', {
		'packages':['geochart'],
		// Note: you will need to get a mapsApiKey for your project.
		// See: https://developers.google.com/chart/interactive/docs/basic_load_libs#load-settings
		'mapsApiKey': 'AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY'
	}
)

google.charts.setOnLoadCallback(drawRegionsMap)

function drawRegionsMap() {
	var data = google.visualization.arrayToDataTable([
		['都道府県', '人数'],
		['愛知県',13],
		['愛媛県',4],
		['茨城県',8],
		['岡山県',2],
		['岐阜県',2],
		['宮崎県',3],
		['宮城県',7],
		['京都府',3],
		['熊本県',2],
		['群馬県',4],
		['広島県',4],
		['高知県',1],
		['埼玉県',12],
		['三重県',4],
		['山形県',1],
		['山口県',3],
		['山梨県',2],
		['滋賀県',2],
		['鹿児島県',1],
		['秋田県',6],
		['新潟県',4],
		['神奈川県',26],
		['青森県',6],
		['静岡県',15],
		['石川県',4],
		['千葉県',21],
		['大阪府',4],
		['大分県',1],
		['長野県',5],
		['鳥取県',1],
		['東京都',72],
		['栃木県',5],
		['奈良県',1],
		['富山県',5],
		['福井県',3],
		['福岡県',10],
		['福島県',2],
		['兵庫県',7],
		['北海道',10]
	])

	var options = {
		region: 'JP',
		resolution: 'provinces',
		displayMode: 'regions',
		regioncoderVersion:1,
		colors:['yellow','green']
	}

	var chart = new google.visualization.GeoChart(document.getElementById('regions_div'))

	chart.draw(data, options)
}
