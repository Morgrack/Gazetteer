<?php

require "../config.php";
require "../fetch.php";
$executionStartTime = microtime(as_float: true);
$output = fetch(URL: "https://api.opencagedata.com/geocode/v1/json?q=" . $_REQUEST["lat"] . "+" . $_REQUEST["lng"] . "&key=" . $openCageKey . "&pretty=1");
if ($output["status"]["code"] === 200)
{
    if (count(value: $output["data"]["results"]) > 0)   
    {
        $newData = [];
        if (array_key_exists(key: "formatted", array: $output["data"]["results"][0])) 
        {
            $newData["address"] = $output["data"]["results"][0]["formatted"];
        }
        if (array_key_exists(key: "ISO_3166-1_alpha-3", array: $output["data"]["results"][0]["components"])) 
        {
            $newData["isoa3"] = $output["data"]["results"][0]["components"]["ISO_3166-1_alpha-3"];
        }
        $output["data"] = count(value: $newData) === 0 ? null : $newData;
    }
    else
    {
        $output["data"] = null;
    }
}
$output["status"]["returnedIn"] = intval(value: (microtime(as_float: true) - $executionStartTime) * 1000) . " ms";
echo json_encode(value: $output);

?>