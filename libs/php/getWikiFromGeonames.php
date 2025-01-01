<?php

$executionStartTime = microtime(true);
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *'); 

require 'getFromAPIsCommon.php';
$geoNamesUsername = 'morgrack';
$output = validate_cURL_JSON('http://api.geonames.org/wikipediaSearchJSON?q=' . $_REQUEST['countryName'] . '&title=' . $_REQUEST['countryName'] . '&maxRows=10&username=' . $geoNamesUsername);
if ($output['data'] !== null) {
    if (count($output['data']['geonames']) > 0) {
        $newValue = null;
        foreach ($output['data']['geonames'] as $value) {
            if ($value['title'] === str_replace("%20", ' ', $_REQUEST['countryName'])) {
                $newValue = $value;
                break;
            }  
        }
        $output['data'] = $newValue;
        if ($output['data'] !== null) {
            $output['status']['code'] = 200;
            $output['status']['name'] = 'success';
            $output['status']['description'] = 'ok';
        } else {
            $output['status']['code'] = 400;
            $output['status']['name'] = 'Failure - API / Failure - Results';
            $output['status']['description'] = 'invalid results';
            $output['data'] = null; 
        }
    } else {
        $output['status']['code'] = 400;
        $output['status']['name'] = 'Failure - API / Failure - Results';
        $output['status']['description'] = 'invalid results';
        $output['data'] = null;
    }
}

$output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
echo json_encode($output);

?>