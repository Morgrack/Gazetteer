<?php
    function validate_cURL_JSON($url) {

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_URL,$url);
        $result = curl_exec($ch);
        $cURLERROR = curl_errno($ch);
        curl_close($ch);

        if ($cURLERROR) {
            $output['status']['code'] = $cURLERROR;
            $output['status']['name'] = "Failure - cURL";
            $output['status']['description'] = curl_strerror($cURLERROR);
            $output['data'] = null;
        } else {
            $decoded_result = json_decode($result, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                $output['status']['code'] = json_last_error();
                $output['status']['name'] = "Failure - JSON";
                $output['status']['description'] = json_last_error_msg();
                $output['data'] = null;
            } else if ($decoded_result === null) {
                $output['status']['code'] = 400;
                $output['status']['name'] = 'Failure - API';
                $output['status']['description'] = 'null response';
                $output['data'] = null;
            } else {
                $output['status']['code'] = 'undefined';
                $output['status']['name'] = 'undefined';
                $output['status']['description'] = 'undefined';
                $output['data'] = $decoded_result;
            }
        }
        return $output;

    }

?>