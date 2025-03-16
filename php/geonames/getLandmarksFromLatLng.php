<?php

require "../config.php";
require "../fetch.php";
$executionStartTime = microtime(as_float: true);
$output = fetch(URL: "http://api.geonames.org/findNearbyWikipediaJSON?formatted=true&maxRows=500&radius=1&lat=" . $_REQUEST["lat"] . "&lng=" . $_REQUEST["lng"] . "&username=" . $geoNamesUsername . "&style=full");
if ($output["status"]["code"] === 200)
{
    if (count(value: $output["data"]["geonames"]) > 0)
    {
        for ($i = 0; $i < count(value: $output["data"]["geonames"]); $i++)
        {
            $output["data"]["geonames"][$i] = 
            [
                "summary" => $output["data"]["geonames"][$i]["summary"], 
                "title" => $output["data"]["geonames"][$i]["title"], 
                "wikipediaURL" => $output["data"]["geonames"][$i]["wikipediaUrl"]
            ];
        }
    }
    else
    {
        $output["data"] = [];
    }
}
$output["status"]["returnedIn"] = intval(value: (microtime(as_float: true) - $executionStartTime) * 1000) . " ms";
echo json_encode(value: $output);

?>