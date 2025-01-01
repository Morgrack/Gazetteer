<?php

$executionStartTime = microtime(true);
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *'); 

require 'getFromAPIsCommon.php';
$openCageKey = 'fd0b96a962d9446b8a5667e8ce2b9043';
$output = validate_cURL_JSON('https://api.opencagedata.com/geocode/v1/json?q=' . $_REQUEST['lat'] . '+' . $_REQUEST['lng'] . '&key=' . $openCageKey . '&pretty=1');
if ($output['data'] !== null) {
    if (count($output['data']['results']) > 0 && $output['data']['status']['code'] === 200) {
        $output['status']['code'] = 200;
        $output['status']['name'] = 'success';
        $output['status']['description'] = 'ok';
        $output['data'] = $output['data']['results'][0]['formatted'];
    } else {
        $output['status']['code'] = $output['data']['status']['code'];
        $output['status']['name'] = 'Failure - API / Failure - Results';
        $output['status']['description'] = $output['data']['status']['message'];
        $output['data'] = null;
    }
}

$output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
echo json_encode($output);

?>