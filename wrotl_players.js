const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1aluO6f_1B0caL72cDt0bfwFrJnX1Py6s4Oqm82uLBAA/edit?sheet=選手&headers=1'

const params = (new URL(document.location)).searchParams
let search_name = params.get('name')
let search_tag = params.get('tag')

let queryStatement = 'SELECT A,B,C,D,E,F,G,H,I WHERE J = "Y"'

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
	let playerName		// B 選手名Ⓟなし
	let playerType		// C 選手区分
	let playerOrg		// D 所属
	let teamId			// E チームID
	let teamType		// F チーム区分
	let teamName		// G チーム名
	let twitterId		// H X ID
	let twitterImageUrl	// I X画像URL

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
			playerName = data.getValue(i,1)
			playerType = data.getValue(i,2)
			playerOrg = data.getValue(i,3)
			teamId = data.getValue(i,4)
			teamName = data.getValue(i,5)
			twitterId = data.getValue(i,6)
			twitterImageUrl = data.getValue(i,7)

			let formattedImage = getFormattedImage(playerName,twitterId,twitterImageUrl)
			let formattedProfile = getFormattedProfile(playerId,playerType,playerOrg,teamName)

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

function getFormattedImage(playerName,twitterId,twitterImageUrl) {

	let formattedImage
	const linkIcon = 'img/125_arr_hoso.png'

	let twitterUrl = getTwitterUrl(twitterId)

	formattedImage = '<a href="' + twitterUrl + '" target="_blank"><img alt="' + playerName + '" class="rectangle" loading="lazy" src="' + twitterImageUrl + '" onError="this.onerror=null;this.src=\'' + linkIcon + '\'" /></a>'

	return formattedImage
}

function getFormattedProfile(playerId,playerType,playerOrg,teamName) {

	let formattedProfile

	if(playerOrg) {
		formattedProfile = teamName + '<br>' + playerId + '/ FirstName LastName<br>' + playerOrg + 'orgEnglishNameHere'
	}
	else {
		formattedProfile = teamName + '<br>' + playerId + '/ FirstName LastName'
	}

	return formattedProfile
}

function getTwitterUrl(twitterId) {
	return 'https://x.com/' + twitterId
}
