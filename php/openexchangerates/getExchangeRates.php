<?php

require "../config.php";
require "../fetch.php";
$executionStartTime = microtime(as_float: true);
$output = fetch(URL: "https://openexchangerates.org/api/latest.json?app_id=" . $openExchangeRatesKey);
// if ($output["status"]["code"] === 200)
// {
    
// }
$output["status"]["returnedIn"] = intval(value: (microtime(as_float: true) - $executionStartTime) * 1000) . " ms";
echo json_encode(value: $output);

?>