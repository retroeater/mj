jQuery.getJSON('https://retroeater.github.io/mj/test.json', (data) => {
	console.log(`${data.class}, ${data.league}, ${data.count}`)
})

jQuery.getJSON('https://retroeater.github.io/mj/json/league_A1.json', (data) => {

        for(var i in data){
			console.log(data[i].class_id, data[i].class_en, data[i].class_ja, data[i].league, data[i].count)
        }
})
