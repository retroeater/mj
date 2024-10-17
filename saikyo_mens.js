const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1_xupRciIfdLYielUvIoAcmwUdyd0a_3a-opkj6IYe6M/edit?sheet=選手&headers=1'

const params = (new URL(document.location)).searchParams
let search_name = params.get('name')
let search_tag = params.get('tag')

let queryStatement = 'SELECT A,B,C,D,E,F,G WHERE H = "Y"'

if(search_name) {
	queryStatement += ' AND B = "' + search_name + '"'
}

if(!search_tag) {
	search_tag = ''
}

google.charts.load('current', {'packages':['table','controls']})
google.charts.setOnLoadCallback(drawDashboard)

function drawDashboard() {

	const query = new google.visualization.Query(spreadsheet_url)
	query.setQuery(queryStatement)
	query.send(handleQueryResponse)

	let playerId		// A 選手番号
	let playerNameJa	// B 選手名（日本語）
	let playerNameKana	// C 選手名（日本語ふりがな）
	let playerNameEn	// D 選手名（英語）
	let playerOrgJa		// E 所属（日本語）
	let twitterId		// F X ID
	let twitterImageUrl	// G X画像URL

	function handleQueryResponse(response) {

		if(response.isError()) {
			alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage())
			return
		}

		const chartData = new google.visualization.DataTable()
		chartData.addColumn('string','X')
		chartData.addColumn('string','Profile')
		
		const data = response.getDataTable()

		for(let i = 0; i < data.getNumberOfRows(); i++) {

			playerId = data.getValue(i,0)
			playerNameJa = data.getValue(i,1)
			playerNameKana = data.getValue(i,2)
			playerNameEn = data.getValue(i,3)
			playerOrgJa = data.getValue(i,4)
			twitterId = data.getValue(i,5)
			twitterImageUrl = data.getValue(i,6)

			let formattedImage = getFormattedImage(playerNameJa,twitterId,twitterImageUrl)
			let formattedProfile = getFormattedProfile(playerId,playerNameJa,playerNameEn,playerOrgJa)

			chartData.addRows([
				[
					formattedImage,
					formattedProfile
				]			
			])
		}

		const dashboard = new google.visualization.Dashboard(document.getElementById('dashboard_div'))

		const infoFilter = new google.visualization.ControlWrapper({
			controlType: 'StringFilter',
			containerId: 'info_filter_div',
			options: {
				filterColumnIndex: 1,
				matchType: 'any',
				ui: {
					label: '',
					placeholder: 'Search'
				}
			},
			state: {
				value: search_tag
			}
		})

		const table = new google.visualization.ChartWrapper({
			chartType: 'Table',
			containerId: 'table_div',
			options : {
				allowHtml: true,
				width: '100%',
				height: '100%',
				page: 'enable',
				pageSize: 200
			}
		})

		const view = new google.visualization.DataView(chartData)

		dashboard.bind([infoFilter], table)
		dashboard.draw(view)
	}
}

function getFormattedImage(playerNameJa,twitterId,twitterImageUrl) {

	let formattedImage
	let twitterUrl
	const linkIcon = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_200x200.png'

	if(twitterId != '-') {
		twitterUrl = getTwitterUrl(twitterId)
	}

	if(twitterImageUrl == '-') {
		twitterImageUrl = linkIcon
	}

	if(twitterUrl) {
		formattedImage = '<a href="' + twitterUrl + '" target="_blank"><img alt="' + playerNameJa + '" class="x" loading="lazy" src="' + twitterImageUrl + '" onError="this.onerror=null;this.src=\'' + linkIcon + '\'" /></a>'
	}
	else {
		formattedImage = '<img alt="' + playerNameJa + '" class="x" loading="lazy" src="' + twitterImageUrl + '" onError="this.onerror=null;this.src=\'' + linkIcon + '\'" />'
	}

	return formattedImage
}

function getFormattedProfile(playerId,playerNameJa,playerNameEn,playerOrgJa) {

	let formattedProfile

	let playerName

	if(playerNameEn == '-') {
		playerName = playerNameJa
	}
	else {
		playerName = playerNameJa + ' / ' + playerNameEn
	}

	let playerOrg

	if(playerOrgJa == '日本プロ麻雀連盟') {
		playerOrg = playerOrgJa + ' / JPML'
	}
	else if(playerOrgJa == '日本プロ麻雀協会') {
		playerOrg = playerOrgJa + ' / NPM'
	}
	else if(playerOrgJa == '麻将連合') {
		playerOrg = playerOrgJa + ' / Mu'
	}
	else if(playerOrgJa == '最高位戦日本プロ麻雀協会') {
		playerOrg = playerOrgJa + ' / Saikouisen'
	}
	else {
		playerOrg = playerOrgJa
	}

	formattedProfile = '【' + playerId + '】<br>' + playerName + '<br>' + playerOrg

	return formattedProfile
}

function getTwitterUrl(twitterId) {
	return 'https://x.com/' + twitterId
}
