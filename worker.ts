import pi from './utils/pi';

addEventListener("message", (event: MessageEvent<number>) => {
    postMessage(pi(event.data));
})