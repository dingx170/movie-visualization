<!DOCTYPE html>
<html lang="en">
<head>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.1/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="style.css">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.1/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/6.7.0/d3.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.2.0/chart.min.js"></script>
    <script src="https://d3js.org/d3-collection.v1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/patternomaly@1.3.0/dist/patternomaly.min.js"></script>
    <script src="index.js"></script>
</head>
<body>
  <?php $files = glob(__DIR__."/data/*.csv");?>
  <ul class="nav nav-tabs" id="myTab" role="tablist">
    <li class="nav-item">
      <a class="nav-link disabled" href="#"><span class="title">Movie Visualization</span></a>
    </li>
    <?php foreach ($files as $k=>$file){
        $f = basename($file, '.csv')?>
        <li class="nav-item" role="presentation">
          <button class="nav-link <?=($k == 0)?'active':''?>" id="<?=$f?>-tab" data-bs-toggle="tab" onclick="changeMovie('<?=$f?>');" data-bs-target="#<?=$f?>" type="button" role="tab" aria-controls="<?=$f?>" aria-selected="<?=($k == 0)?'true':''?>"><?=$f?></button>
        </li>
      <?php }?>
  </ul>
  <div class="tab-content" id="nav-tabContent">
    <?php foreach ($files as $k=>$file){
      $f = basename($file, '.csv')?>
      <div class="tab-pane fade <?=($k == 0)?'show active':''?>" id="<?=$f?>" role="tabpanel" aria-labelledby="<?=$f?>-tab">
        <div class="row">
      <div class="col-1"></div>
      <div class="col-4">
        <h5 class="text-center">Movie display with face classifier</h5>
        <div class="videoContainer">
          <video id="<?=$f?>-movie" class="responsive-video" controls>
            <source src="http://localhost/movies/<?=$f?>.mp4" type="video/mp4">
              Your browser does not support the video tag.
          </video>
        </div>
        <br>
        <div>
          <label><h5>Select the time interval to update visualization:</h5></label>
          <select class="form-select pull-right" aria-label="Default select example" onchange="makeChart('<?=$f?>',this.value)">
            <option value="20" selected="selected">20 minutes</option>
            <option value="10">10 minutes</option>
            <option value="5">5 minutes</option>
            <option value="2">2 minutes</option>
            <option value="1">1 minutes</option>
          </select>
        </div>
      </div>
      <div class="col-4">
          <h5 class="text-center">The overall distribution of emotions</h5>
          <div class="chordChartContainer">
            <div id="<?=$f?>-chordChartCanvas"></div>
          </div>
      </div>
      <div class="col-2">
          <div class="chordChartLegendContainer">
              <div id="<?=$f?>-chordChartLegend"></div>
          </div>
      </div>
      <div class="col-1"></div>
    </div>
    <div class="row interactiveContainer">

      <div class="col">
        <div class="chartContainer">
          <h5 class="text-center">The change of emotions over time (proportion focused)</h5>
          <canvas id="<?=$f?>-emotionsOverTime"></canvas>
        </div>
      </div>
      <div class="col">
        <h5 class="text-center">The change of emotions over time (trend focused)</h5>
        <div class="chartContainer">
          <canvas id="<?=$f?>-emotionsOverTimeLine"></canvas>
        </div>
      </div>

    </div>
      </div>
    <?php }?>
  </div>
</body>
</html>
