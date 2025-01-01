<?php

$executionStartTime = microtime(true);
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *'); 

require 'getFromAPIsCommon.php';
$openExchangeKey = '53ab83aae4ae468c8f418520b7834df0'; //main '229e5c0fabe6416497ba4485e9189d8a'
$output = validate_cURL_JSON($url = 'https://openexchangerates.org/api/latest.json?app_id=' . $openExchangeKey);
if ($output['data'] !== null) {
    if (array_key_exists('rates', $output['data'])) {
        $output['status']['code'] = 200;
        $output['status']['name'] = 'success';
        $output['status']['description'] = 'ok';
        $output['data'] = $output['data']['rates'][$_REQUEST['currencyCode']];
    } else {
        $output['status']['code'] = $output['data']['status'];
        $output['status']['name'] = 'Failure - API / Failure - Results';
        $output['status']['description'] = $output['data']['description'];
        $output['data'] = null;
    }
}

$output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
echo json_encode($output);

?>