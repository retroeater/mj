const spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1h4-DhmvaBJzfkA61mTKkz4mMuICGliuzglakql5TeP0/edit?sheet=ma-tsuku&headers=1'

google.charts.load('current', {'packages':['table','controls']})
google.charts.setOnLoadCallback(drawDashboard)

function drawDashboard() {

	/* initialize rules */
	let startingPoint = getStartingPoint()

	/* initialize players */
	let startingEastPlayer = {
		name: 'あいだて',
		winningRate: 0.250,
		averageWinningPoint: 3900,
		dealinRate:  0.090,
		averageDealinPoint: 9000,
		point: startingPoint,
		currentWind: '東家'
	}
	let startingSouthPlayer = {
		name: 'うしさん',
		winningRate: 0.300,
		averageWinningPoint: 5200,
		dealinRate:  0.135,
		averageDealinPoint: 6000,
		point: startingPoint,
		currentWind: '南家'
	}
	let startingWestPlayer = {
		name: 'えぬかわ',
		winningRate: 0.200,
		averageWinningPoint: 8000,
		dealinRate:  0.150,
		averageDealinPoint: 5400,
		point: startingPoint,
		currentWind: '西家'
	}
	let startingNorthPlayer = {
		name: 'らのひー',
		winningRate: 0.150,
		averageWinningPoint: 12000,
		dealinRate:  0.180,
		averageDealinPoint: 4500,
		point: startingPoint,
		currentWind: '北家'
	}

	let currentHandIndex = 1
	let repeatCounters = 0

	while(currentHandIndex < 9) {

		displayScoreBoard(currentHandIndex, repeatCounters, startingEastPlayer, startingSouthPlayer, startingWestPlayer, startingNorthPlayer)

		/* アガリ者および放銃者の判定 */
		let winningPlayerWind = getPlayerWind()
		let dealinPlayerWind = getPlayerWind()
		let winningMethod

		/* ツモアガリまたはロンアガリの判定 */
		if(winningPlayerWind == dealinPlayerWind) {
			winningMethod = 'Tsumo'
		}
		else {
			winningMethod = 'Ron'
		}

		let winningPoint = getWinningPoint(winningPlayerWind)

		displayHandResult(winningPlayerWind, dealinPlayerWind, winningMethod, winningPoint)
/*
		if(winningPlayer['name'] == startingEastPlayer['name']) {
			startingEastPlayer['point'] = startingEastPlayer['point'] + winningPoint
		}
		else if(winningPlayer['name'] == startingSouthPlayer['name']) {
			startingSouthPlayer['point'] = startingSouthPlayer['point'] + winningPoint
		}
		else if(winningPlayer['name'] == startingWestPlayer['name']) {
			startingWestPlayer['point'] = startingWestPlayer['point'] + winningPoint
		}
		else if(winningPlayer['name'] == startingNorthPlayer['name']) {
			startingNorthPlayer['point'] = startingNorthPlayer['point'] + winningPoint
		}
		else {
			document.write('issue with adding winning points to a winning player...')
		}

		if(dealinPlayer['name'] == startingEastPlayer['name']) {
			startingEastPlayer['point'] = startingEastPlayer['point'] - winningPoint
		}
		else if(dealinPlayer['name'] == startingSouthPlayer['name']) {
			startingSouthPlayer['point'] = startingSouthPlayer['point'] - winningPoint
		}
		else if(dealinPlayer['name'] == startingWestPlayer['name']) {
			startingWestPlayer['point'] = startingWestPlayer['point'] - winningPoint
		}
		else if(dealinPlayer['name'] == startingNorthPlayer['name']) {
			startingNorthPlayer['point'] = startingNorthPlayer['point'] - winningPoint
		}
		else {
			document.write('issue with adding winning points to a winning player...')
		}
*/

		currentHandIndex++
		repeatCounters = 0

		setCurrentWinds(currentHandIndex, startingEastPlayer, startingSouthPlayer, startingWestPlayer, startingNorthPlayer)
	}

	displayScoreBoard(currentHandIndex, repeatCounters, startingEastPlayer, startingSouthPlayer, startingWestPlayer, startingNorthPlayer)
}

function displayHandResult(winningPlayerWind, dealinPlayerWind, winningMethod, winningPoint) {
	
	if(winningMethod == 'Ron') {
		document.write(
			winningPlayerWind + '、' + dealinPlayerWind + 'から' + winningPoint + '点のロンアガリ！' 
		)
	}
	else {
		document.write(
			winningPlayerWind + '、' + winningPoint + '点のツモアガリ！'
		)
	}
}

function displayScoreBoard(currentHandIndex, repeatCounters, startingEastPlayer, startingSouthPlayer, startingWestPlayer, startingNorthPlayer) {

	let handLabel = getHandLabel(currentHandIndex, repeatCounters)

	document.write(
		'<p>' +
		handLabel + '<br>' +
		startingEastPlayer['currentWind'] + ' ' + startingEastPlayer['name'] + ' ' + startingEastPlayer['point'] + '<br>' +
		startingSouthPlayer['currentWind'] + ' ' + startingSouthPlayer['name'] + ' ' + startingSouthPlayer['point'] +  '<br>' +
		startingWestPlayer['currentWind'] + ' ' + startingWestPlayer['name'] + ' ' + startingWestPlayer['point'] +  '<br>' +
		startingNorthPlayer['currentWind'] + ' ' + startingNorthPlayer['name'] + ' ' + startingNorthPlayer['point'] +  '<br>' +
		'</p>'
	)
}

