const bananojs = require('bananojs');

let test_address = 'ban_3346kkobb11qqpo17imgiybmwrgibr7yi34mwn5j6uywyke8f7fnfp94uyps';
let nodes = [
  'https://kaliumapi.appditto.com/api',
  'https://api.banano.kga.earth/node/proxy',
  'https://nodes.banano.id/api.php',
  'https://vault.banano.cc/api/node-api'
];

(async () => {
  available_nodes = [];

  for (const url in nodes) {
    try {
      bananojs.setBananodeApiUrl(nodes[url]);
      console.log(`Testing 'accounts_balances' action for ${nodes[url]} with address ${test_address}`);
      await bananojs.getAccountBalanceRaw(test_address);
      available_nodes.push(nodes[url]);
    } catch (error) {
      console.log(`Unavailable: ${nodes[url]}`);
    }
  }

  if (available_nodes.length === 0) console.log('No available nodes at the moment, you might be rate-limited');
  else for (const available in available_nodes) console.log(`Available: ${available_nodes[available]}`);
})();
