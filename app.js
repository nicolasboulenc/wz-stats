"use strict";

async function app_init() {

	let json = null;
	try {
		const response = await fetch(`stats.json`, {credentials: 'include'})
		if (response.ok !== true) {
			console.log(`Error: ${response.statusText}`);
			return null;
		}
		json = await response.json();
	}
	catch(error) {
		console.log(`Error: ${error}`);
		return null;
	}

	// process data
	const stats = {};
	let summary = null;
	let current_date = '';
	for(let game of json) {

		const d = new Date(game.startedAt * 1000).toLocaleDateString();
		if(current_date !== d) {

			if(summary !== null) {
				for(let player in summary) {
					if(	summary[player].kills !== 0 && summary[player].damageDone !== 0 &&
						summary[player].deaths !== 0 && summary[player].damageTaken !== 0 ) {

						summary['minmax'].kills = Math.max(summary['minmax'].kills, summary[player].kills);
						summary['minmax'].damageDone = Math.max(summary['minmax'].damageDone, summary[player].damageDone);
						summary['minmax'].headshots = Math.max(summary['minmax'].headshots, summary[player].headshots);
						summary['minmax'].deaths = Math.min(summary['minmax'].deaths, summary[player].deaths);
						summary['minmax'].damageTaken = Math.min(summary['minmax'].damageTaken, summary[player].damageTaken);
					}
				}
				stats[current_date] = summary;
			}

			current_date = d;
			summary = {};
			for(let player of PLAYERS) {
				summary[player] = { teamPlacement: Infinity, kills: 0, headshots: 0, deaths: 0, damageDone: 0, damageTaken: 0 };
			}
			summary['minmax'] = { teamPlacement: Infinity, kills: 0, headshots: 0, deaths: Infinity, damageDone: 0, damageTaken: Infinity };
		}

		for(let player of game.players) {
			if(PLAYERS.includes(player.username) === true) {

				summary[player.username].teamPlacement = Math.min(summary[player.username].teamPlacement, game.teamPlacement);
				summary[player.username].kills += player.kills;
				summary[player.username].headshots += player.headshots;
				summary[player.username].deaths += player.deaths;
				summary[player.username].damageDone += player.damageDone;
				summary[player.username].damageTaken += player.damageTaken;
			}
		}
	}

	if(summary !== null) {

		for(let player in summary) {

			if(	summary[player].teamPlacement !== 0 && summary[player].kills !== 0 && summary[player].damageDone !== 0 &&
				summary[player].deaths !== 0 && summary[player].damageTaken !== 0 && player !== 'minmax') {

				summary['minmax'].kills = Math.max(summary['minmax'].kills, summary[player].kills);
				summary['minmax'].damageDone = Math.max(summary['minmax'].damageDone, summary[player].damageDone);
				summary['minmax'].headshots = Math.max(summary['minmax'].headshots, summary[player].headshots);
				summary['minmax'].deaths = Math.min(summary['minmax'].deaths, summary[player].deaths);
				summary['minmax'].damageTaken = Math.min(summary['minmax'].damageTaken, summary[player].damageTaken);
			}
		}
		stats[current_date] = summary;
	}

	render(PLAYERS, stats, json);

	const elems = document.querySelectorAll('[data-target]');
	for(let elem of elems) {
		elem.onclick = day_onclick;
	}
}



