<?php

$executionStartTime = microtime(true);
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *'); 

require 'getFromAPIsCommon.php';
$newsDataKey = 'pub_32254f5bbd7d3b0821f689148e73132b16d6e';
$output = validate_cURL_JSON('https://newsdata.io/api/1/news?apikey=' . $newsDataKey . '&country=' . $_REQUEST['countryCode'] . '&prioritydomain=top&category=business,environment,politics,science&excludedomain=dailymail.co.uk');
if ($output['data'] !== null) {
    if ($output['data']['status'] == 'success') {
        if (count($output['data']['results']) > 0) {
            $output['status']['code'] = 200;
            $output['status']['name'] = 'success';
            $output['status']['description'] = 'ok';
            $output['data'] = $output['data']['results'];
        } else {
            $output['status']['code'] = 400;
            $output['status']['name'] = 'Failure - Results';
            $output['status']['description'] = 'no results';
            $output['data'] = null;
        }
    } else {
        $output['status']['code'] = 400;
        $output['status']['name'] = 'Failure - API / Failure - Results';
        $output['status']['description'] = $output['data']['results']['message'];
        $output['data'] = null;
    }
}

$output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
echo json_encode($output);

?>