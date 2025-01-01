<?php

$executionStartTime = microtime(true);
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *'); 

require 'getFromAPIsCommon.php';
$geoNamesUsername = 'morgrack';
$output = validate_cURL_JSON('http://api.geonames.org/findNearbyWikipediaJSON?formatted=true&maxRows=500&radius=1&lat=' . $_REQUEST['lat'] . '&lng=' . $_REQUEST['lng'] . '&username=' . $geoNamesUsername . '&style=full');
if ($output['data'] !== null) {
    if (count($output['data']['geonames']) > 0) {
        $output['status']['code'] = 200;
        $output['status']['name'] = 'success';
        $output['status']['description'] = 'ok';
        $newResult = [];
        foreach($output['data']['geonames'] as $element) {
            $object = new stdClass(); 
            $object->title = $element['title']; 
            $object->wikipediaURL = $element['wikipediaUrl']; 
            array_push($newResult, $object);
        }
        $output['data'] = $newResult;
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