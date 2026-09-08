<?php
$id = $_GET['id'] ?? '';
$title = "Kerala Realty - Find Your Dream Home";
$desc = "Discover amazing properties, villas, lands and apartments in the best locations of Kerala.";
$image = "https://sales.greensparrows.com/kerala_house_banner.jpg";

if ($id) {
    // Call the local backend API to fetch property details
    $apiUrl = "https://api.greensparrows.com/api/properties/" . $id;
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 3);
    $response = curl_exec($ch);
    curl_close($ch);

    if ($response) {
        $data = json_decode($response, true);
        if ($data && !isset($data['error'])) {
            $title = $data['title'] . " - Kerala Realty";
            
            $price = $data['price'];
            if ($price >= 10000000) {
                $priceStr = "₹" . number_format($price / 10000000, 2) . " Cr";
            } else if ($price >= 100000) {
                $priceStr = "₹" . number_format($price / 100000, 1) . " L";
            } else {
                $priceStr = "₹" . number_format($price);
            }
            
            $listedBy = $data['listingRole'] === 'Agency' 
                ? ($data['agencyName'] ?? 'Agency') 
                : ($data['listingRole'] === 'Broker' 
                    ? ($data['brokerName'] ?? 'Broker') 
                    : ($data['ownerName'] ?? 'Owner'));
            
            $desc = "Price: " . $priceStr . " | Location: " . $data['address'] . ", " . $data['district'] . " | Listed by: " . $listedBy;
            
            if (isset($data['images']) && count($data['images']) > 0) {
                $img = $data['images'][0];
                $image = (strpos($img, 'http') === 0) ? $img : "https://api.greensparrows.com" . $img;
            }
        }
    }
}

// Serve the index.html but replace meta tags dynamically
$html = file_get_contents('index.html');

$metaTags = '
    <title>' . htmlspecialchars($title) . '</title>
    <meta property="og:title" content="' . htmlspecialchars($title) . '" />
    <meta property="og:description" content="' . htmlspecialchars($desc) . '" />
    <meta property="og:image" content="' . htmlspecialchars($image) . '" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://sales.greensparrows.com/property/' . htmlspecialchars($id) . '" />
';

// Replace the existing title tag and inject the meta tags
$html = preg_replace('/<title>.*?<\/title>/', $metaTags, $html);

echo $html;
?>
