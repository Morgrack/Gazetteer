<?php

function fetch($URL): array
{
    header(header: 'Content-Type: application/json; charset=UTF-8');
    header(header: 'Access-Control-Allow-Origin: *'); 
    $session = curl_init();
    curl_setopt(handle: $session, option: CURLOPT_RETURNTRANSFER, value: true);
    curl_setopt(handle: $session, option: CURLOPT_URL, value: $URL);
    $result = curl_exec(handle: $session);
    $error = curl_errno(handle: $session);
    if ($error)
    {
        $output["data"] = null;
        $output["status"]["code"] = $error;
        $output["status"]["description"] = curl_strerror(error_code: $error);
        $output["status"]["name"] = "Failure - cURL";
        return $output;
    }
    $parsed_result = json_decode(json: $result, associative: true);
    if (json_last_error() !== JSON_ERROR_NONE)
    {
        $output["data"] = null;
        $output["status"]["code"] = json_last_error();
        $output["status"]["description"] = json_last_error_msg();
        $output["status"]["name"] = "Failure - JSON";
    }
    else if ($parsed_result === null) //make sure that younare not checking conditions twice here
    {
        $output["data"] = null;
        $output["status"]["code"] = 400;
        $output["status"]["description"] = "null response";
        $output["status"]["name"] = "Failure - API";
    }
    else
    {
        $output["data"] = $parsed_result;
        $output["status"]["code"] = 200;
        $output["status"]["description"] = "success";
        $output["status"]["name"] = "Success";
    }
    return $output;
}

?> 