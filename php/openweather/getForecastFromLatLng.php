<?php

require "../config.php";
require "../fetch.php";
$executionStartTime = microtime(as_float: true);
$output = fetch(URL: "https://api.openweathermap.org/data/2.5/forecast?&units=metric&lat=" . $_REQUEST["lat"] . "&lon=" . $_REQUEST["lng"] . "&appid=" . $openWeatherKey);
if ($output["status"]["code"] === 200)
{
    $output["data"] = $output["data"]["list"];
}
$output["status"]["returnedIn"] = intval(value: (microtime(as_float: true) - $executionStartTime) * 1000) . " ms";
echo json_encode(value: $output);

?>