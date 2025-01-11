<?php

require "../config.php";
require "../fetch.php";
$executionStartTime = microtime(as_float: true);
$result = fetch(URL: "https://api.opencagedata.com/geocode/v1/json?q=" . $_REQUEST["lat"] . "+" . $_REQUEST["lng"] . "&key=" . $openCageKey . '&pretty=1');

?>