import $ from 'jquery';
window.$ = $;
import _ from 'lodash';
window._ = _;

console.log('v');

window.loadV1 = function () {
    import('./v1').then((v) => {
        console.log(v)
    }).catch(error => 'An error occurred while loading the v1');
}
window.loadV2 = function () {
    import('./v2').then((v) => {
        console.log(v)
    }).catch(error => 'An error occurred while loading the v2');
}
window.loadV3 = function () {
    import('./v3').then((v) => {
        console.log(v)
    }).catch(error => 'An error occurred while loading the v3');
}