const title       = 'リーグ✕期（36期後期）<br>League/Class as of 2020/01'
const classes     = [ 1,1, 3, 3,5,7,8,10,10,11,11,11,12,13,13,13,14,14,14,15,16,16,16,16,17,17,17,17,17,18,18,18,18,18,19,19,19,19,19,20,20,20,20,21,21,21,21,21,21,21,22,22,22,22,22,22,22,23,23,23,23,23,23,23,23,23,24,24,24,24,25,25,25,25,25,25,25,25,26,26,26,26,26,26,26,26,27,27,27,27,27,27,27,28,28,28,28,28,28,28,28,28,29,29,29,29,29,29,29,29,30,30,30,30,30,31,31,31,31,31,31,31,32,32,32,32,32,32,32,33,33,33,33,34,34,34,34,34,35,35,35]
const leagues     = [11,9,11,10,6,9,8, 7, 4, 9, 7, 5, 5,11, 7, 5,11, 7, 6,10,11, 7, 6, 5,11,10, 9, 7, 6,11,10, 8, 6, 5,10, 9, 7, 6, 5, 9, 6, 3, 1,10, 9, 8, 7, 6, 5, 4,10, 9, 8, 7, 6, 5, 3,12,11,10, 9, 8, 7, 6, 5, 3, 8, 6, 5, 4,10, 9, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 8, 7, 5, 4, 3, 2, 1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 9, 8, 7, 6, 5, 4, 3, 2, 5, 4, 3, 2, 1, 8, 6, 5, 4, 3, 2, 1, 9, 7, 6, 5, 4, 3, 1, 4, 3, 2, 1, 8, 4, 3, 2, 1, 3, 2, 1]
const counts      = [ 3,1, 1, 1,1,1,1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 3, 5, 1, 1, 1, 1, 1, 2, 4, 3, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2, 2, 1, 3, 2, 1, 3, 2, 2, 1, 2, 6, 3, 2, 1, 1, 2, 1, 3, 4, 4, 1, 1, 1, 1, 4, 1, 1, 1, 1, 4, 5, 6, 2, 2, 1, 1, 1, 2, 3, 1, 3, 1, 1, 1, 2, 1, 2, 2, 1, 1, 1, 2, 2, 3, 5, 3, 8, 1, 1, 1, 2, 3, 2, 5, 2, 1, 2, 2, 4, 2, 1, 1, 1, 2, 3, 3, 5, 2, 1, 1, 2, 2, 3, 3, 1, 4, 7, 7, 4, 1, 3, 8, 4, 3, 1,19, 6]
const league_vals = [1,2,3,4,5,6,7,8,9,10,11,12]
const league_text = ['E','D3','D2','D1','C3','C2','C1','B2','B1','A2','A1','鳳凰位<br>Champion']

// sizeref using above forumla
const desired_maximum_marker_size = 40

const trace = {
	x: classes,
	y: leagues,
	mode: 'markers',
	marker: {
		size: counts,
		//set 'sizeref' to an 'ideal' size given by the formula sizeref = 2. * max(array_of_size_values) / (desired_maximum_marker_size ** 2)
		sizeref: 2.0 * Math.max(...counts) / (desired_maximum_marker_size**2),
		sizemode: 'area'
	}
}

const data = [trace]

const layout = {
	height: 700,
	hovermode: 'closest',
	showlegend: false,
	title: title,
	xaxis: {
		showticksuffix: 'all',
		ticksuffix: '期',
		tickvals: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35],
		ticktext: ['1期<br>1985','2期<br>1986','3期<br>1987','4期<br>1988','5期<br>1989','6期<br>1990','7期<br>1991','8期<br>1992','9期<br>1993','10期<br>1994','11期<br>1995','12期<br>1996','13期<br>1997','14期<br>1998','15期<br>1999','16期<br>2000','17期<br>2001','18期<br>2002','19期<br>2003','20期<br>2004','21期<br>2005','22期<br>2006','23期<br>2007','24期<br>2008','25期<br>2009','26期<br>2010','27期<br>2011','28期<br>2012','29期<br>2013','30期<br>2014','31期<br>2015','32期<br>2016','33期<br>2017','34期<br>2018','35期<br>2019']
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
			text: '花の17期<br>The Class of 2001',
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
			text: '平野良栄<br>me',
			showarrow: true,
			arrowhead: 1,
			ax: 0,
			ay: -40
		}
	]
}

const config = {
	displayModeBar: false,
	responsive: true,
	scrollZoom: true
}

Plotly.newPlot('myDiv', data, layout, config)
