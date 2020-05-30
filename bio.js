jQuery(function($){
	$('#events').DataTable({
		data: [
			{
				"date": "2018-12-09",
				"event": "国士無双放銃（第5期JPML WRCリーグ最終節）"
			},
			{
				"date": "2018-09-01",
				"event": "国士無双和了（第35期後期C2リーグ第1節）"
			},
			{
				"date": "2018-07-01",
				"event": "四暗刻和了（麻雀最強戦2018全日本プロ代表決定戦予選）"
			},
			{
				"date": "2018-04-22",
				"event": "国士無双和了（第27期麻雀マスターズプロ一次予選）"
			},
			{
				"date": "2017-10-14",
				"event": "国士無双和了（第3期JPML WRCリーグ第3節）"
			},
			{
				"date": "2017-07-30",
				"event": "第22期特別昇級リーグ3位"
			},
			{
				"date": "2016-12-04",
				"event": "大三元和了（第33期後期D2リーグ第4節）"
			},
			{
				"date": "2016-09-04",
				"event": "四暗刻和了（第33期後期D2リーグ第1節）"
			},
			{
				"date": "2015-09-19",
				"event": "第28期チャンピオンズリーグ4位"
			},
			{
				"date": "2015-08-30",
				"event": "第29期新人王戦準優勝"
			},
			{
				"date": "2015-08-02",
				"event": "国士無双放銃（第32期前期D3リーグ最終節）"
			},
			{
				"date": "2014-09-07",
				"event": "日本プロ麻雀連盟入会（第30期後期）"
			},
			{
				"date": "1997-08-03",
				"event": "第5期無双位戦4位"
			},
			{
				"date": "?",
				"event": "第?期麻雀学生名人戦3位"
			}
		],
		columns: [
			{ data: "date", className: "dt-body-center" },
			{ data: "event", className: "dt-body-left" }
		],
		info: false,
		paging: false,
		sort: false,
		searching: false
	})
})
