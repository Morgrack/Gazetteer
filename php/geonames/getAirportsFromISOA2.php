<?php

require "../config.php";
require "../fetch.php";
$executionStartTime = microtime(as_float: true);
$output = fetch(URL: "http://api.geonames.org/searchJSON?formatted=true&q=airport&maxRows=1000&country=" . $_REQUEST["isoa2"] . "&username=" . $geoNamesUsername);
if ($output["status"]["code"] === 200)
{
    if (count(value: $output["data"]["geonames"]) > 0)
    {
        $newResults = [];
        foreach ($output["data"]["geonames"] as $result)
        {
            if ($result["fcodeName"] === "airport")
            {
                $newResults[] =
                [
                    "lat" => $result["lat"],
                    "lng" => $result["lng"],
                    "name" => $result["name"]
                ];
            }
        }
        $output["data"] = $newResults;
    }
}
$output["status"]["returnedIn"] = intval(value: (microtime(as_float: true) - $executionStartTime) * 1000) . " ms";
echo json_encode(value: $output);

?>