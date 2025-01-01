<?php

$executionStartTime = microtime(true);
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *'); 

require 'getFromAPIsCommon.php';
$geoNamesUsername = 'morgrack';
$output = validate_cURL_JSON('http://api.geonames.org/searchJSON?country=' . $_REQUEST['countryCode'] . '&q=park&maxRows=1000&username=' . $geoNamesUsername . '&style=full');
if ($output['data'] !== null) {
    if (count($output['data']['geonames']) > 0) {
        $newArray = [];
        foreach ($output['data']['geonames'] as $value) {
            if ($value['fcodeName'] === 'park') {
                $object = new stdClass();
                $object->lat = $value['lat'];
                $object->lng = $value['lng'];
                $object->name = $value['name'];
                array_push($newArray, $object);
            }  
        }
        $output['data'] = $newArray;
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