<?php

    $data = file_get_contents('../js/json/countryBorders.geo.json');
    $data = json_decode($data, true);
    $new_data = [];
    foreach ($data['features'] as $entry) {
        array_push($new_data, [$entry['properties']['iso_a2'], $entry['properties']['iso_a3'], $entry['properties']['name']]);
    }
    echo json_encode($new_data);
    
?>
