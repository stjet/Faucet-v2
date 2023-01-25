const vite = require('@vite/vitejs');
const { HTTP_RPC } = require('@vite/vitejs-http');
const Big = require('big.js');

/* Vite Documentation
 * https://docs.vite.org/vite-docs/vite.js/
 * https://docs.vite.org/vite-docs/vite.js/accountBlock/createAccountBlock.html
 * https://docs.vite.org/vite-docs/api/rpc/ledger_v2.html#
 */

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Vite setup
let rpc, provider;

const set_rpc = (url) => {
  rpc = new HTTP_RPC(url);
  provider = new vite.ViteAPI(rpc);
};

async function receive(address, private_key) {
  // Auto receive
  let receive = new vite.accountBlock.ReceiveAccountBlockTask({
    address: address,
    privateKey: private_key,
    provider: provider,
  });

  receive.start();
}

async function check_bal(address, check_token = false, token_id = undefined) {
  try {
    // ledger_getAccountInfoByAddress
    let resp = await provider.request('ledger_getAccountInfoByAddress', address);
    // This is VITE
    let token_resp = resp.balanceInfoMap?.[token_id];
    // Token id of VITE
    let vite_resp = resp.balanceInfoMap['tti_5649544520544f4b454e6e40'];
    if (check_token) {
      let re = [];
      if (!vite_resp) re.push(false);
      else re.push(vite_resp.balance * 10 ** -vite_resp.tokenInfo.decimals);

      if (!token_resp) re.push(false);
      else re.push(token_resp.balance * 10 ** -token_resp.tokenInfo.decimals);

      return re;
    }

    return [vite_resp.balance * 10 ** -vite_resp.tokenInfo.decimals, false];
  } catch (error) {
    // This will be called if node is not available
    return [0, false];
  }
}

async function dry(address, check_token = false, token_id = undefined, token_min_amount = 0) {
  let dry_info = { token: false, coin: false };
  let bal = await check_bal(address, check_token, token_id);
  if (bal[0] < 1) dry_info.coin = true;
  if (bal[1] !== false && bal[1] <= token_min_amount) dry_info.token = true;
  return dry_info;
}

async function get_account_history(address) {
  let resp = await provider.request('ledger_getAccountBlocks', [address, null, null, 1500]);
  return resp.result;
}

async function is_unopened(address) {
  if (Object.keys(await get_account_history(address)).length == 0) return true;
  else return false;
}

async function send(private_key, sender_address, address, amount, options) {
  // createAccountBlock
  // ledger_sendRawTransaction
  // Send Vite
  // CONVERT AMOUNTS TO RAW (no decimals)

  if (options.send_vite) {
    let vite_send = vite.accountBlock
      .createAccountBlock('send', {
        address: sender_address,
        toAddress: address,
        tokenId: 'tti_5649544520544f4b454e6e40',
        amount: Big(String(amount) + 'e18').toFixed(),
      })
      .setProvider(provider)
      .setPrivateKey(private_key);

    const [quota, difficulty] = await Promise.all([
      provider.request('contract_getQuotaByAccount', sender_address),
      vite_send.autoSetPreviousAccountBlock().then(() =>
        provider.request('ledger_getPoWDifficulty', {
          address: vite_send.address,
          previousHash: vite_send.previousHash,
          blockType: vite_send.blockType,
          toAddress: vite_send.toAddress,
          data: vite_send.data,
        })
      ),
    ]);

    const availableQuota = Big(quota.currentQuota);
    if (availableQuota < difficulty.requiredQuota) {
      await vite_send.PoW(difficulty.difficulty);
    }

    try {
      let result = await vite_send.sign().send();
    } catch (error) {
      // Return false if there was an error(?)
    }
  }

  // Send token
  // Token can be undefined
  if (options.send_token) {
    if (options.send_vite) {
      await sleep(1200);
    }
    let token_send = vite.accountBlock
      .createAccountBlock('send', {
        address: sender_address,
        toAddress: address,
        tokenId: options.token_id,
        amount: Big(String(options.token_amount) + 'e' + String(options.token_decimals)).toFixed(),
      })
      .setProvider(provider)
      .setPrivateKey(private_key);

    const [quota, difficulty] = await Promise.all([
      provider.request('contract_getQuotaByAccount', sender_address),
      token_send.autoSetPreviousAccountBlock().then(() =>
        provider.request('ledger_getPoWDifficulty', {
          address: token_send.address,
          previousHash: token_send.previousHash,
          blockType: token_send.blockType,
          toAddress: token_send.toAddress,
          data: token_send.data,
        })
      ),
    ]);

    const availableQuota = Big(quota.currentQuota);
    if (availableQuota < difficulty.requiredQuota) {
      await token_send.PoW(difficulty.difficulty);
    }

    try {
      let result = await token_send.sign().send();
    } catch (error) {
      // Return false if there was an error(?)
    }
  }
  return true;
}

async function is_valid(address) {
  if (vite.wallet.isValidAddress(address) === 1) return true;
  else return false;
}

process.on('unhandledRejection', (error) => {
  // console.log(error);
});

module.exports = {
  set_rpc: set_rpc,
  send: send,
  dry: dry,
  check_bal: check_bal,
  receive: receive,
  is_unopened: is_unopened,
  get_account_history: get_account_history,
  is_valid: is_valid,
};
