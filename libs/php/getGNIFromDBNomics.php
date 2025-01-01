<?php

$executionStartTime = microtime(true);
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *'); 

require 'getFromAPIsCommon.php';
$output = validate_cURL_JSON('https://api.db.nomics.world/v22/series/UNDATA/DF_UNDATA_WDI?dimensions=%7B%22REF_AREA%22%3A%5B%22' . $_REQUEST['countryCode'] . '%22%5D%7D&observations=1&q=gni%2C%20ppp%20current%20international');
if ($output['data'] !== null) {
    if (array_key_exists('series', $output['data'])) {
        $output['status']['code'] = 200;
        $output['status']['name'] = 'success';
        $output['status']['description'] = 'ok';
        $resultGNI = null;
        foreach ($output['data']["series"]["docs"]["0"]["value"] as $value) {
            if ($value !== 'NA') {
                $resultGNI = $value;
            }
        }
        $output['data'] = $resultGNI;
    } else {
        $output['status']['code'] = 400;
        $output['status']['name'] = 'Failure - API / Failure - Results';
        $output['status']['description'] = 'could not retrieve gni data';
        $output['data'] = null;
    }
}

$output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
echo json_encode($output);

?>