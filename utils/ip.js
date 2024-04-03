function extract_ip_x_forwarded_for(x_forwarded_for, trusted_proxy_count) {
  // Eg, if request from client goes through two trusted proxies A and B
  // x-forwarded-for: client, A
  let x_split = x_forwarded_for.split(",");
  return x_split[x_split.length - trusted_proxy_count];
}

function get_ip(remote_ip, x_forwarded_for, trusted_proxy_count) {
  if (trusted_proxy_count === 0) {
    return remote_ip;
  } else if (!trusted_proxy_count) {
    return x_forwarded_for;
  } else {
    // The ?? is since if trusted_proxy_count is misconfigured to be higher than it really is, extract_ip_x_forwarded_for will returned undefined as the IP, which will will mean only 4 faucets can be made globally, not per IP
    return extract_ip_x_forwarded_for(x_forwarded_for, trusted_proxy_count) ?? x_forwarded_for;
  }
}

module.exports = {
  get_ip,
};
