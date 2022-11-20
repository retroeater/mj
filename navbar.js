document.write(
'<nav class="navbar navbar-expand-lg navbar-dark bg-dark">' +
	'<div class="container-fluid">' +
		'<a class="navbar-brand" href="index.html">M</a>' +
		'<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">' +
			'<span class="navbar-toggler-icon"></span>'+
		'</button>'+
		'<div class="collapse navbar-collapse" id="navbarSupportedContent">'+
			'<ul class="navbar-nav me-auto mb-2 mb-lg-0">' +
				'<li class="nav-item dropdown">' +
					'<a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">連盟<br>JPML</a>' +
					'<div class="dropdown-menu" aria-labelledby="navbarDropdown">' +
						'<a class="dropdown-item" href="jpml_pros.html">プロ</a>' +
						'<a class="dropdown-item" href="jpml_articles.html">記事</a>' +
						'<a class="dropdown-item" href="jpml_titles.html">タイトル</a>' +
						'<a class="dropdown-item" href="jpml_links.html">リンク</a>' +
						'<a class="dropdown-item" href="maps.html">地図</a>' +
					'</div>' +
				'</li>' +
				'<li class="nav-item dropdown"><a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">鳳凰戦<br>Houou</a>' +
					'<div class="dropdown-menu" aria-labelledby="navbarDropdown">' +
						'<a class="dropdown-item" href="houou_ranking.html?sheet=鳳凰">ランキング</a>' +
						'<a class="dropdown-item" href="houou_leagues.html">リーグ推移</a>' +
						'<a class="dropdown-item" href="houou_league_by_class.html">リーグ✕期</a>' +
						'<a class="dropdown-item" href="houou_38_a1.html">第38期A1リーグ</a>' +
						'<a class="dropdown-item" href="houou_38_a2.html">第38期A2リーグ</a>' +
						'<a class="dropdown-item" href="houou_37_a1.html">第37期A1リーグ</a>' +
						'<a class="dropdown-item" href="houou_37_a2.html">第37期A2リーグ</a>' +
						'<a class="dropdown-item" href="houou_results.html">成績詳細</a>' +
					'</div>' +
				'</li>' +
				'<li class="nav-item dropdown"><a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">女流桜花<br>Ouka</a>' +
					'<div class="dropdown-menu" aria-labelledby="navbarDropdown">' +
					'<a class="dropdown-item" href="ouka_ranking.html?sheet=桜花">ランキング</a>' +
					'<a class="dropdown-item" href="ouka_leagues.html">リーグ推移</a>' +
						'<a class="dropdown-item" href="ouka_league_by_class.html">リーグ✕期</a>' +
						'<a class="dropdown-item" href="ouka_houou_league.html">桜花✕鳳凰リーグ</a>' +
						'<a class="dropdown-item" href="ouka_16_a.html">第16期Aリーグ</a>' +
						'<a class="dropdown-item" href="ouka_results.html">成績詳細</a>' +
					'</div>' +
				'</li>' +
				'<li class="nav-item dropdown"><a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">十段戦<br>Judan</a>' +
					'<div class="dropdown-menu" aria-labelledby="navbarDropdown">' +
					'<a class="dropdown-item" href="judan_39.html">第39期</a>' +
					'<a class="dropdown-item" href="judan_38.html">第38期</a>' +
					'</div>' +
				'</li>' +
				'<li class="nav-item dropdown"><a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">JPML<br>WRC</a>' +
					'<div class="dropdown-menu" aria-labelledby="navbarDropdown">' +
					'<a class="dropdown-item" href="wrc_ranking.html?sheet=JWRC">ランキング</a>' +
					'<a class="dropdown-item" href="wrc_results.html">成績詳細</a>' +
					'</div>' +
				'</li>' +
				'<li class="nav-item dropdown"><a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">特別昇級<br>Tokusho</a>' +
					'<div class="dropdown-menu" aria-labelledby="navbarDropdown">' +
					'<a class="dropdown-item" href="tokusho_ranking.html?sheet=特昇">ランキング</a>' +
					'<a class="dropdown-item" href="tokusho_results.html">成績詳細</a>' +
					'</div>' +
				'</li>' +
				'<li class="nav-item"><a class="nav-link" href="saikyo_results.html">最強戦<br>Saikyo</a></li>' +
				'<li class="nav-item dropdown"><a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">動画<br>Video</a>' +
					'<div class="dropdown-menu" aria-labelledby="navbarDropdown">' +
						'<a class="dropdown-item" href="video_ranking.html">ランキング</a>' +
						'<a class="dropdown-item" href="video_jpml.html">連盟プロ</a>' +
						'<a class="dropdown-item" href="video_live.html">放送対局</a>' +
						'<a class="dropdown-item" href="video_mtsuku.html">Mつく</a>' +
					'</div>' +
				'</li>' +
				'<li class="nav-item dropdown"><a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">ツイッター<br>Twitter</a>' +
					'<div class="dropdown-menu" aria-labelledby="navbarDropdown">' +
						'<a class="dropdown-item" href="twitter_ranking.html">ランキング</a>' +
						'<a class="dropdown-item" href="twitter_jpml.html">連盟プロ</a>' +
					'</div>' +
				'</li>' +
				'<li class="nav-item dropdown"><a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">リソース<br>Resource</a>' +
					'<div class="dropdown-menu" aria-labelledby="navbarDropdown">' +
						'<a class="dropdown-item" href="resource_books.html">書籍</a>' +
						'<a class="dropdown-item" href="resource_dictionary.html">辞書</a>' +
						'<a class="dropdown-item" href="resource_efficiency.html">牌効率</a>' +
						'<a class="dropdown-item" href="resource_rules.html">ルール</a>' +
					'</div>' +
				'</li>' +
				'<li class="nav-item dropdown"><a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">個人<br>Ryoei</a>' +
					'<div class="dropdown-menu" aria-labelledby="navbarDropdown">' +
						'<a class="dropdown-item" href="rh_bio.html">略歴</a>' +
						'<a class="dropdown-item" href="rh_results.html">成績</a>' +
						'<a class="dropdown-item" href="rh_results_detail.html">成績詳細</a>' +
						'<a class="dropdown-item" href="rh_paifu.html">牌譜</a>' +
						'<a class="dropdown-item" href="rh_articles.html">記事</a>' +
						'<a class="dropdown-item" href="rh_links.html">リンク</a>' +
					'</div>' +
				'</li>' +
			'</ul>' +
		'</div>' +
	'</div>' +
	'<a class="btn" data-bs-toggle="collapse" href="#searchBoxes" role="button" aria-expanded="false" aria-controls="searchBoxes">' +
		'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#FFFFFF" class="bi bi-search" viewBox="0 0 16 16">' +
			'<path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>' +
		'</svg>' +
	'</a>' +
'</nav>'
)
