<?php

require "../fetch.php";
$executionStartTime = microtime(as_float: true);
$output = fetch(URL: "https://api.db.nomics.world/v22/series/WB/WDI/A-NY.GDP.MKTP.CD-" . $_REQUEST["isoa3"] . "?format=json&observations=1");
if ($output["status"]["code"] === 200)
{

}
$output["status"]["returnedIn"] = intval(value: (microtime(as_float: true) - $executionStartTime) * 1000) . " ms";
echo json_encode(value: $output);

?>