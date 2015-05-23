<?php
	$content = file_get_contents("https://data.sfgov.org/Economy-and-Community/Mobile-Food-Facility-Permit/rqzj-sfat?");
	// echo "$content";
	
	// $index = {35,38,44,45,56};
	// foreach ($index as &$id) {
	//     $pattern = '<div class="blist-td blist-t1-c2049109'.$id'.*>(.*)<.*>';
	// 	preg_match($pattern, $content, $Applicant);
	// 	
	// 	echo $Applicant[0];
	// }
	
	// if (preg_match("/ell/", "Hello World!", $matches)) {
	//   echo "Match was found <br />";
	//   echo $matches[0]."<br />";
	// }
	
	// $pattern = '/<div class=\"blist-td blist-t1-c204910935 \">(.*)<\/div>/';
	// preg_match($pattern, $content, $Applicant);
	preg_match('/<div class=\"blist-td blist-t1-c204910935 \">(.*)<\/div>/', $content, $Applicant);
	echo $Applicant[1];
	
	$.get('https://data.sfgov.org/Economy-and-Community/Mobile-Food-Facility-Permit/rqzj-sfat?', function(data)
	{
	    var $quotes = $(data).find('blist-td blist-t1-c204910935 '),
	        count = $quotes.length,
	        $random = $quotes.eq( Math.floor(Math.random() * count) );

	    $('#myDiv').append( $random );
	});
	
	echo "THE END.";
?>
