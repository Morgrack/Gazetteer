<?php

require "../fetch.php";
$executionStartTime = microtime(as_float: true);
$output = fetch(URL: "https://restcountries.com/v3.1/alpha/" . $_REQUEST["iso3"] . "");
// if ($output["status"]["code"] === 200)
// {
    
// }
$output["status"]["returnedIn"] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
echo json_encode(value: $output);

?>