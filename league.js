// リーグ情報取得
var leagueDetails = getLeagueDetails()

// リーグ情報初期化
var classes    = []
var	counts_a1  = []
var	counts_a2  = []
var	counts_b1  = []
var	counts_b2  = []
var	counts_c1  = []
var	counts_c2  = []
var	counts_c3  = []
var	counts_d1  = []
var	counts_d2  = []
var	counts_d3  = []
var	counts_e   = []

// リーグ情報代入
for(var i = 0; i < leagueDetails.length; i++) {
	classes.push(leagueDetails[i][2] + '<br>' + leagueDetails[i][1])
	counts_a1.push(leagueDetails[i][3])
	counts_a2.push(leagueDetails[i][4])
	counts_b1.push(leagueDetails[i][5])
	counts_b2.push(leagueDetails[i][6])
	counts_c1.push(leagueDetails[i][7])
	counts_c2.push(leagueDetails[i][8])
	counts_c3.push(leagueDetails[i][9])
	counts_d1.push(leagueDetails[i][10])
	counts_d2.push(leagueDetails[i][11])
	counts_d3.push(leagueDetails[i][12])
	counts_e.push(leagueDetails[i][13])
}

// リーグ情報表示設定
var a1 = {x:classes, y:counts_a1, name:'A1', type:'bar', marker:{color:'rgb(255,204,204)'}}
var a2 = {x:classes, y:counts_a2, name:'A2', type:'bar', marker:{color:'rgb(255,221,204)'}}
var b1 = {x:classes, y:counts_b1, name:'B1', type:'bar', marker:{color:'rgb(255,238,204)'}}
var b2 = {x:classes, y:counts_b2, name:'B2', type:'bar', marker:{color:'rgb(255,255,204)'}}
var c1 = {x:classes, y:counts_c1, name:'C1', type:'bar', marker:{color:'rgb(238,255,221)'}}
var c2 = {x:classes, y:counts_c2, name:'C2', type:'bar', marker:{color:'rgb(221,255,238)'}}
var c3 = {x:classes, y:counts_c3, name:'C3', type:'bar', marker:{color:'rgb(204,255,255)'}}
var d1 = {x:classes, y:counts_d1, name:'D1', type:'bar', marker:{color:'rgb(204,238,255)'}}
var d2 = {x:classes, y:counts_d2, name:'D2', type:'bar', marker:{color:'rgb(204,221,255)'}}
var d3 = {x:classes, y:counts_d3, name:'D3', type:'bar', marker:{color:'rgb(204,204,255)'}}
var e  = {x:classes, y:counts_e,  name:'E',  type:'bar', marker:{color:'rgb(204,204,204)'}}

// 選手情報取得
var playerRanks = getPlayerRanks()

// 選手情報初期化
var ranks_JunNishikawa     = []
var ranks_RyoeiHirano      = []
var ranks_TakehiroIshidate = []

// 選手情報代入
for(var i = 0; i < playerRanks.length; i++) {
	if(playerRanks[i][0] == 'JunNishikawa')     {ranks_JunNishikawa     = playerRanks[i][1]}
	if(playerRanks[i][0] == 'RyoeiHirano')      {ranks_RyoeiHirano      = playerRanks[i][1]}
	if(playerRanks[i][0] == 'TakehiroIshidate') {ranks_TakehiroIshidate = playerRanks[i][1]}
}

// 選手情報表示設定
var JunNishikawa     = {x:classes, y:ranks_JunNishikawa    , name:'西川淳<br>Jun Nishikawa',  type:'scatter', connectgaps:true, marker:{color:'rgb(0,153,0)'}}
var RyoeiHirano      = {x:classes, y:ranks_RyoeiHirano     , name:'平野良栄<br>Ryoei Hirano', type:'scatter', connectgaps:true, marker:{color:'rgb(204,0,0)'}}
var TakehiroIshidate = {x:classes, y:ranks_TakehiroIshidate, name:'石立岳大<br>Takehiro Ishidate', type:'scatter', connectgaps: true, marker:{color:'rgb(0,0,204)'}}

var data = [
	e,d3,d2,d1,c3,c2,c1,b2,b1,a2,a1,
	JunNishikawa,RyoeiHirano,TakehiroIshidate
]
	
var layout = {
	title: 'リーグ戦（22期後期～36期後期）<br>League (2006/01~2020/01)',
	barmode: 'stack',
	height: 700
}

var config = {
	displayModeBar: false,
	responsive: true,
	scrollZoom: true
}

Plotly.newPlot('myDiv', data, layout, config)
