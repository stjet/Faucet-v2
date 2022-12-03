// Returns the number of decimals in a number. If higher or equal to 1 returns -1
function get_number_decimal_zeros(number) {
  return -Math.floor(Math.log10(number) + 1);
}

function truncate_to_decimals(number, decimals) {
  const calculate_decimals = Math.pow(10, decimals);
  return Math.trunc(number * calculate_decimals) / calculate_decimals;
}

function format_amount_decimals(amount) {
  if (amount >= 0.1) return truncate_to_decimals(amount, 2);
  else return truncate_to_decimals(amount, get_number_decimal_zeros(amount) + 2);
}

// Convert milliseconds to days, hours, and minutes, and then formats the result using a truth table
function milliseconds_to_readable(milliseconds) {
  let diff_days = Math.floor(milliseconds / 86400000);
  let diff_hours = Math.floor((milliseconds % 86400000) / 3600000);
  let diff_minutes = Math.round(((milliseconds % 86400000) % 3600000) / 60000);
  const format_result = (days, hours, minutes) => {
    // Without this it might display '23 hours and 60 minutes'
    if (diff_minutes >= 60) {
      diff_minutes--;
    }
    // Singular and plural logic or false if 0
    if (minutes == 0) {
      minutes = false;
    } else if (diff_minutes == 1) {
      minutes = `${diff_minutes} minute`;
    } else {
      minutes = `${diff_minutes} minutes`;
    }
    if (hours == 0) {
      hours = false;
    } else if (hours == 1) {
      hours = `${diff_hours} hour`;
    } else {
      hours = `${diff_hours} hours`;
    }
    if (days == 0) {
      days = false;
    } else if (days == 1) {
      days = `${diff_days} day`;
    } else {
      days = `${diff_days} days`;
    }
    // Truth table
    if (days && hours && minutes) {
      return `${days}, ${hours} and ${minutes}`;
    }
    if (days && hours) {
      return `${days} and ${hours}`;
    }
    if (days && minutes) {
      return `${days} and ${minutes}`;
    }
    if (hours && minutes) {
      return `${hours} and ${minutes}`;
    }
    if (days) {
      return `${days}`;
    }
    if (hours) {
      return `${hours}`;
    }
    if (minutes) {
      return `${minutes}`;
    }
    if (!minutes && !hours && !days && diff_minutes < 1) {
      return `Less than one minute`;
    }
  };
  return format_result(diff_days, diff_hours, diff_minutes);
}

module.exports = {
  get_number_decimal_zeros: get_number_decimal_zeros,
  truncate_to_decimals: truncate_to_decimals,
  format_amount_decimals: format_amount_decimals,
  milliseconds_to_readable: milliseconds_to_readable,
};