function render(players, stats, json) {

	let content = '<thead><tr><th></th><th></th>';

	for(let player of players) {
		content += `<th class="tc w20">${player}</th>`;
	}
	content += '</tr></thead><tbody>';

	let current_date = '';
	for(let game of json) {

		// date summary
		const d = new Date(game.startedAt * 1000);
		if(current_date !== d.toLocaleDateString()) {

			current_date = d.toLocaleDateString();
			let teamPlacement = `<tr class="t-sum t-sum-top"><td class="tt" rowspan=6><a href="#" data-target="${current_date}">${current_date}</a></td><td>teamPlacement</td>`;
			let kills = `<tr class="t-sum"><td>kills</td>`;
			let damage = `<tr class="t-sum"><td>dmg done</td>`;
			let deaths = `<tr class="t-sum"><td>deaths</td>`;
			let taken = `<tr class="t-sum"><td>dmg taken</td>`;
			let headshots = `<tr class="t-sum t-sum-bottom"><td>headshots</td>`;
			for(let player of players) {

				teamPlacement += `<td class="tc w20">${fmt(stats[current_date][player].teamPlacement)}</td>`;

				let best = '';
				if(stats[current_date][player].kills === stats[current_date]['minmax'].kills && stats[current_date]['minmax'].kills > 0) best = 'best';
				kills += `<td class="tc w20 ${best}">${fmt(stats[current_date][player].kills)}</td>`;

				best = '';
				if(stats[current_date][player].damageDone === stats[current_date]['minmax'].damageDone && stats[current_date]['minmax'].damageDone > 0) best = 'best';
				damage += `<td class="tc w20 ${best}">${fmt(stats[current_date][player].damageDone)}</td>`;

				best = '';
				if(stats[current_date][player].deaths === stats[current_date]['minmax'].deaths && stats[current_date]['minmax'].deaths > 0) best = 'best';
				deaths += `<td class="tc w20 ${best}">${fmt(stats[current_date][player].deaths)}</td>`;

				best = '';
				if(stats[current_date][player].damageTaken === stats[current_date]['minmax'].damageTaken && stats[current_date]['minmax'].damageTaken > 0) best = 'best';
				taken += `<td class="tc w20 ${best}">${fmt(stats[current_date][player].damageTaken)}</td>`;

				best = '';
				if(stats[current_date][player].headshots === stats[current_date]['minmax'].headshots && stats[current_date]['minmax'].headshots > 0) best = 'best';
				headshots += `<td class="tc w20 ${best}">${fmt(stats[current_date][player].headshots)}</td>`;
			}
			teamPlacement += `</tr>`;
			kills += `</tr>`;
			damage += `</tr>`;
			deaths += `</tr>`;
			taken += `</tr>`;
			headshots += `</tr>`;

			content += teamPlacement + kills + damage + deaths + taken + headshots;
		}

		// game details
		let teamPlacement = `<tr class="t-det dn" data-day="${current_date}"><td class="tt ps1" rowspan=6>${d.toLocaleTimeString()}</td><td>teamPlacement</td>`;
		let kills = `<tr class="t-det dn" data-day="${current_date}"><td>kills</td>`;
		let damage = `<tr class="t-det dn" data-day="${current_date}"><td>dmg done</td>`;
		let deaths = `<tr class="t-det dn" data-day="${current_date}"><td>deaths</td>`;
		let taken = `<tr class="t-det dn" data-day="${current_date}"><td>dmg taken</td>`;
		let headshots = `<tr class="t-det dn" data-day="${current_date}"><td>headshots</td>`;
		for(let player of players) {

			let player_index = 0;
			while(player_index < game.players.length) {
				if(game.players[player_index].username === player) {
					break;
				}
				player_index++;
			}
			if(player_index < game.players.length) {
				teamPlacement += `<td class="tc w20">${fmt(game.teamPlacement)}</td>`;
				kills += `<td class="tc w20">${fmt(game.players[player_index].kills)}</td>`;
				damage += `<td class="tc w20">${fmt(game.players[player_index].damageDone)}</td>`;
				deaths += `<td class="tc w20">${fmt(game.players[player_index].deaths)}</td>`;
				taken += `<td class="tc w20">${fmt(game.players[player_index].damageTaken)}</td>`;
				headshots += `<td class="tc w20">${fmt(game.players[player_index].headshots)}</td>`;
			}
			else {
				teamPlacement += `<td class="tc">-</td>`;
				kills += `<td class="tc">-</td>`;
				damage += `<td class="tc">-</td>`;
				deaths += `<td class="tc">-</td>`;
				taken += `<td class="tc">-</td>`;
				headshots += `<td class="tc">-</td>`;
			}
		}
		teamPlacement += `</tr>`;
		kills += `</tr>`;
		damage += `</tr>`;
		deaths += `</tr>`;
		taken += `</tr>`;
		headshots += `</tr>`;

		content += teamPlacement + kills + damage + deaths + taken + headshots;
	}

	document.getElementById('stats').innerHTML = content + '</tbody>';
}



function day_onclick(evt) {

	const day = evt.target.dataset.target;
	const elems = document.querySelectorAll(`[data-day='${day}']`);
	for(let elem of elems) {
		elem.classList.toggle('dn');
	}
}



function fmt(val) {
	if(val === 0 || val === Infinity) return '-';
	return val;
}



const PLAYERS = [ 'Captainfish34', 'RocketMan0112', 'Stefwar' ];

window.onload = app_init;
