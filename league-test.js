function makeplot() {
	Plotly.d3.csv("league-test.csv", function(data){ processData(data) })
}

function processData(allRows) {

  console.log(allRows);
  var classes = [], leagues = [], counts = [];

  for(var i = 0; i < allRows.length; i++) {
    row = allRows[i];
    classes.push( row['class'] );
    leagues.push( row['league'] );
    counts.push( row['count'] );
  }
  console.log( 'Class',classes, 'League',leagues, 'Count',counts );
  makePlotly( classes, leagues, counts );
}

function makePlotly( classes, leagues, counts ){
  var plotDiv = document.getElementById("plot");
  var traces = [{
    x: classes,
    y: counts
  }];

  Plotly.newPlot('myDiv', traces,
    {title: 'Plotting CSV data from AJAX call'});
}

makeplot()
