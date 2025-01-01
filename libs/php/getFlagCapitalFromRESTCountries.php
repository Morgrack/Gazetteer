<?php

$executionStartTime = microtime(true);
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *'); 

require 'getFromAPIsCommon.php';
$output = validate_cURL_JSON($url = 'https://restcountries.com/v3.1/alpha/' . $_REQUEST['countryCode'] . '?fields=flags,capital,capitalInfo');
if ($output['data'] !== null) {
    if (array_key_exists('flags', $output['data'])) {
        $output['status']['code'] = 200;
        $output['status']['name'] = 'success';
        $output['status']['description'] = 'ok';
        $object = new stdClass();
        $object->capital = $output['data']['capital'][0];
        $object->capital_info = $output['data']['capitalInfo'];
        $object->flags = $output['data']['flags']['png'];
        $output['data'] = $object;
    } else {
        $output['status']['code'] = $output['data']['status'];
        $output['status']['name'] = 'Failure - API';
        $output['status']['description'] = $output['data']['message'];
        $output['data'] = null;
    }
}

$output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
echo json_encode($output);

?>