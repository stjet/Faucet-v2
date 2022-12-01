async function get_ip() {
  let response = await fetch('https://api.ipify.org/?format=json');
  response = await response.json();
  if (response.ip) return response.ip;
  else false;
}

async function submit_ip() {
  const ip = await get_ip();
  let input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'ip';
  input.id = 'ip';
  input.value = ip;

  const extra_form = document.getElementById('extra');
  if (extra_form && ip) extra_form.appendChild(input);
}
