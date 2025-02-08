<?php

require "../fetch.php";
$executionStartTime = microtime(as_float: true);
$output = fetch(URL: "https://restcountries.com/v3.1/all?fields=currencies");
if ($output["status"]["code"] === 200)
{
    if (array_key_exists(key: "status", array: $output["data"]))
    {
        $output["data"] = null;
    }   
}
$output["status"]["returnedIn"] = intval(value: (microtime(as_float: true) - $executionStartTime) * 1000) . " ms";
echo json_encode(value: $output);

?>