const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1aluO6f_1B0caL72cDt0bfwFrJnX1Py6s4Oqm82uLBAA/edit?sheet=選手&headers=1'

const params = (new URL(document.location)).searchParams
let search_name = params.get('name')
let search_tag = params.get('tag')

let queryStatement = 'SELECT A,B,C,D,E,F,G,H,I,J WHERE K = "Y"'

if(search_name) {
	queryStatement += ' AND A = "' + search_name + '"'
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

	let playerId		// A 選手名
	let playerNameJa	// B 選手名Ⓟなし（日本語）
	let playerNameEn	// C 選手名Ⓟなし（英語）
	let playerType		// D 選手区分
	let playerOrg		// E 所属
	let teamId			// F チームID
	let teamType		// G チーム区分
	let teamName		// H チーム名
	let twitterId		// I X ID
	let twitterImageUrl	// J X画像URL

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
			playerNameEn = data.getValue(i,2)
			playerType = data.getValue(i,3)
			playerOrg = data.getValue(i,4)
			teamId = data.getValue(i,5)
			teamType = data.getValue(i,6)
			teamName = data.getValue(i,7)
			twitterId = data.getValue(i,8)
			twitterImageUrl = data.getValue(i,9)

			let formattedImage = getFormattedImage(playerNameJa,twitterId,twitterImageUrl)
			let formattedProfile = getFormattedProfile(playerId,playerNameEn,playerType,playerOrg,teamName)

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
					placeholder: 'Profile'
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
				pageSize: 100
			}
		})

		const view = new google.visualization.DataView(chartData)

		dashboard.bind([infoFilter], table)
		dashboard.draw(view)
	}
}

function getFormattedImage(playerNameJa,twitterId,twitterImageUrl) {

	let formattedImage
	const linkIcon = 'img/125_arr_hoso.png'

	let twitterUrl = getTwitterUrl(twitterId)

	if(!twitterImageUrl) {
		twitterImageUrl = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_200x200.png'
	}

	if(twitterId) {
		formattedImage = '<a href="' + twitterUrl + '" target="_blank"><img alt="' + playerNameJa + '" class="x" loading="lazy" src="' + twitterImageUrl + '" onError="this.onerror=null;this.src=\'' + linkIcon + '\'" /></a>'
	}
	else {
		formattedImage = '<img alt="' + playerNameJa + '" class="x" loading="lazy" src="' + twitterImageUrl + '" onError="this.onerror=null;this.src=\'' + linkIcon + '\'" />'
	}

	return formattedImage
}

function getFormattedProfile(playerId,playerNameEn,playerType,playerOrg,teamName) {

	let formattedProfile
	let playerOrgEn

	if(playerOrg == '日本プロ麻雀連盟') {
		playerOrgEn = 'JPML'
	}
	else if(playerOrg == '日本プロ麻雀協会') {
		playerOrgEn = 'NPM'
	}
	else if(playerOrg == '麻将連合') {
		playerOrgEn = 'Mu'
	}

	if(playerOrg == '-') {
		formattedProfile = teamName + '<br>' + playerId
	}
	else {
		if(playerNameEn) {
			formattedProfile = teamName + '<br>' + playerId + ' / ' + playerNameEn + '<br>' + playerOrg + ' / ' + playerOrgEn
		}
		else {
			formattedProfile = teamName + '<br>' + playerId + '<br>' + playerOrg + ' / ' + playerOrgEn
		}
	}

	return formattedProfile
}

function getTwitterUrl(twitterId) {
	return 'https://x.com/' + twitterId
}
