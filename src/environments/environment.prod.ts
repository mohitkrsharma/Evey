export let socket = null;
export let apiurl = null;
export let salt = 'L393jMc5qRl2Rre5Yk7wIrmO0vDbK3hE';

if (window.location.href.includes('prod')) {
  socket = 'https://socket.live.evey.io';  // tidbit (dev socket domain)
  apiurl = 'https://be-prod20210714.evey.io/';
} else if (window.location.href.includes('dev-k8s')) {
  socket = 'https://socket-dev-k8s.evey.io';
  apiurl = 'https://be-dev-k8s.evey.io/';
} else if (window.location.href.includes('evey-eks-test.evey.io')) {
  socket = 'https://socket.live.evey.io';
  apiurl = 'https://be-evey-eks-test.evey.io/';
} else if (window.location.href.includes('dev') || window.location.href.includes('3.16.170.246') || window.location.href.includes('3.137.211.48')) {
  socket = 'https://socket.dev.evey.io';
  apiurl = 'https://backend.evey.io/';
} else if (window.location.href.includes('staging')) {
  socket = 'https://socket-staging.evey.io';
  apiurl = 'https://backend.staging.evey.io/';
} else {
  socket = 'https://socket.live.evey.io';
  apiurl = 'https://be-evey-eks-test.evey.io/';
}

export const environment = {
  production: true,
  config: {
    socket_url : socket,
    api_url: apiurl,
    salt: salt
  }
};