function getDealinPlayer() {

	let dealinPlayerIndex = getPlayerIndex()
	let dealinPlayer = getPlayerByIndex(dealinPlayerIndex)

	return dealinPlayer
}

function getPlayerByIndex(playerIndex) {

	let	player

	switch(playerIndex) {
		case 1:
			player = getStartingEastPlayer()
			break
		case 2:
			player = getStartingSouthPlayer()
			break
		case 3:
			player = getStartingWestPlayer()
			break
		case 4:
			player = getStartingNorthPlayer()
			break
		default:
			break
	}	

	return player
}

function getHandLabel(currentHandIndex, repeatCounters) {
	
	let currentRound
	let currentHand
	let handLabel

	if(currentHandIndex <= 4) {
		currentRound = '東'
	}
	else {
		currentRound = '南'
	}

	if(currentHandIndex <= 4) {
		currentHand = currentHandIndex
	}
	else {
		currentHand = currentHandIndex - 4
	}

	if(currentHandIndex <= 8) {
		handLabel = '【' + currentRound + currentHand + '局' + repeatCounters + '本場' + '】'
	}
	else {
		handLabel = '【半荘終了時】'
	}
	
	return handLabel
}

function getPlayerIndex() {

	let playerIndex = Math.floor(Math.random()*(5-1))+1

	return playerIndex
}

function getStartingPoint() {
	
	let startingPoint = 25000

	return startingPoint
}

function getPlayerWind() {

	let playerIndex = getPlayerIndex()
	let playerWind

	switch(playerIndex) {
		case 1:
			playerWind = '東家'
			break
		case 2:
			playerWind = '南家'
			break
		case 3:
			playerWind = '西家'
			break
		case 4:
			playerWind = '北家'
			break
		default:
			break
	}

	return playerWind
}

function getWinningPoint(winningPlayerWind) {
	
	let winningPointIndex = getWinningPointIndex()
	let winningPoint

	if(winningPlayerWind == '東家') {
		switch(winningPointIndex) {
			case 1:
				winningPoint = 1500
				break
			case 2:
				winningPoint = 2000
				break
			case 3:
				winningPoint = 2400
				break
			case 4:
				winningPoint = 2900
				break
			case 5:
				winningPoint = 3900
				break
			case 6:
				winningPoint = 4800
				break
			case 7:
				winningPoint = 5800
				break
			case 8:
				winningPoint = 7700
				break
			case 9:
				winningPoint = 9600
				break
			case 10:
				winningPoint = 12000
				break
			case 11:
				winningPoint = 18000
				break
			case 12:
				winningPoint = 24000
				break
			case 13:
				winningPoint = 36000
				break
			case 14:
				winningPoint = 48000
				break
			default:
				break
		}
	}
	else {		
		switch(winningPointIndex) {
			case 1:
				winningPoint = 1000
				break
			case 2:
				winningPoint = 1300
				break
			case 3:
				winningPoint = 1600
				break
			case 4:
				winningPoint = 2000
				break
			case 5:
				winningPoint = 2600
				break
			case 6:
				winningPoint = 3200
				break
			case 7:
				winningPoint = 3900
				break
			case 8:
				winningPoint = 5200
				break
			case 9:
				winningPoint = 6400
				break
			case 10:
				winningPoint = 8000
				break
			case 11:
				winningPoint = 12000
				break
			case 12:
				winningPoint = 16000
				break
			case 13:
				winningPoint = 24000
				break
			case 14:
				winningPoint = 32000
				break
			default:
				break
		}
	}

	return winningPoint
}

function getWinningPointIndex() {

	let winningPointIndex = Math.floor(Math.random()*(15-1))+1

	return winningPointIndex
}

function setCurrentWinds(currentHandIndex, startingEastPlayer, startingSouthPlayer, startingWestPlayer, startingNorthPlayer) {

	if((currentHandIndex == 1) || (currentHandIndex == 5)) {
		startingEastPlayer['currentWind'] = '東家'
		startingSouthPlayer['currentWind'] = '南家'
		startingWestPlayer['currentWind'] = '西家'
		startingNorthPlayer['currentWind'] = '北家'
	}
	else if((currentHandIndex == 2) || (currentHandIndex == 6)) {
		startingEastPlayer['currentWind'] = '北家'
		startingSouthPlayer['currentWind'] = '東家'
		startingWestPlayer['currentWind'] = '南家'
		startingNorthPlayer['currentWind'] = '西家'
	}
	else if((currentHandIndex == 3) || (currentHandIndex == 7)) {
		startingEastPlayer['currentWind'] = '西家'
		startingSouthPlayer['currentWind'] = '北家'
		startingWestPlayer['currentWind'] = '東家'
		startingNorthPlayer['currentWind'] = '南家'
	}
	else if((currentHandIndex == 4) || (currentHandIndex == 8)) {
		startingEastPlayer['currentWind'] = '南家'
		startingSouthPlayer['currentWind'] = '西家'
		startingWestPlayer['currentWind'] = '北家'
		startingNorthPlayer['currentWind'] = '東家'
	}
}
