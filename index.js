let lineChartCanvas = document.getElementById('lineChartCanvas').getContext('2d');
let stackedBarChartCanvas = document.getElementById('stackedBarChartCanvas').getContext('2d');

d3.csv("theMask_1min.csv").then(makeChart);

function makeChart(data) {

    // group data by minute
    var dataByMin = d3.nest()
        .key(function(d) { return d.minute;})
        .rollup((function(d) {
            return {
                angry: d3.sum(d, function(e) { return e.angry; }),
                disgust: d3.sum(d, function(e) { return e.disgust; }),
                fear: d3.sum(d, function(e) { return e.fear; }),
                happy: d3.sum(d, function(e) { return e.happy; }),
                sad: d3.sum(d, function(e) { return e.sad; }),
                surprised: d3.sum(d, function(e) { return e.surprised; }),
                neutral: d3.sum(d, function(e) { return e.neutral; })
            };
        })).entries(data);

    var emotionLabels = dataByMin.map(function (d) {
        return d.key; // min
    });
    var angryData = dataByMin.map(function (d) {
        return d.value.angry;
    });
    var disgustData = dataByMin.map(function (d) {
        return d.value.disgust;
    });
    var fearData = dataByMin.map(function (d) {
        return d.value.fear;
    });
    var happyData = dataByMin.map(function (d) {
        return d.value.happy;
    });
    var sadData = dataByMin.map(function (d) {
        return d.value.sad;
    });
    var surprisedData = dataByMin.map(function (d) {
        return d.value.surprised;
    });
    var neutralData = dataByMin.map(function (d) {
        return d.value.neutral;
    });

    var lineChart = new Chart("lineChartCanvas", {
        type: "line",
        data: {
        labels: emotionLabels,
        datasets: [
            {
                label: "Angry",
                data: angryData,
                borderColor: "red"
            },
            {
                label: "Disgust",
                data: disgustData,
                borderColor: "green"
            },
            {
                label: "Fear",
                data: fearData,
                borderColor: "black"
            },
            {
                label: "Happy",
                data: happyData,
                borderColor: "yellow"
            },
            {
                label: "Sad",
                data: sadData,
                borderColor: "blue"
            },
            {
                label: "Suprised",
                data: surprisedData,
                borderColor: "orange"
            },
            {
                label: "Neutral",
                data: neutralData,
                borderColor: "grey"
            }
        ]
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: 'Emotions over time'
                },
            }
        }
    });

    var stackedBarChart = new Chart("stackedBarChartCanvas", {
        type: 'bar',
        data: {
          labels: emotionLabels,
          datasets: [
            {
                label: "Angry",
                data: angryData,
                backgroundColor: "red"
            },
            {
                label: "Disgust",
                data: disgustData,
                backgroundColor: "green"
            },
            {
                label: "Fear",
                data: fearData,
                backgroundColor: "black"
            },
            {
                label: "Happy",
                data: happyData,
                backgroundColor: "yellow"
            },
            {
                label: "Sad",
                data: sadData,
                backgroundColor: "blue"
            },
            {
                label: "Suprised",
                data: surprisedData,
                backgroundColor: "orange"
            },
            {
                label: "Neutral",
                data: neutralData,
                backgroundColor: "grey"
            }  
            ],
        },
        options: {
            plugins: {
              title: {
                display: true,
                text: 'Emotions over time'
              },
            },
            responsive: true,
            scales: {
              x: {
                stacked: true,
              },
              y: {
                stacked: true
              }
            }
        }
    });
}