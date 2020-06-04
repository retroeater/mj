var title       = 'League/Class as of Jan 2020'
var classes     = [ 1,1, 3, 3,5,7,8,10,10,11,11,11,12,13,13,13,14,14,14,15,16,16,16,16,17,17,17,17,17,18,18,18,18,18,19,19,19,19,19,20,20,20,20,21,21,21,21,21,21,21,22,22,22,22,22,22,22,23,23,23,23,23,23,23,23,23,24,24,24,24,25,25,25,25,25,25,25,25,26,26,26,26,26,26,26,26,27,27,27,27,27,27,27,28,28,28,28,28,28,28,28,28,29,29,29,29,29,29,29,29,30,30,30,30,30,31,31,31,31,31,31,31,32,32,32,32,32,32,32,33,33,33,33,34,34,34,34,34,35,35,35]
var leagues     = [11,9,11,10,6,9,8, 7, 4, 9, 7, 5, 5,11, 7, 5,11, 7, 6,10,11, 7, 6, 5,11,10, 9, 7, 6,11,10, 8, 6, 5,10, 9, 7, 6, 5, 9, 6, 3, 1,10, 9, 8, 7, 6, 5, 4,10, 9, 8, 7, 6, 5, 3,12,11,10, 9, 8, 7, 6, 5, 3, 8, 6, 5, 4,10, 9, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 8, 7, 5, 4, 3, 2, 1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 9, 8, 7, 6, 5, 4, 3, 2, 5, 4, 3, 2, 1, 8, 6, 5, 4, 3, 2, 1, 9, 7, 6, 5, 4, 3, 1, 4, 3, 2, 1, 8, 4, 3, 2, 1, 3, 2, 1]
var counts      = [ 3,1, 1, 1,1,1,1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 3, 5, 1, 1, 1, 1, 1, 2, 4, 3, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2, 2, 1, 3, 2, 1, 3, 2, 2, 1, 2, 6, 3, 2, 1, 1, 2, 1, 3, 4, 4, 1, 1, 1, 1, 4, 1, 1, 1, 1, 4, 5, 6, 2, 2, 1, 1, 1, 2, 3, 1, 3, 1, 1, 1, 2, 1, 2, 2, 1, 1, 1, 2, 2, 3, 5, 3, 8, 1, 1, 1, 2, 3, 2, 5, 2, 1, 2, 2, 4, 2, 1, 1, 1, 2, 3, 3, 5, 2, 1, 1, 2, 2, 3, 3, 1, 4, 7, 7, 4, 1, 3, 8, 4, 3, 1,19, 6]
var league_vals = [1,2,3,4,5,6,7,8,9,10,11,12]
var league_text = ['E','D3','D2','D1','C3','C2','C1','B2','B1','A2','A1','Champion']

// sizeref using above forumla
var desired_maximum_marker_size = 40

var trace = {
	x: classes,
	y: leagues,
	mode: 'markers',
	marker: {
		size: counts,
		//set 'sizeref' to an 'ideal' size given by the formula sizeref = 2. * max(array_of_size_values) / (desired_maximum_marker_size ** 2)
		sizeref: 2.0 * Math.max(...counts) / (desired_maximum_marker_size**2),
		sizemode: 'area'
	},
//	hovertemplate: '%{x}期<br>%{y}'
}

var data = [trace]

var layout = {
	height: 700,
	hovermode: 'closest',
	showlegend: false,
	title: title,
	xaxis: {
		showticksuffix: 'all'
	},
	yaxis: {
        tickmode: 'array',
        tickvals: league_vals,
        ticktext: league_text
	},
	annotations: [
		{
			x: 17,
			y: 12,
			xref: 'x',
			yref: 'y',
			text: 'The 17th class',
			showarrow: true,
			arrowhead: 1,
			ax: 0,
			ay: -40
		},
		{
			x: 30,
			y: 12,
			xref: 'x',
			yref: 'y',
			text: 'me',
			showarrow: true,
			arrowhead: 1,
			ax: 0,
			ay: -40
		}
	]
}

var config = {
	displayModeBar: false,
	responsive: true,
	scrollZoom: true
}

Plotly.newPlot('myDiv', data, layout, config)
