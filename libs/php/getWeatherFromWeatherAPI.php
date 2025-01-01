<?php

$executionStartTime = microtime(true);
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *'); 

require 'getFromAPIsCommon.php';
$openWeatherKey = '670ae5c68c9b319028db85219a2599ba';
$output = validate_cURL_JSON('https://api.openweathermap.org/data/2.5/forecast?&units=metric&lat=' . $_REQUEST['lat'] . '&lon=' . $_REQUEST['lng'] . '&appid=' . $openWeatherKey);
if ($output['data'] !== null) {
    if (array_key_exists('list', $output['data'])) {
        $output['status']['code'] = 200;
        $output['status']['name'] = 'success';
        $output['status']['description'] = 'ok';
        $output['data'] =  $output['data']['list'];
    } else {
        $output['status']['code'] = $output['data']['cod'];
        $output['status']['name'] = 'Failure - API / Failure - Results';
        $output['status']['description'] = $output['data']['message'];
        $output['data'] = null;
    }
}

$output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
echo json_encode($output);

?>