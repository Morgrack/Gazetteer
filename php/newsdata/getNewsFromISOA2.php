<?php

require "../config.php";
require "../fetch.php";
$executionStartTime = microtime(as_float: true);
$output = fetch(URL: "https://newsdata.io/api/1/news?apikey=" . $newsDataKey . "&country=" . $_REQUEST["isoa2"] . "&prioritydomain=top&category=environment,politics,science&excludedomain=dailymail.co.uk");
if ($output["status"]["code"] === 200)
{
    if (count(value: $output["data"]["results"]) > 0)
    {
        $newResults = [];
        foreach ($output["data"]["results"] as $result)
        {
            $newResults[] = 
            [
                "category" => $result["category"],
                "image_url" => $result["image_url"],
                "link" => $result["link"],
                "title" => $result["title"]
            ];
        }
        $output["data"] = $newResults;
    }
    else
    {
        $output["data"] = null;
    }
}
$output["status"]["returnedIn"] = intval(value: (microtime(as_float: true) - $executionStartTime) * 1000) . " ms";
echo json_encode(value: $output);

?>