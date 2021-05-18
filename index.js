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

    createChord(data);

}

function createChord(data) {
    var width = 460, height = 460;
    var innerRadius = 150, outerRadius = 165;
    // create the svg area
    var svg = d3.select('#chordChartCanvas')
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
    var names = ["Angry", "Disgust", "Fear", "Happy", "Sad", "Surprised", "Neutral"];
    var colors = ["#ff4000", "#ffbf00", "#A0522D", "#009933", "#5050FF", "#FF50FF", "#c2c2d6"];
    completeMatrix = prepareData(data);

    // give this matrix to d3.chord(): it will calculates all the info we need to draw arc and ribbon
    var res = d3.chord()
        .padAngle(0.05)     // padding between entities (black arc)
        .sortSubgroups(d3.descending)
        (completeMatrix);


    // border circle for names
    svg.selectAll("path")
        .data(res.groups)
        .enter().append("path")
        .style("fill", function (d) { return colors[d.index]; })
        .style("stroke", function (d) {
            return d3.rgb(colors[d.index]).darker()
        })
        .style("opacity", 0.5)
        .attr("d", d3.arc().innerRadius(innerRadius).outerRadius(outerRadius))
        .on("mouseover", fadeOnMouseOverArc(.1))
        .on("mouseout", fadeOnMouseOverArc(0.5))
        ;

    function fadeOnMouseOverArc(opacity) {
        return function (d, i) {
            d3.selectAll(".chord path")
                .filter(function (d) {
                    return d.source.index != i.index && d.target.index != i.index;
                })
                .transition()
                .style("opacity", opacity);
        };
    }

    // Arc for labels
    var arc = d3.arc()
        .innerRadius(innerRadius + 10)
        .outerRadius(outerRadius + 5)
    // Add labels
    svg.selectAll("text")
        .data(res.groups)
        .enter().append("text")
        .attr('transform', function (d) {
            return 'translate(' +
                arc.startAngle(d.startAngle)
                    .endAngle(d.endAngle)
                    .centroid() // this is an array, so will automatically be printed out as x,y
                + ')';
        })
        .attr('dy', '.35em')
        .attr('text-anchor', function (d) { return d.startAngle > Math.PI ? "end" : null; })
        .text(function (d, i) {
            return names[i];
        })
        .style("fill", function (d) {
            return d3.rgb(colors[d.index]).darker();
        })
        .attr("id", "label");

    // Inner ribon drawing
    svg.append("g")
        .attr("class", "chord")
        .selectAll("path")
        .data(res)
        .enter().append("path")
        .attr("d", d3.ribbon().radius(innerRadius))
        .style("fill", function (d) {
            var chordcolor = d3.scaleLinear()
                .range([colors[d.target.index], colors[d.source.index]])
                .domain([-1, 1])
                .interpolate(d3.interpolateLab);
            var weight = 1; //(d.source.value - d.target.value) / (d.source.value + d.target.value);
            return chordcolor(weight);
        })
        .style("stroke", function (d) {
            return d3.rgb(colors[d.source.index]).darker()
        })
        .style("opacity", 0.5)
        .on("mouseover", fadeOnMouseOverRibbon(0.1))
        .on("mouseout", fadeOnMouseOverRibbon(0.5))
        ;

    function fadeOnMouseOverRibbon(opacity) {
        return function (d, i) {
            d3.selectAll(".chord path")
                .filter(function (d) {
                    return d.source.index != i.source.index;
                })
                .transition()
                .style("opacity", opacity);
        };
    }


}

function prepareData(data) {
    var prev;

    var completeMatrix = [
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0]];

    data.forEach(function (d) {

        if (d.angry == '0' && d.disgust == '0' && d.fear == '0' &&
            d.happy == '0' && d.sad == '0' && d.surprised == '0' && d.neutral == '0')
            return;

        if (prev != null) {
            if (prev.angry == 1) {
                completeMatrix[0][0] += +d.angry;
                completeMatrix[0][1] += +d.disgust;
                completeMatrix[0][2] += +d.fear;
                completeMatrix[0][3] += +d.happy;
                completeMatrix[0][4] += +d.sad;
                completeMatrix[0][5] += +d.surprised;
                completeMatrix[0][6] += +d.neutral;
            }

            if (prev.disgust == 1) {
                completeMatrix[1][0] += +d.angry;
                completeMatrix[1][1] += +d.disgust;
                completeMatrix[1][2] += +d.fear;
                completeMatrix[1][3] += +d.happy;
                completeMatrix[1][4] += +d.sad;
                completeMatrix[1][5] += +d.surprised;
                completeMatrix[1][6] += +d.neutral;
            }
            if (prev.fear == 1) {
                completeMatrix[2][0] += +d.angry;
                completeMatrix[2][1] += +d.disgust;
                completeMatrix[2][2] += +d.fear;
                completeMatrix[2][3] += +d.happy;
                completeMatrix[2][4] += +d.sad;
                completeMatrix[2][5] += +d.surprised;
                completeMatrix[2][6] += +d.neutral;
            }
            if (prev.happy == 1) {
                completeMatrix[3][0] += +d.angry;
                completeMatrix[3][1] += +d.disgust;
                completeMatrix[3][2] += +d.fear;
                completeMatrix[3][3] += +d.happy;
                completeMatrix[3][4] += +d.sad;
                completeMatrix[3][5] += +d.surprised;
                completeMatrix[3][6] += +d.neutral;
            }
            if (prev.sad == 1) {
                completeMatrix[4][0] += +d.angry;
                completeMatrix[4][1] += +d.disgust;
                completeMatrix[4][2] += +d.fear;
                completeMatrix[4][3] += +d.happy;
                completeMatrix[4][4] += +d.sad;
                completeMatrix[4][5] += +d.surprised;
                completeMatrix[4][6] += +d.neutral;
            }
            if (prev.surprised == 1) {
                completeMatrix[5][0] += +d.angry;
                completeMatrix[5][1] += +d.disgust;
                completeMatrix[5][2] += +d.fear;
                completeMatrix[5][3] += +d.happy;
                completeMatrix[5][4] += +d.sad;
                completeMatrix[5][5] += +d.surprised;
                completeMatrix[5][6] += +d.neutral;
            }
            if (prev.neutral == 1) {
                completeMatrix[6][0] += +d.angry;
                completeMatrix[6][1] += +d.disgust;
                completeMatrix[6][2] += +d.fear;
                completeMatrix[6][3] += +d.happy;
                completeMatrix[6][4] += +d.sad;
                completeMatrix[6][5] += +d.surprised;
                completeMatrix[6][6] += +d.neutral;
            }
        }
        prev = d;
    });

    return completeMatrix;
}
