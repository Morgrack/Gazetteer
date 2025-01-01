<?php

    $data = file_get_contents('../js/json/countryBorders.geo.json');
    $data = json_decode($data, true);
    $new_data = '';
    foreach ($data['features'] as $entry) {
        if ($entry['properties']['iso_a3'] === $_REQUEST['countryCode']) {
            $new_data = $entry;
            break;
        }
    }
    echo json_encode($new_data);

?>