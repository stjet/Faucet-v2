function address_related_to_blacklist(account_history, blacklisted_addresses) {
  if (account_history.history) {
    for (let i = 0; i < account_history.history.length; i++) {
      if (account_history.history[i].type == 'send' && blacklisted_addresses.includes(account_history.history[i].account)) {
        return true;
      }
    }
  }
  return false;
}

// Return score where higher number means high suspicion
// This is only to strain out suspicious addresses from a mass of addresses
// A high number does not mean an address is definitely a bot/cheating account and vice versa
async function account_creation(account_history) {
  let current_time = Math.round(new Date().getTime() / 1000);
  // 3500 is the maximum amount of transactions the lib will return. If more or equal to 3500, we dont know the true age, but its probably old
  if (account_history.length >= 3500) return false;
  let account_creation = Number(account_history[account_history.length - 1].local_timestamp);
  return current_time - account_creation;
}

async function is_funneling(account_history, blacklisted_addresses) {
  // account_history = account_history.slice(0,100);
  let sent_to = {};
  for (let i = 0; i < account_history.length; i++) {
    if (account_history[i].type == 'send' && !blacklisted_addresses.includes(account_history[i].account)) {
      if (sent_to[account_history[i].account]) sent_to[account_history[i].account] += 1;
      else sent_to[account_history[i].account] = 1;
    }
  }
  let funneling = 0;
  for (i = 0; i < Object.keys(sent_to).length; i++) {
    if (sent_to[Object.keys(sent_to)[i]] > 4) funneling += 1;
  }
  if (funneling == 0) return false;
  else return true;
}

async function get_score(data) {
  let score = 0;

  if (!data.history) {
    return (score += 4);
  } else {
    const creation = await account_creation(data.history);
    if (creation && creation < 60 * 60 * 24 * 7) score += 3;
  }

  if (address_related_to_blacklist(data.history, data.blacklisted_addresses)) score += 10;

  if (data.balance < 0.1) score += 3;
  else if (data.balance < 1) score += 1;

  const funneling = await is_funneling(data.history, data.blacklisted_addresses);
  if (funneling) score += 3;

  let ratioBalanceHistory = data.balance / data.history.length;
  if (ratioBalanceHistory < 1 / 4) score += 4;
  return score;
}

module.exports = {
  address_related_to_blacklist,
  get_score,
};
