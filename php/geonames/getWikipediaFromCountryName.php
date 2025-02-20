<?php

require "../config.php";
require "../fetch.php";
$executionStartTime = microtime(as_float: true);
$output = fetch(URL: "http://api.geonames.org/wikipediaSearchJSON?q=" . $_REQUEST["name"] . "&title=" . $_REQUEST["name"] . "&maxRows=10&username=" . $geoNamesUsername);
if ($output["status"]["code"] === 200)
{
    if (count(value: $output["data"]["geonames"]) > 0)
    {
        $output["data"] = $output["data"]["geonames"][0];
        $output["data"] = 
        [
            "summary" => $output["data"]["summary"], 
            "title" => $output["data"]["title"], 
            "wikipediaURL" => $output["data"]["wikipediaUrl"]
        ];
    }
    else
    {
        $output["data"] = null;
    }
}
$output["status"]["returnedIn"] = intval(value: (microtime(as_float: true) - $executionStartTime) * 1000) . " ms";
echo json_encode(value: $output);

?>