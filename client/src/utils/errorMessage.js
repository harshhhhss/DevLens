/**
 * Turns an axios/network failure into a message a user can act on.
 *
 * The server's own message always wins when present - this only fills the gap
 * where the request never reached the API, timed out, or came back with a
 * status but no useful body.
 */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const serverMessage = error?.response?.data?.message;
  if (serverMessage) return serverMessage;

  // Request was cancelled or timed out before a response arrived.
  if (error?.code === 'ECONNABORTED' || /timeout/i.test(error?.message || '')) {
    return 'The request timed out. The server may be waking up - please try again in a moment.';
  }

  // No response at all: server unreachable, DNS failure, CORS block, offline.
  if (!error?.response) {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return 'You appear to be offline. Check your connection and try again.';
    }
    return 'Could not reach the server. It may be starting up, or your connection may be down.';
  }

  const status = error.response.status;
  const byStatus = {
    400: 'That request was not valid. Please check your input and try again.',
    401: 'Your session has expired. Please log in again.',
    403: 'You do not have permission to do that.',
    404: 'We could not find what you were looking for.',
    409: 'That already exists. Try a different value.',
    413: 'That submission is too large. Try a smaller snippet.',
    429: 'Too many requests. Please wait a moment before trying again.',
    500: 'The server ran into a problem. Please try again shortly.',
    502: 'The server is unavailable right now. Please try again shortly.',
    503: 'The service is temporarily unavailable. Please try again shortly.',
    504: 'The server took too long to respond. Please try again.',
  };

  return byStatus[status] || fallback;
}

export default getErrorMessage;
