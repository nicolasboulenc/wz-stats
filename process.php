<?php

$games = [];
$game_ids = [];

foreach (glob("*.json") as $filename) {

	if($filename !== 'stats.json') {

		$content = file_get_contents($filename);
		$json = json_decode($content);
		echo 'processing ' . $filename . PHP_EOL;
		foreach($json as $g) {
			if(in_array($g->id, $game_ids) === false) {
				$game_ids[] = $g->id;
				$games[] = process_game($g);
			}
		}
	}
}

usort($games, 'sort_by_timestamp_desc');
file_put_contents('stats.json', json_encode($games, JSON_PRETTY_PRINT));



function sort_by_timestamp_desc($a, $b) {
	if($a->startedAt > $b->startedAt) {
		return -1;
	}
	else if($a->startedAt < $b->startedAt) {
		return 1;
	}
	else {
		return 0;
	}
}



function process_game($game) {
	$g = $game->matchTeamStat;
	$g->startedAt = $game->startedAt;
	return $g;
}

?>