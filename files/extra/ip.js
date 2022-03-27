async function get_ip() {
	let resp = await fetch("https://www.cloudflare.com/cdn-cgi/trace");
	resp = await resp.text();
	let ip = resp.split('\n')[2].split('=')[1];
	ip = ip.split(".");
	return ip[0]+"."+ip[1]+".xxx."+ip[3];
}

async function submit_ip() {
	//create html element
	let input = document.createElement("input");
	input.type = "hidden";
	input.name = "ip";
	input.id = "ip";
	let ip = await get_ip();
	input.value = ip;
	let extra_form = document.getElementById('extra');
	if (extra_form) {
		extra_form.appendChild(input);
	}
}

submit_ip();