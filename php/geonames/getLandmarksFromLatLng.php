<?php

require "../config.php";
require "../fetch.php";
$executionStartTime = microtime(as_float: true);
$output = fetch(URL: "http://api.geonames.org/findNearbyWikipediaJSON?formatted=true&maxRows=500&radius=1&lat=" . $_REQUEST["lat"] . "&lng=" . $_REQUEST["lng"] . "&username=" . $geoNamesUsername . "&style=full");
if ($output["status"]["code"] === 200)
{
    if (count(value: $output["data"]["geonames"]) > 0)
    {
        $newResults = [];
        foreach ($output["data"]["geonames"] as $result)
        {
            $newResults[] =
            [
                "summary" => $result["summary"],
                "title" => $result["title"],
                "wikipediaURL" => $result["wikipediaUrl"]
            ];
        }
        $output["data"] = $newResults;
    }
    else
    {
        $output["data"] = [];
    }
}
$output["status"]["returnedIn"] = intval(value: (microtime(as_float: true) - $executionStartTime) * 1000) . " ms";
echo json_encode(value: $output);

?>